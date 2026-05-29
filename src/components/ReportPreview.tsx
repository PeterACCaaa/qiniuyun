import { useState } from "react";
import {
	displayCategory,
	displayFinding,
	displayRiskOverview,
	displaySeverity,
	displaySummary,
} from "../lib/display-i18n";
import type {
	AiReview,
	AiReviewMode,
	AiReviewRisk,
	ChangedFile,
	FileContext,
	FileVersionContext,
	ReviewFinding,
	ReviewReport,
	ReviewSkill,
} from "../types/review";

type ReportPreviewProps = {
	report: ReviewReport | null;
	error: string;
	loading: boolean;
	showChinese: boolean;
	aiReview: AiReview | null;
	aiLoading: boolean;
	aiError: string;
	aiMode: AiReviewMode;
	reviewSkills: ReviewSkill[];
	onModeChange: (mode: AiReviewMode) => void;
	onSkillsChange: (skills: ReviewSkill[]) => void;
	onGenerateAiReview: () => void;
};

export function ReportPreview({
	report,
	error,
	loading,
	showChinese,
	aiReview,
	aiLoading,
	aiError,
	aiMode,
	reviewSkills,
	onModeChange,
	onSkillsChange,
	onGenerateAiReview,
}: ReportPreviewProps) {
	if (error) {
		return (
			<section className="panel empty-state error-state">
				<h2>分析失败</h2>
				<p>{error}</p>
			</section>
		);
	}

	if (loading) return <ScanningState />;

	if (!report) {
		return (
			<section className="panel empty-state">
				<h2>等待输入 PR</h2>
				<p>报告区会展示真实 PR 概览、文件变更、风险地图和 Markdown 输出。</p>
			</section>
		);
	}

	const totalRisk =
		report.riskCounts.blocking +
		report.riskCounts.warning +
		report.riskCounts.suggestion;
	const highestSeverity = getHighestSeverity(report);

	return (
		<div className="report-workspace">
			<section className="panel pr-card reveal">
				<div className="section-title">
					<span>PR 概览</span>
					<a href={report.pr.url} target="_blank" rel="noreferrer">
						打开 PR
					</a>
				</div>
				<h2>{report.pr.title}</h2>
				<div className="meta-grid">
					<span>作者：{report.pr.author}</span>
					<span>状态：{displayPrState(report.pr.state, showChinese)}</span>
					<span>
						分支：{report.pr.headBranch} → {report.pr.baseBranch}
					</span>
					<span>更新：{formatDate(report.pr.updatedAt)}</span>
				</div>
			</section>

			<section className="metric-grid">
				<MetricCard
					label={showChinese ? "变更文件" : "Changed Files"}
					value={report.pr.changedFiles}
				/>
				<MetricCard
					label={showChinese ? "新增 / 删除" : "Additions / Deletions"}
					value={`+${report.pr.additions} / -${report.pr.deletions}`}
				/>
				<MetricCard
					label={showChinese ? "风险信号" : "Risk Signals"}
					value={totalRisk}
				/>
				<MetricCard
					label={showChinese ? "最高风险等级" : "Highest Severity"}
					value={displaySeverity(highestSeverity, showChinese)}
				/>
			</section>

			<section className="dashboard-grid">
				<div className="panel risk-visual reveal">
					<div className="section-title">风险分布</div>
					<RiskDonut report={report} showChinese={showChinese} />
					<p className="body-text">
						{displayRiskOverview(report.riskOverview, showChinese)}
					</p>
				</div>

				<div className="panel summary-card reveal">
					<div className="section-title">变更总结</div>
					<p className="body-text">{displaySummary(report.summary, showChinese)}</p>
				</div>
			</section>

			<section className="panel files-panel reveal">
				<div className="section-title">
					<span>{showChinese ? "变更文件" : "Changed Files"}</span>
					<span>
						{showChinese
							? `${report.changedFiles.length} 个文件`
							: `${report.changedFiles.length} files`}
					</span>
				</div>
				<div className="file-list">
					{report.changedFiles.map((file) => (
						<ChangedFileRow key={file.filename} file={file} showChinese={showChinese} />
					))}
				</div>
			</section>

			<section className="panel findings-panel reveal">
				<div className="section-title">
					{showChinese ? "Review 优先级" : "Review Priorities"}
				</div>
				{report.findings.length ? (
					<div className="finding-list">
						{report.findings.map((finding) => (
							<FindingCard
								key={finding.id}
								finding={finding}
								showChinese={showChinese}
							/>
						))}
					</div>
				) : (
					<p className="body-text">
						风险地图没有发现明显确定性风险。下一步 AI 分析会继续检查语义层面的问题。
					</p>
				)}
			</section>

			<FileContextPanel contexts={report.fileContexts} showChinese={showChinese} />

			<AiReviewPanel
				review={aiReview}
				loading={aiLoading}
				error={aiError}
				showChinese={showChinese}
				mode={aiMode}
				skills={reviewSkills}
				onModeChange={onModeChange}
				onSkillsChange={onSkillsChange}
				onGenerate={onGenerateAiReview}
			/>

			<section className="panel markdown-panel reveal">
				<div className="section-title">
					{showChinese ? "Markdown 输出" : "Markdown Output"}
				</div>
				<pre>{report.markdown}</pre>
			</section>
		</div>
	);
}

