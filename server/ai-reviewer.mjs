const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5-mini";
const MAX_PATCH_CHARS = 24000;

export async function generateAiReview(report, env = process.env) {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		const error = new Error(
			"缺少 OPENAI_API_KEY。请在服务端 .env 中配置后重启 npm run api。",
		);
		error.statusCode = 400;
		throw error;
	}

	const baseUrl =
		env.OPENAI_BASE_URL ||
		env.OPENAI_API_BASE_URL ||
		env.OPENAI_API_BASE ||
		DEFAULT_BASE_URL;
	const model = env.OPENAI_MODEL || DEFAULT_MODEL;
	const payload = buildRequestPayload(report, model);
	const response = await fetch(`${normalizeBaseUrl(baseUrl)}/responses`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw createModelError(response.status, data);
	}

	const content = extractModelContent(data);
	if (!content) {
		throw createInvalidModelOutputError(
			`模型没有返回可解析的文本内容。${describeEmptyResponse(data)}`,
		);
	}

	return normalizeAiReview(parseJsonContent(content), { model });
}

export function extractModelContent(data) {
	const choice = data?.choices?.[0];
	const message = choice?.message || {};
	const candidates = [
		message.content,
		message.text,
		choice?.text,
		data?.output_text,
		extractResponsesOutput(data),
		message.reasoning_content,
		message.reasoning,
	];

	for (const candidate of candidates) {
		const text = stringifyContent(candidate);
		if (text) return text;
	}

	return "";
}

function buildRequestPayload(report, model) {
	return {
		model,
		reasoning: { effort: normalizeReasoningEffort(process.env.OPENAI_REASONING_EFFORT) },
		text: { verbosity: normalizeTextVerbosity(process.env.OPENAI_TEXT_VERBOSITY) },
		instructions: [
			"你是资深代码评审助手，只基于用户提供的 PR 元信息、changed files、patch 和规则扫描结果输出审查建议。",
			"不要编造未提供的代码上下文。无法确认的问题要降低置信度，并写明需要人工复核。",
			"输出必须是严格 JSON，不要包含 Markdown 代码围栏。",
		].join("\n"),
		input: buildPrompt(report),
	};
}

function normalizeReasoningEffort(value) {
	if (["low", "medium", "high", "xhigh"].includes(value)) return value;
	return "low";
}

function normalizeTextVerbosity(value) {
	if (["low", "medium", "high"].includes(value)) return value;
	return "low";
}

export function normalizeBaseUrl(rawUrl) {
	const trimmed = rawUrl.trim().replace(/\/+$/, "");
	return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function buildPrompt(report) {
	const context = {
		pr: report?.pr,
		summary: report?.summary,
		riskOverview: report?.riskOverview,
		riskCounts: report?.riskCounts,
		findings: Array.isArray(report?.findings) ? report.findings : [],
		fileContexts: normalizeFileContexts(report),
		changedFiles: normalizeChangedFiles(report),
	};

	return [
		"请生成中文 AI PR Review 报告。",
		"必须返回以下 JSON 结构：",
		JSON.stringify(
			{
				summary: "3-5 句中文总结，说明 PR 做了什么和主要风险",
				verdict: "approve | comment | request_changes",
				confidence: "high | medium | low",
				keyRisks: [
					{
						severity: "blocking | warning | suggestion",
						file: "文件路径或 PR",
						lineHint: "行号、patch hunk 或 path",
						title: "问题标题",
						reasoning: "为什么这里值得关注",
						recommendation: "具体修改或复核建议",
						confidence: "high | medium | low",
					},
				],
				reviewerChecklist: ["人工 reviewer 应该核对的事项"],
				commentMarkdown: "可直接复制到 GitHub PR 的中文 Markdown Review Comment",
			},
			null,
			2,
		),
		"约束：",
		"- keyRisks 最多 6 条，优先使用规则扫描 findings 中有证据的风险。",
		"- 对 hardcoded secret、SQL 拼接、权限相关路径要重点判断。",
		"- 如果 fileContexts 中有 base/head 完整文件内容，必须优先结合完整上下文判断，不要只看 patch。",
		"- 如果 base 缺失但 head 存在，说明这是新增文件；如果 head 缺失，说明文件可能被删除。",
		"- commentMarkdown 要短而可执行，不要堆砌空话。",
		"- 如果 patch 不足以确认 bug，必须写成“需要复核”，不要直接断定。",
		"",
		"PR 上下文：",
		JSON.stringify(context, null, 2),
	].join("\n");
}

function normalizeFileContexts(report) {
	if (!Array.isArray(report?.fileContexts)) return [];

	return report.fileContexts.map((context) => ({
		filename: context.filename,
		highestSeverity: context.highestSeverity,
		riskCount: context.riskCount,
		reasons: context.reasons,
		base: normalizeVersionForPrompt(context.base),
		head: normalizeVersionForPrompt(context.head),
	}));
}

function normalizeVersionForPrompt(version) {
	if (!version) return null;

	return {
		refName: version.refName,
		refSha: version.refSha,
		status: version.status,
		truncated: version.truncated,
		size: version.size,
		error: version.error,
		content: version.content,
	};
}

function normalizeChangedFiles(report) {
	if (!Array.isArray(report?.changedFiles)) return [];

	return report.changedFiles.map((file) => ({
		filename: file.filename,
		status: file.status,
		additions: file.additions,
		deletions: file.deletions,
		changes: file.changes,
		patch: truncate(file.patch || "", MAX_PATCH_CHARS),
	}));
}

function parseJsonContent(content) {
	const trimmed = content.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const jsonStart = trimmed.indexOf("{");
		const jsonEnd = trimmed.lastIndexOf("}");
		if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
			throw createInvalidModelOutputError("模型输出不是 JSON。");
		}
		try {
			return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
		} catch {
			throw createInvalidModelOutputError("模型输出 JSON 解析失败。");
		}
	}
}

