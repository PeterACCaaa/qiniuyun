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
				<p>报告区会展示真实 PR 概览、文件变更、后续风险分析和 Markdown 输出。</p>
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
				<div className="section-title">风险分析状态</div>
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
				<div className="section-title">Review 建议</div>
				{report.findings.length ? (
					<div className="finding-list">
						{report.findings.map((finding) => (
							<FindingCard key={finding.id} finding={finding} />
						))}
					</div>
				) : (
					<p className="body-text">
						当前切片只拉取真实 PR 数据。下一步接入规则扫描后，这里会展示文件级风险建议。
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

function firstPatchLine(patch: string) {
	return patch.split("\n").find((line) => line.startsWith("@@")) || "patch available";
}

function formatDate(value: string) {
	if (!value) return "unknown";
	return new Date(value).toLocaleString("zh-CN");
}
