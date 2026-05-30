import { extractModelContent, normalizeBaseUrl } from "./ai-reviewer.mjs";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5-mini";
const MAX_HISTORY_MESSAGES = 12;
const MAX_SOURCE_CHARS = 32000;

export async function generateAiFollowup(context, thread, question, env = process.env) {
	const trimmedQuestion = typeof question === "string" ? question.trim() : "";
	if (!trimmedQuestion) {
		const error = new Error("追问内容不能为空。");
		error.statusCode = 400;
		throw error;
	}

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
	const payload = buildFollowupPayload(context, thread, trimmedQuestion, model);
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
		throw createFollowupModelError(response.status, data);
	}

	const content = extractModelContent(data);
	if (!content) {
		const error = new Error("AI 追问生成失败：模型没有返回可解析的文本内容。");
		error.statusCode = 502;
		throw error;
	}

	return {
		content,
		model,
		createdAt: new Date().toISOString(),
	};
}

export function buildFollowupPayload(context, thread, question, model) {
	return {
		model,
		text: { verbosity: "medium" },
		instructions: [
			"你是资深代码评审助手，正在回答用户对某一次 AI PR Review 结论的追问。",
			"只能基于已保存的 PR 上下文、风险地图、AI Review 结论和本线程历史回答。",
			"不要编造未提供的代码事实。无法确认时，明确说明需要人工复核。",
			"回答使用中文，直接回答用户问题，必要时给出可执行检查步骤。",
		].join("\n"),
		input: buildFollowupPrompt(context, thread, question),
	};
}

function buildFollowupPrompt(context, thread, question) {
	const report = context.report || {};
	const review = context.review || {};
	const history = thread.messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
		role: message.role,
		content: message.content,
	}));
	const source = truncate(
		JSON.stringify(
			{
				resultId: context.resultId,
				createdAt: context.createdAt,
				reviewMode: context.mode,
				reviewSkills: context.skills,
				pr: report.pr,
				riskOverview: report.riskOverview,
				riskCounts: report.riskCounts,
				findings: report.findings,
				fileContexts: normalizeFileContexts(report.fileContexts),
				changedFiles: normalizeChangedFiles(report.changedFiles),
				aiReview: {
					summary: review.summary,
					verdict: review.verdict,
					confidence: review.confidence,
					keyRisks: review.keyRisks,
					reviewerChecklist: review.reviewerChecklist,
					commentMarkdown: review.commentMarkdown,
					model: review.model,
					mode: review.mode,
					skills: review.skills,
					generatedAt: review.generatedAt,
				},
			},
			null,
			2,
		),
		MAX_SOURCE_CHARS,
	);

	return [
		"以下是本次 AI Review 的完整上下文快照：",
		source,
		"",
		"以下是当前追问线程的历史消息：",
		JSON.stringify(history, null, 2),
		"",
		"用户最新追问：",
		question,
	].join("\n");
}

function normalizeFileContexts(fileContexts) {
	if (!Array.isArray(fileContexts)) return [];

	return fileContexts.map((context) => ({
		filename: context.filename,
		highestSeverity: context.highestSeverity,
		riskCount: context.riskCount,
		reasons: context.reasons,
		base: normalizeVersion(context.base),
		head: normalizeVersion(context.head),
	}));
}

function normalizeVersion(version) {
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

function normalizeChangedFiles(changedFiles) {
	if (!Array.isArray(changedFiles)) return [];

	return changedFiles.map((file) => ({
		filename: file.filename,
		status: file.status,
		additions: file.additions,
		deletions: file.deletions,
		changes: file.changes,
		patch: file.patch,
	}));
}

function createFollowupModelError(status, data) {
	const message = data?.error?.message || data?.message || `HTTP ${status}`;
	const error = new Error(`AI 追问生成失败：${message}`);
	error.statusCode = status === 401 || status === 403 ? 401 : 502;
	return error;
}

function truncate(value, maxLength) {
	return value.length <= maxLength ? value : `${value.slice(0, maxLength)}\n...[truncated]`;
}
