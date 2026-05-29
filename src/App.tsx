import { useState } from "react";
import { PrInputPanel } from "./components/PrInputPanel";
import { ReportPreview } from "./components/ReportPreview";
import { analyzePullRequest } from "./lib/review-client";
import type { AnalyzeStatus, ReviewReport } from "./types/review";

const SAMPLE_PR_URL = "https://github.com/microsoft/TypeScript/pull/63513";

export function App() {
	const [prUrl, setPrUrl] = useState(SAMPLE_PR_URL);
	const [status, setStatus] = useState<AnalyzeStatus>("idle");
	const [report, setReport] = useState<ReviewReport | null>(null);
	const [error, setError] = useState("");

	async function handleAnalyze() {
		const trimmedUrl = prUrl.trim();
		if (!trimmedUrl) return;

		setStatus("loading");
		setError("");

		const result = await analyzePullRequest(trimmedUrl);
		if (!result.ok) {
			setStatus("error");
			setError(result.error);
			return;
		}

		setReport(result.report);
		setStatus("success");
	}

	return (
		<main className="app-shell">
			<PrInputPanel
				value={prUrl}
				loading={status === "loading"}
				onChange={setPrUrl}
				onSubmit={handleAnalyze}
			/>

			<div className="status-row">
				<span className={`status-dot status-${status}`} />
				<span>
					{status === "idle" && "准备就绪"}
					{status === "loading" && "正在拉取 PR 并执行规则扫描"}
					{status === "success" && "报告已生成"}
					{status === "error" && "需要检查输入或 API"}
				</span>
			</div>

			<ReportPreview report={report} error={error} />
		</main>
	);
}
