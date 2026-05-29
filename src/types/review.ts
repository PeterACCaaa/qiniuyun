export type AnalyzeStatus = "idle" | "loading" | "success" | "error";

export type ReviewSeverity = "blocking" | "warning" | "suggestion";
export type RiskCategory =
	| "security"
	| "auth"
	| "data"
	| "dependency"
	| "delivery"
	| "test"
	| "reviewability"
	| "code-smell";

export type PullRequestInfo = {
	title: string;
	url: string;
	author: string;
	baseBranch: string;
	headBranch: string;
	changedFiles: number;
	additions: number;
	deletions: number;
	state: string;
	createdAt: string;
	updatedAt: string;
};

export type ChangedFile = {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	changes: number;
	patch: string;
	rawUrl: string;
	blobUrl: string;
};

export type ReviewFinding = {
	id: string;
	severity: ReviewSeverity;
	category: RiskCategory;
	file: string;
	lineHint: string;
	title: string;
	evidence: string;
	impact: string;
	suggestion: string;
	howToVerify: string;
	confidence: "high" | "medium" | "low";
};

export type FileVersionContext = {
	refName: string;
	refSha: string;
	status: "loaded" | "missing" | "error";
	content: string;
	truncated: boolean;
	size: number;
	error?: string;
};

export type FileContext = {
	filename: string;
	highestSeverity: ReviewSeverity;
	riskCount: number;
	reasons: string[];
	base: FileVersionContext;
	head: FileVersionContext;
};

export type ReviewReport = {
	pr: PullRequestInfo;
	changedFiles: ChangedFile[];
	summary: string;
	riskOverview: string;
	riskCounts: Record<ReviewSeverity, number>;
	findings: ReviewFinding[];
	fileContexts: FileContext[];
	nextSteps: string[];
	markdown: string;
};

export type AiReviewVerdict = "approve" | "comment" | "request_changes";

export type AiReviewRisk = {
	severity: ReviewSeverity;
	file: string;
	lineHint: string;
	title: string;
	reasoning: string;
	recommendation: string;
	confidence: "high" | "medium" | "low";
};

export type AiReview = {
	summary: string;
	verdict: AiReviewVerdict;
	confidence: "high" | "medium" | "low";
	keyRisks: AiReviewRisk[];
	reviewerChecklist: string[];
	commentMarkdown: string;
	model: string;
	generatedAt: string;
};

export type AnalyzeRequest = {
	prUrl: string;
};

export type AnalyzeResponse =
	| {
			ok: true;
			report: ReviewReport;
	  }
	| {
			ok: false;
			error: string;
	  };

export type AiReviewRequest = {
	report: ReviewReport;
};

export type AiReviewResponse =
	| {
			ok: true;
			review: AiReview;
	  }
	| {
			ok: false;
			error: string;
	  };
