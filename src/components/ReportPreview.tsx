import type { ReviewFinding, ReviewReport } from "../types/review";

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
				<p>报告区会展示 PR 概览、风险分布、Review 建议和可复制 Markdown。</p>
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
					<span>
						分支：{report.pr.headBranch} → {report.pr.baseBranch}
					</span>
					<span>文件：{report.pr.changedFiles}</span>
					<span>
						+{report.pr.additions} / -{report.pr.deletions}
					</span>
				</div>
			</section>

			<section className="panel">
				<div className="section-title">变更总结</div>
				<p className="body-text">{report.summary}</p>
			</section>

			<section className="panel">
				<div className="section-title">风险概览</div>
				<p className="body-text">{report.riskOverview}</p>
			</section>

			<section className="panel findings-panel">
				<div className="section-title">Review 建议</div>
				<div className="finding-list">
					{report.findings.map((finding) => (
						<FindingCard key={finding.id} finding={finding} />
					))}
				</div>
			</section>

			<section className="panel markdown-panel">
				<div className="section-title">Markdown 输出</div>
				<pre>{report.markdown}</pre>
			</section>
		</div>
	);
}

function FindingCard({ finding }: { finding: ReviewFinding }) {
	return (
		<article className={`finding finding-${finding.severity}`}>
			<div className="finding-head">
				<strong>{finding.title}</strong>
				<span>{finding.severity}</span>
			</div>
			<p className="file-line">
				{finding.file}:{finding.lineHint}
			</p>
			<p>{finding.reason}</p>
			<p className="suggestion">{finding.suggestion}</p>
			<small>confidence: {finding.confidence}</small>
		</article>
	);
}
