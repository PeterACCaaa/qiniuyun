import type { AnalyzeResponse } from "../types/review";

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
