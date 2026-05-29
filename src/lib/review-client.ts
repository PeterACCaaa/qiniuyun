import type { AiReviewResponse, AnalyzeResponse, ReviewReport } from "../types/review";

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

export async function generateAiReview(report: ReviewReport): Promise<AiReviewResponse> {
	const response = await fetch("/api/ai-review", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ report }),
	});

	const payload = (await response.json()) as AiReviewResponse;
	if (!response.ok && payload.ok === false) return payload;
	return payload;
}
