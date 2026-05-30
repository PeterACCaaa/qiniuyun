import type {
	AiFollowupResponse,
	AiReviewMode,
	AiReviewResponse,
	AnalyzeResponse,
	ReviewSkill,
	ReviewReport,
} from "../types/review";

export async function analyzePullRequest(prUrl: string): Promise<AnalyzeResponse> {
	const response = await fetch("/api/analyze-pr", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ prUrl }),
	});

	const payload = (await response.json()) as AnalyzeResponse;
	if (!response.ok && payload.ok === false) return payload;
	return payload;
}

export async function askAiReviewFollowup({
	resultId,
	threadId,
	question,
}: {
	resultId: string;
	threadId?: string;
	question: string;
}): Promise<AiFollowupResponse> {
	const response = await fetch("/api/ai-followup", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ resultId, threadId, question }),
	});

	const payload = (await response.json()) as AiFollowupResponse;
	if (!response.ok && payload.ok === false) return payload;
	return payload;
}

export async function generateAiReview(
	report: ReviewReport,
	mode: AiReviewMode,
	skills: ReviewSkill[],
): Promise<AiReviewResponse> {
	const response = await fetch("/api/ai-review", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ report, mode, skills }),
	});

	const payload = (await response.json()) as AiReviewResponse;
	if (!response.ok && payload.ok === false) return payload;
	return payload;
}
