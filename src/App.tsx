import { useRef, useState } from "react";
import { PrInputPanel } from "./components/PrInputPanel";
import { ReportPreview } from "./components/ReportPreview";
import { analyzePullRequest, generateAiReview } from "./lib/review-client";
import { useShellIntroAnimation } from "./lib/use-gsap-animations";
import type {
	AiReview,
	AiReviewMode,
	AnalyzeStatus,
	ReviewSkill,
	ReviewReport,
} from "./types/review";

const SAMPLE_PR_URL = "https://github.com/PeterACCaaa/pr/pull/1";
const DEFAULT_REVIEW_SKILLS: ReviewSkill[] = [
	"security",
	"test",
	"maintainability",
];

export function App() {
	const shellRef = useRef<HTMLElement | null>(null);
	const [prUrl, setPrUrl] = useState(SAMPLE_PR_URL);
	const [status, setStatus] = useState<AnalyzeStatus>("idle");
	const [report, setReport] = useState<ReviewReport | null>(null);
	const [aiReview, setAiReview] = useState<AiReview | null>(null);
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState("");
	const [aiMode, setAiMode] = useState<AiReviewMode>("deep");
	const [reviewSkills, setReviewSkills] =
		useState<ReviewSkill[]>(DEFAULT_REVIEW_SKILLS);
	const [error, setError] = useState("");
	const [showChinese, setShowChinese] = useState(false);

	useShellIntroAnimation(shellRef);

	async function handleAnalyze() {
		const trimmedUrl = prUrl.trim();
		if (!trimmedUrl) return;

		setStatus("loading");
		setError("");
		setAiReview(null);
		setAiError("");

		const result = await analyzePullRequest(trimmedUrl);
		if (!result.ok) {
			setStatus("error");
			setError(result.error);
			return;
		}

		setReport(result.report);
		setStatus("success");
	}

	async function handleGenerateAiReview() {
		if (!report || aiLoading) return;

		setAiLoading(true);
		setAiError("");

		const result = await generateAiReview(report, aiMode, reviewSkills);
		if (!result.ok) {
			setAiError(result.error);
			setAiLoading(false);
			return;
		}

		setAiReview(result.review);
		setAiLoading(false);
	}

	return (
		<main className="app-shell" ref={shellRef}>
			<PrInputPanel
				value={prUrl}
				loading={status === "loading"}
				status={status}
				showChinese={showChinese}
				onLanguageChange={setShowChinese}
				onChange={setPrUrl}
				onSubmit={handleAnalyze}
			/>

			<div className="status-row">
				<span className={`status-dot status-${status}`} />
				<span>
					{status === "idle" && "准备就绪"}
					{status === "loading" && "正在拉取 PR 并生成风险地图"}
					{status === "success" && "风险地图已生成"}
					{status === "error" && "需要检查输入或 API"}
				</span>
			</div>

			<ReportPreview
				report={report}
				error={error}
				loading={status === "loading"}
				showChinese={showChinese}
				aiReview={aiReview}
				aiLoading={aiLoading}
				aiError={aiError}
				aiMode={aiMode}
				reviewSkills={reviewSkills}
				onModeChange={setAiMode}
				onSkillsChange={setReviewSkills}
				onGenerateAiReview={handleGenerateAiReview}
			/>
		</main>
	);
}
