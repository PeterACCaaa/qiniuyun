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
export type AiReviewMode = "fast" | "standard" | "deep";
export type ReviewSkill =
	| "security"
	| "test"
	| "maintainability"
	| "performance"
	| "frontend"
	| "backend";

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
	resultId?: string;
	summary: string;
	verdict: AiReviewVerdict;
	confidence: "high" | "medium" | "low";
	keyRisks: AiReviewRisk[];
	reviewerChecklist: string[];
	commentMarkdown: string;
	model: string;
	mode: AiReviewMode;
	skills: ReviewSkill[];
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
	mode: AiReviewMode;
	skills: ReviewSkill[];
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

export type AiFollowupMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
	model?: string;
	createdAt: string;
};

export type AiFollowupAnswer = {
	content: string;
	model: string;
	createdAt: string;
};

export type AiFollowupRequest = {
	resultId: string;
	threadId?: string;
	question: string;
};

export type AiFollowupResponse =
	| {
			ok: true;
			threadId: string;
			answer: AiFollowupAnswer;
			messages: AiFollowupMessage[];
	  }
	| {
			ok: false;
			error: string;
	  };