function FileContextPanel({
	contexts,
	showChinese,
}: {
	contexts: FileContext[];
	showChinese: boolean;
}) {
	return (
		<section className="panel context-panel reveal">
			<div className="section-title">
				<span>{showChinese ? "高风险文件上下文" : "High-risk File Context"}</span>
				<span>
					{showChinese
						? `${contexts.length} 个文件`
						: `${contexts.length} files`}
				</span>
			</div>
			{contexts.length ? (
				<div className="context-list">
					{contexts.map((context) => (
						<ContextCard
							key={context.filename}
							context={context}
							showChinese={showChinese}
						/>
					))}
				</div>
			) : (
				<p className="body-text">
					{showChinese
						? "当前风险结果没有需要补全完整文件上下文的目标。"
						: "No high-risk file needed full-context enrichment."}
				</p>
			)}
		</section>
	);
}

function ContextCard({
	context,
	showChinese,
}: {
	context: FileContext;
	showChinese: boolean;
}) {
	return (
		<article className="context-card">
			<div className="context-card-head">
				<div>
					<strong>{context.filename}</strong>
					<p>
						{showChinese
							? `${context.riskCount} 个风险信号`
							: `${context.riskCount} risk signals`}
					</p>
				</div>
				<div className="finding-tags">
					<span>{displaySeverity(context.highestSeverity, showChinese)}</span>
				</div>
			</div>
			<div className="context-version-grid">
				<VersionBadge
					label={showChinese ? "Base 旧版本" : "Base version"}
					version={context.base}
					showChinese={showChinese}
				/>
				<VersionBadge
					label={showChinese ? "Head 新版本" : "Head version"}
					version={context.head}
					showChinese={showChinese}
				/>
			</div>
			<div className="context-reasons">
				{context.reasons.slice(0, 3).map((reason) => (
					<span key={reason}>{reason}</span>
				))}
			</div>
		</article>
	);
}

function VersionBadge({
	label,
	version,
	showChinese,
}: {
	label: string;
	version: FileVersionContext;
	showChinese: boolean;
}) {
	return (
		<div className={`version-badge version-${version.status}`}>
			<span>{label}</span>
			<strong>{displayContextStatus(version.status, showChinese)}</strong>
			<p>
				{version.status === "loaded"
					? showChinese
						? `${version.size} 字符${version.truncated ? "，已截断" : ""}`
						: `${version.size} chars${version.truncated ? ", truncated" : ""}`
					: version.error || version.refName}
			</p>
		</div>
	);
}

function AiReviewPanel({
	review,
	loading,
	error,
	showChinese,
	mode,
	skills,
	onModeChange,
	onSkillsChange,
	onGenerate,
}: {
	review: AiReview | null;
	loading: boolean;
	error: string;
	showChinese: boolean;
	mode: AiReviewMode;
	skills: ReviewSkill[];
	onModeChange: (mode: AiReviewMode) => void;
	onSkillsChange: (skills: ReviewSkill[]) => void;
	onGenerate: () => void;
}) {
	return (
		<section className="panel ai-panel reveal">
			<div className="section-title ai-panel-title">
				<div>
					<span>{showChinese ? "AI 深度 Review" : "AI Deep Review"}</span>
					<p>
						{showChinese
							? "基于真实 PR diff 和风险地图调用大模型生成。"
							: "Generated from real PR diff and the deterministic risk map."}
					</p>
				</div>
				<div className="ai-actions">
					<ModeSelector
						mode={mode}
						disabled={loading}
						showChinese={showChinese}
						onChange={onModeChange}
					/>
					<SkillSelector
						skills={skills}
						disabled={loading}
						showChinese={showChinese}
						onChange={onSkillsChange}
					/>
					<button className="secondary-button" disabled={loading} onClick={onGenerate}>
						{loading
							? showChinese
								? "生成中..."
								: "Generating..."
							: showChinese
								? "生成 AI Review"
								: "Generate AI Review"}
					</button>
				</div>
			</div>

			{error && <p className="inline-error">{error}</p>}
			{loading && (
				<div className="ai-loading">
					<div className="scanner-orbit" />
					<p>{showChinese ? "正在请求真实大模型..." : "Calling the live model..."}</p>
				</div>
			)}
			{review && !loading && <AiReviewResult review={review} showChinese={showChinese} />}
			{!review && !loading && !error && (
				<p className="body-text">
					{showChinese
						? "先生成风险地图，再让 AI 把高风险证据转成 reviewer 可执行的结论。"
						: "Generate an AI review after the risk map is ready."}
				</p>
			)}
		</section>
	);
}

