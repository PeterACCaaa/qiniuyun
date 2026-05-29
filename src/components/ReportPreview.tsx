import {
	displayCategory,
	displayFinding,
	displayRiskOverview,
	displaySeverity,
	displaySummary,
} from "../lib/display-i18n";
import type { ChangedFile, ReviewFinding, ReviewReport } from "../types/review";

type ReportPreviewProps = {
	report: ReviewReport | null;
	error: string;
	loading: boolean;
	showChinese: boolean;
};

export function ReportPreview({
	report,
	error,
	loading,
	showChinese,
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

			<section className="panel markdown-panel reveal">
				<div className="section-title">
					{showChinese ? "Markdown 输出" : "Markdown Output"}
				</div>
				<pre>{report.markdown}</pre>
			</section>
		</div>
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

function firstPatchLine(patch: string) {
	return patch.split("\n").find((line) => line.startsWith("@@")) || "patch available";
}

function formatDate(value: string) {
	if (!value) return "unknown";
	return new Date(value).toLocaleString("zh-CN");
}
