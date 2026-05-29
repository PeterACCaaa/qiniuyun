import { scanPullRequest } from "./rule-scan.mjs";

export function buildPullRequestReport(snapshot) {
	const findings = scanPullRequest(snapshot);
	const fileNames = snapshot.changedFiles.map((file) => file.filename);
	const severityCounts = countBySeverity(findings);
	const summary = buildSummary(snapshot, fileNames);
	const riskOverview = buildRiskOverview(findings, severityCounts);
	const markdown = buildMarkdown(snapshot, findings);

	return {
		pr: snapshot.pr,
		changedFiles: snapshot.changedFiles,
		summary,
		riskOverview,
		riskCounts: severityCounts,
		findings,
		nextSteps: [
			"Use AI to explain the highest-risk findings with PR context.",
			"Fetch surrounding source files for findings that need more context.",
			"Generate a reviewer-ready Markdown comment with confidence levels.",
		],
		markdown,
	};
}

function buildSummary(snapshot, fileNames) {
	if (!fileNames.length) {
		return "Fetched real GitHub PR data, but GitHub returned no changed files.";
	}

	const preview = fileNames.slice(0, 5).join(", ");
	const suffix = fileNames.length > 5 ? ", ..." : "";
	return `Fetched real GitHub PR data. This PR changes ${snapshot.pr.changedFiles} files (${snapshot.pr.additions} additions, ${snapshot.pr.deletions} deletions): ${preview}${suffix}.`;
}

function buildRiskOverview(findings, counts) {
	if (!findings.length) {
		return "Rule scan found no obvious deterministic risks. The next AI stage can focus on semantic code review.";
	}

	return `Risk map found ${findings.length} evidence-backed review priorities: ${counts.blocking} blocking, ${counts.warning} warning, ${counts.suggestion} suggestion. Each item explains evidence, impact, and how to verify.`;
}

function buildMarkdown(snapshot, findings) {
	const lines = [
		"## PR Snapshot",
		"",
		`- Title: ${snapshot.pr.title}`,
		`- Author: ${snapshot.pr.author}`,
		`- Branch: ${snapshot.pr.headBranch} -> ${snapshot.pr.baseBranch}`,
		`- Files: ${snapshot.pr.changedFiles}`,
		`- Changes: +${snapshot.pr.additions} / -${snapshot.pr.deletions}`,
		"",
		"### Changed Files",
		...snapshot.changedFiles.map(
			(file) =>
				`- ${file.status} ${file.filename} (+${file.additions} / -${file.deletions})`,
		),
	];

	if (findings.length) {
		lines.push("", "### Risk Map Findings");
		for (const finding of findings) {
			lines.push(
				`- [${finding.severity}/${finding.category}] ${finding.file}:${finding.lineHint} ${finding.title}`,
				`  - Evidence: ${finding.evidence}`,
				`  - Impact: ${finding.impact}`,
				`  - Suggestion: ${finding.suggestion}`,
				`  - How to verify: ${finding.howToVerify}`,
			);
		}
	}

	return lines.join("\n");
}

function countBySeverity(findings) {
	return findings.reduce(
		(counts, finding) => {
			counts[finding.severity] += 1;
			return counts;
		},
		{ blocking: 0, warning: 0, suggestion: 0 },
	);
}