function ModeSelector({
	mode,
	disabled,
	showChinese,
	onChange,
}: {
	mode: AiReviewMode;
	disabled: boolean;
	showChinese: boolean;
	onChange: (mode: AiReviewMode) => void;
}) {
	const options: Array<{
		value: AiReviewMode;
		label: string;
		description: string;
	}> = [
		{
			value: "fast",
			label: showChinese ? "快速" : "Fast",
			description: "low",
		},
		{
			value: "standard",
			label: showChinese ? "标准" : "Standard",
			description: "medium",
		},
		{
			value: "deep",
			label: showChinese ? "深度" : "Deep",
			description: "xhigh",
		},
	];

	return (
		<div className="mode-selector" role="group" aria-label="AI Review mode">
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					className={mode === option.value ? "active" : ""}
					disabled={disabled}
					onClick={() => onChange(option.value)}
					title={option.description}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}

function SkillSelector({
	skills,
	disabled,
	showChinese,
	onChange,
}: {
	skills: ReviewSkill[];
	disabled: boolean;
	showChinese: boolean;
	onChange: (skills: ReviewSkill[]) => void;
}) {
	const options: ReviewSkill[] = [
		"security",
		"test",
		"maintainability",
		"performance",
		"frontend",
		"backend",
	];

	function toggleSkill(skill: ReviewSkill) {
		if (skills.includes(skill)) {
			onChange(skills.filter((item) => item !== skill));
			return;
		}

		onChange([...skills, skill]);
	}

	return (
		<div className="skill-selector" aria-label="Review skills">
			<span>{showChinese ? "Review 技能" : "Review Skills"}</span>
			<div>
				{options.map((skill) => {
					const active = skills.includes(skill);
					return (
						<button
							key={skill}
							type="button"
							className={active ? "active" : ""}
							disabled={disabled}
							onClick={() => toggleSkill(skill)}
							title={displayReviewSkillDescription(skill)}
						>
							{active ? "✓ " : ""}
							{displayReviewSkill(skill, showChinese)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

function AiReviewResult({
	review,
	showChinese,
}: {
	review: AiReview;
	showChinese: boolean;
}) {
	return (
		<div className="ai-result">
			<div className="ai-meta-grid">
				<MetricCard
					label={showChinese ? "模型" : "Model"}
					value={review.model}
				/>
				<MetricCard
					label={showChinese ? "模式" : "Mode"}
					value={displayReviewMode(review.mode, showChinese)}
				/>
				<MetricCard
					label={showChinese ? "结论" : "Verdict"}
					value={displayVerdict(review.verdict, showChinese)}
				/>
				<MetricCard
					label={showChinese ? "置信度" : "Confidence"}
					value={displayConfidence(review.confidence, showChinese)}
				/>
			</div>
			{review.skills.length > 0 && (
				<div className="skill-pill-row">
					<span>{showChinese ? "已启用技能" : "Enabled Skills"}</span>
					{review.skills.map((skill) => (
						<strong key={skill}>{displayReviewSkill(skill, showChinese)}</strong>
					))}
				</div>
			)}
			<p className="body-text">{review.summary}</p>

			<div className="ai-risk-list">
				{review.keyRisks.map((risk, index) => (
					<AiRiskCard
						key={`${risk.file}:${risk.lineHint}:${index}`}
						risk={risk}
						showChinese={showChinese}
					/>
				))}
			</div>

			{review.reviewerChecklist.length > 0 && (
				<div className="checklist">
					<strong>{showChinese ? "人工复核清单" : "Reviewer Checklist"}</strong>
					<ul>
						{review.reviewerChecklist.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			)}

			<div className="markdown-panel ai-comment">
				<div className="section-title">
					<span>
						{showChinese ? "可复制 Review Comment" : "Copy-ready Review Comment"}
					</span>
					<CopyButton text={review.commentMarkdown} showChinese={showChinese} />
				</div>
				<pre>{review.commentMarkdown}</pre>
			</div>
		</div>
	);
}

function CopyButton({
	text,
	showChinese,
}: {
	text: string;
	showChinese: boolean;
}) {
	const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(text);
			setState("copied");
			window.setTimeout(() => setState("idle"), 1600);
		} catch {
			setState("failed");
			window.setTimeout(() => setState("idle"), 2200);
		}
	}

	return (
		<button className="copy-button" type="button" onClick={handleCopy}>
			{state === "copied" && (showChinese ? "已复制" : "Copied")}
			{state === "failed" && (showChinese ? "复制失败" : "Copy failed")}
			{state === "idle" && (showChinese ? "复制" : "Copy")}
		</button>
	);
}

function AiRiskCard({
	risk,
	showChinese,
}: {
	risk: AiReviewRisk;
	showChinese: boolean;
}) {
	return (
		<article className={`finding finding-${risk.severity}`}>
			<div className="finding-head">
				<div>
					<strong>{risk.title}</strong>
					<p className="file-line">
						{risk.file}:{risk.lineHint}
					</p>
				</div>
				<div className="finding-tags">
					<span>{displaySeverity(risk.severity, showChinese)}</span>
					<span>{displayConfidence(risk.confidence, showChinese)}</span>
				</div>
			</div>
			<div className="finding-detail">
				<DetailRow label={showChinese ? "判断" : "Reasoning"} value={risk.reasoning} />
				<DetailRow
					label={showChinese ? "建议" : "Recommendation"}
					value={risk.recommendation}
				/>
			</div>
		</article>
	);
}

function ScanningState() {
	return (
		<section className="panel scanning-state">
			<div className="scanner-orbit" />
			<div>
				<h2>正在生成风险地图</h2>
				<p>拉取 PR 元信息、读取 changed files，并执行确定性规则扫描。</p>
			</div>
		</section>
	);
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
	return (
		<article className="metric-card reveal">
			<span>{label}</span>
			<strong>{value}</strong>
		</article>
	);
}

function RiskDonut({
	report,
	showChinese,
}: {
	report: ReviewReport;
	showChinese: boolean;
}) {
	const total =
		report.riskCounts.blocking +
		report.riskCounts.warning +
		report.riskCounts.suggestion;
	const blocking = total ? (report.riskCounts.blocking / total) * 100 : 0;
	const warning = total ? (report.riskCounts.warning / total) * 100 : 0;
	const suggestion = total ? (report.riskCounts.suggestion / total) * 100 : 0;
	const gradient = total
		? `conic-gradient(#bd3b3b 0 ${blocking}%, #d99b25 ${blocking}% ${
				blocking + warning
			}%, #1f7a6d ${blocking + warning}% ${blocking + warning + suggestion}%)`
		: "conic-gradient(#dce3dc 0 100%)";

	return (
		<div className="risk-donut-wrap">
			<div className="risk-donut" style={{ background: gradient }}>
				<div>
					<strong>{total}</strong>
					<span>{showChinese ? "风险" : "signals"}</span>
				</div>
			</div>
			<div className="risk-legend">
				<LegendItem
					color="blocking"
					label={displaySeverity("blocking", showChinese)}
					value={report.riskCounts.blocking}
				/>
				<LegendItem
					color="warning"
					label={displaySeverity("warning", showChinese)}
					value={report.riskCounts.warning}
				/>
				<LegendItem
					color="suggestion"
					label={displaySeverity("suggestion", showChinese)}
					value={report.riskCounts.suggestion}
				/>
			</div>
		</div>
	);
}

function LegendItem({
	color,
	label,
	value,
}: {
	color: string;
	label: string;
	value: number;
}) {
	return (
		<div className="legend-item">
			<span className={`legend-dot ${color}`} />
			<p>{label}</p>
			<strong>{value}</strong>
		</div>
	);
}

function ChangedFileRow({
	file,
	showChinese,
}: {
	file: ChangedFile;
	showChinese: boolean;
}) {
	const total = Math.max(file.additions + file.deletions, 1);
	const addWidth = `${(file.additions / total) * 100}%`;
	const delWidth = `${(file.deletions / total) * 100}%`;

	return (
		<article className="changed-file">
			<div className="changed-file-main">
				<a href={file.blobUrl || file.rawUrl} target="_blank" rel="noreferrer">
					{file.filename}
				</a>
				<span className={`file-status status-${file.status}`}>
					{displayFileStatus(file.status, showChinese)}
				</span>
			</div>
			<div className="changed-file-stats">
				<span className="additions">+{file.additions}</span>
				<span className="deletions">-{file.deletions}</span>
				<span>
					{showChinese ? `${file.changes} 行变更` : `${file.changes} changes`}
				</span>
			</div>
			<div className="change-bar" aria-hidden="true">
				<span className="change-add" style={{ width: addWidth }} />
				<span className="change-del" style={{ width: delWidth }} />
			</div>
			{file.patch && <code>{firstPatchLine(file.patch)}</code>}
		</article>
	);
}

function FindingCard({
	finding,
	showChinese,
}: {
	finding: ReviewFinding;
	showChinese: boolean;
}) {
	const item = displayFinding(finding, showChinese);
	const severity = showChinese ? item.severity : finding.severity;
	const category = showChinese
		? item.category
		: displayCategory(finding.category, false);

	return (
		<article className={`finding finding-${finding.severity}`}>
			<div className="finding-head">
				<div>
					<strong>{item.title}</strong>
					<p className="file-line">
						{finding.file}:{finding.lineHint}
					</p>
				</div>
				<div className="finding-tags">
					<span>{severity}</span>
					<span>{category}</span>
					<span>{item.confidence}</span>
				</div>
			</div>
			<div className="finding-detail">
				<DetailRow label={showChinese ? "证据" : "Evidence"} value={item.evidence} />
				<DetailRow label={showChinese ? "影响" : "Impact"} value={item.impact} />
				<DetailRow
					label={showChinese ? "建议" : "Suggestion"}
					value={item.suggestion}
				/>
				<DetailRow
					label={showChinese ? "复核" : "Verify"}
					value={item.howToVerify}
				/>
			</div>
		</article>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="finding-detail-row">
			<span>{label}</span>
			<p>{value}</p>
		</div>
	);
}

function getHighestSeverity(report: ReviewReport) {
	if (report.riskCounts.blocking) return "blocking";
	if (report.riskCounts.warning) return "warning";
	if (report.riskCounts.suggestion) return "suggestion";
	return "clear";
}

function displayPrState(value: string, chinese: boolean) {
	if (!chinese) return value;
	const map: Record<string, string> = {
		open: "打开",
		closed: "已关闭",
		merged: "已合并",
	};
	return map[value] || value;
}

function displayFileStatus(value: string, chinese: boolean) {
	if (!chinese) return value;
	const map: Record<string, string> = {
		added: "新增",
		modified: "修改",
		removed: "删除",
		renamed: "重命名",
	};
	return map[value] || value;
}

function displayVerdict(value: string, chinese: boolean) {
	if (!chinese) return value;
	const map: Record<string, string> = {
		approve: "可通过",
		comment: "建议补充",
		request_changes: "建议修改",
	};
	return map[value] || value;
}

function displayConfidence(value: string, chinese: boolean) {
	if (!chinese) return value;
	const map: Record<string, string> = {
		high: "高置信",
		medium: "中置信",
		low: "低置信",
	};
	return map[value] || value;
}

function displayReviewMode(value: string, chinese: boolean) {
	if (!chinese) return value;
	const map: Record<string, string> = {
		fast: "快速",
		standard: "标准",
		deep: "深度",
	};
	return map[value] || value;
}

function displayReviewSkill(value: ReviewSkill, chinese: boolean) {
	if (!chinese) {
		const map: Record<ReviewSkill, string> = {
			security: "Security",
			test: "Tests",
			maintainability: "Maintainability",
			performance: "Performance",
			frontend: "Frontend",
			backend: "Backend",
		};
		return map[value];
	}

	const map: Record<ReviewSkill, string> = {
		security: "安全",
		test: "测试",
		maintainability: "可维护性",
		performance: "性能",
		frontend: "前端",
		backend: "后端",
	};
	return map[value];
}

function displayReviewSkillDescription(value: ReviewSkill) {
	const map: Record<ReviewSkill, string> = {
		security: "Secrets, injection, auth boundaries",
		test: "Missing tests, edge cases, regression risk",
		maintainability: "Complexity, duplication, module boundaries",
		performance: "N+1, repeated work, rendering cost",
		frontend: "React state, UI behavior, accessibility",
		backend: "API contracts, errors, data consistency",
	};
	return map[value];
}

function displayContextStatus(value: string, chinese: boolean) {
	if (!chinese) return value;
	const map: Record<string, string> = {
		loaded: "已加载",
		missing: "不存在",
		error: "加载失败",
	};
	return map[value] || value;
}

function firstPatchLine(patch: string) {
	return patch.split("\n").find((line) => line.startsWith("@@")) || "patch available";
}

function formatDate(value: string) {
	if (!value) return "unknown";
	return new Date(value).toLocaleString("zh-CN");
}
