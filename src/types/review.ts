export type AnalyzeStatus = "idle" | "loading" | "success" | "error";

export type ReviewSeverity = "blocking" | "warning" | "suggestion";

export type PullRequestInfo = {
	title: string;
	url: string;
	author: string;
	baseBranch: string;
	headBranch: string;
	changedFiles: number;
	additions: number;
	deletions: number;
};

export type ReviewFinding = {
	id: string;
	severity: ReviewSeverity;
	file: string;
	lineHint: string;
	title: string;
	reason: string;
	suggestion: string;
	confidence: "high" | "medium" | "low";
};

export type ReviewReport = {
	pr: PullRequestInfo;
	summary: string;
	riskOverview: string;
	findings: ReviewFinding[];
	nextSteps: string[];
	markdown: string;
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
