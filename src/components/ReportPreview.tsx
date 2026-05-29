import type { ChangedFile, ReviewFinding, ReviewReport } from "../types/review";

type ReportPreviewProps = {
	report: ReviewReport | null;
	error: string;
};

export function ReportPreview({ report, error }: ReportPreviewProps) {
	if (error) {
		return (
			<section className="panel empty-state error-state">
				<h2>分析失败</h2>
				<p>{error}</p>
			</section>
		);
	}

	if (!report) {
		return (
			<section className="panel empty-state">
				<h2>等待输入 PR</h2>
				<p>报告区会展示真实 PR 概览、文件变更、风险地图和 Markdown 输出。</p>
			</section>
		);
	}

	return (
		<div className="report-grid">
			<section className="panel pr-card">
				<div className="section-title">
					<span>PR 概览</span>
					<a href={report.pr.url} target="_blank" rel="noreferrer">
						打开 PR
					</a>
				</div>
				<h2>{report.pr.title}</h2>
				<div className="meta-grid">
					<span>作者：{report.pr.author}</span>
					<span>状态：{report.pr.state}</span>
					<span>
						分支：{report.pr.headBranch} → {report.pr.baseBranch}
					</span>
					<span>文件：{report.pr.changedFiles}</span>
					<span>
						变更：+{report.pr.additions} / -{report.pr.deletions}
					</span>
					<span>更新：{formatDate(report.pr.updatedAt)}</span>
				</div>
			</section>

			<section className="panel">
				<div className="section-title">变更总结</div>
				<p className="body-text">{report.summary}</p>
			</section>

			<section className="panel">
				<div className="section-title">风险地图</div>
				<div className="risk-counts">
					<span className="risk-count blocking">{report.riskCounts.blocking} blocking</span>
					<span className="risk-count warning">{report.riskCounts.warning} warning</span>
					<span className="risk-count suggestion">
						{report.riskCounts.suggestion} suggestion
					</span>
				</div>
				<p className="body-text">{report.riskOverview}</p>
			</section>

			<section className="panel files-panel">
				<div className="section-title">
					<span>Changed Files</span>
					<span>{report.changedFiles.length} files</span>
				</div>
				<div className="file-list">
					{report.changedFiles.map((file) => (
						<ChangedFileRow key={file.filename} file={file} />
					))}
				</div>
			</section>

			<section className="panel findings-panel">
				<div className="section-title">Review Priorities</div>
				{report.findings.length ? (
					<div className="finding-list">
						{report.findings.map((finding) => (
							<FindingCard key={finding.id} finding={finding} />
						))}
					</div>
				) : (
					<p className="body-text">
						风险地图没有发现明显确定性风险。下一步 AI 分析会继续检查语义层面的问题。
					</p>
				)}
			</section>

			<section className="panel markdown-panel">
				<div className="section-title">Markdown 输出</div>
				<pre>{report.markdown}</pre>
			</section>
		</div>
	);
}

function ChangedFileRow({ file }: { file: ChangedFile }) {
	return (
		<article className="changed-file">
			<div className="changed-file-main">
				<a href={file.blobUrl || file.rawUrl} target="_blank" rel="noreferrer">
					{file.filename}
				</a>
				<span className={`file-status status-${file.status}`}>{file.status}</span>
			</div>
			<div className="changed-file-stats">
				<span className="additions">+{file.additions}</span>
				<span className="deletions">-{file.deletions}</span>
				<span>{file.changes} changes</span>
			</div>
			{file.patch && <code>{firstPatchLine(file.patch)}</code>}
		</article>
	);
}

function FindingCard({ finding }: { finding: ReviewFinding }) {
	return (
		<article className={`finding finding-${finding.severity}`}>
			<div className="finding-head">
				<div>
					<strong>{finding.title}</strong>
					<p className="file-line">
						{finding.file}:{finding.lineHint}
					</p>
				</div>
				<div className="finding-tags">
					<span>{finding.severity}</span>
					<span>{finding.category}</span>
					<span>{finding.confidence}</span>
				</div>
			</div>
			<div className="finding-detail">
				<DetailRow label="Evidence" value={finding.evidence} />
				<DetailRow label="Impact" value={finding.impact} />
				<DetailRow label="Suggestion" value={finding.suggestion} />
				<DetailRow label="Verify" value={finding.howToVerify} />
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

function firstPatchLine(patch: string) {
	return patch.split("\n").find((line) => line.startsWith("@@")) || "patch available";
}

function formatDate(value: string) {
	if (!value) return "unknown";
	return new Date(value).toLocaleString("zh-CN");
}