function stringifyContent(value) {
	if (typeof value === "string") return value.trim();

	if (Array.isArray(value)) {
		return value.map(stringifyContent).filter(Boolean).join("\n").trim();
	}

	if (!value || typeof value !== "object") return "";

	return stringifyContent(
		value.text ||
			value.content ||
			value.output_text ||
			value.value ||
			value.message ||
			"",
	);
}

function extractResponsesOutput(data) {
	if (!Array.isArray(data?.output)) return "";

	return data.output
		.flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
		.map(stringifyContent)
		.filter(Boolean)
		.join("\n");
}

function describeEmptyResponse(data) {
	const choice = data?.choices?.[0];
	const message = choice?.message;
	const details = [];

	if (choice?.finish_reason) details.push(`finish_reason=${choice.finish_reason}`);
	if (message && typeof message === "object") {
		details.push(`message_fields=${Object.keys(message).join(",") || "none"}`);
	}
	if (data && typeof data === "object") {
		details.push(`response_fields=${Object.keys(data).join(",") || "none"}`);
	}

	return details.length ? `响应摘要：${details.join("; ")}。` : "";
}

function normalizeAiReview(value, meta) {
	if (!value || typeof value !== "object") {
		throw createInvalidModelOutputError("模型输出不是对象。");
	}

	const keyRisks = Array.isArray(value.keyRisks)
		? value.keyRisks.slice(0, 6).map(normalizeRisk).filter(Boolean)
		: [];
	const checklist = Array.isArray(value.reviewerChecklist)
		? value.reviewerChecklist.map(readString).filter(Boolean).slice(0, 8)
		: [];

	return {
		summary: readString(value.summary) || "模型未返回总结。",
		verdict: normalizeVerdict(value.verdict),
		confidence: normalizeConfidence(value.confidence),
		keyRisks,
		reviewerChecklist: checklist,
		commentMarkdown: readString(value.commentMarkdown) || buildFallbackComment(keyRisks),
		model: meta.model,
		generatedAt: new Date().toISOString(),
	};
}

function normalizeRisk(value) {
	if (!value || typeof value !== "object") return null;

	return {
		severity: normalizeSeverity(value.severity),
		file: readString(value.file) || "PR",
		lineHint: readString(value.lineHint) || "-",
		title: readString(value.title) || "需要复核的风险",
		reasoning: readString(value.reasoning) || "模型未返回原因。",
		recommendation: readString(value.recommendation) || "请 reviewer 手动复核。",
		confidence: normalizeConfidence(value.confidence),
	};
}

function createModelError(status, data) {
	const message = data?.error?.message || data?.message || `HTTP ${status}`;
	const hint = /upstream request failed/i.test(message)
		? "请检查 OPENAI_MODEL 是否被当前中转服务支持，以及 OPENAI_BASE_URL 是否指向兼容 Responses API 的 /v1 地址。"
		: "";
	const error = new Error(`AI Review 生成失败：${message}${hint ? ` ${hint}` : ""}`);
	error.statusCode = status === 401 || status === 403 ? 401 : 502;
	return error;
}

function createInvalidModelOutputError(message) {
	const error = new Error(`AI Review 生成失败：${message}`);
	error.statusCode = 502;
	return error;
}

function normalizeVerdict(value) {
	if (["approve", "comment", "request_changes"].includes(value)) return value;
	return "comment";
}

function normalizeSeverity(value) {
	if (["blocking", "warning", "suggestion"].includes(value)) return value;
	return "suggestion";
}

function normalizeConfidence(value) {
	if (["high", "medium", "low"].includes(value)) return value;
	return "medium";
}

function buildFallbackComment(keyRisks) {
	const lines = ["## AI Review", "", "请重点复核以下风险："];
	for (const risk of keyRisks) {
		lines.push(`- ${risk.file}:${risk.lineHint} ${risk.title}`);
	}
	return lines.join("\n");
}

function readString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function truncate(value, maxLength) {
	return value.length <= maxLength ? value : `${value.slice(0, maxLength)}\n...[truncated]`;
}
