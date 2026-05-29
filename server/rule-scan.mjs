const RISK_PATH_RULES = [
	{
		id: "auth-path",
		severity: "blocking",
		category: "auth",
		keywords: ["auth", "login", "permission", "acl", "rbac", "jwt", "token"],
		title: "Auth or permission path changed",
		impact:
			"Authentication and authorization changes can affect every protected API path.",
		suggestion:
			"Prioritize this file in review and verify access-control behavior before merging.",
		howToVerify:
			"Check unauthenticated, expired token, insufficient permission, and happy-path cases.",
	},
	{
		id: "security-path",
		severity: "blocking",
		category: "security",
		keywords: ["security", "crypto", "encrypt", "decrypt", "secret", "password"],
		title: "Security-sensitive path changed",
		impact:
			"Security-sensitive code has a high blast radius and can expose data or credentials.",
		suggestion:
			"Review input handling, secret handling, backwards compatibility, and logging.",
		howToVerify:
			"Confirm secrets are not logged or committed, and run focused negative-path tests.",
	},
	{
		id: "db-path",
		severity: "warning",
		category: "data",
		keywords: ["migration", "schema", "database", "db", "sql", "prisma"],
		title: "Database or schema path changed",
		impact:
			"Data-layer changes can affect compatibility, rollback, and production safety.",
		suggestion:
			"Check migration order, rollback strategy, and compatibility with existing data.",
		howToVerify:
			"Run migration locally on representative data and confirm rollback or recovery steps.",
	},
	{
		id: "ci-path",
		severity: "warning",
		category: "delivery",
		keywords: [".github/workflows", "ci", "pipeline", "dockerfile", "deploy"],
		title: "Build, CI, or deployment path changed",
		impact:
			"Delivery changes can break release flow even when application code is correct.",
		suggestion:
			"Verify the updated pipeline with a clean run and confirm secret usage is safe.",
		howToVerify:
			"Run the affected workflow or build command from a clean environment.",
	},
];

const DEPENDENCY_FILES = [
	"package.json",
	"package-lock.json",
	"pnpm-lock.yaml",
	"yarn.lock",
	"requirements.txt",
	"poetry.lock",
	"go.mod",
	"go.sum",
	"pom.xml",
	"build.gradle",
	"cargo.toml",
	"cargo.lock",
];

const TEST_PATTERNS = [
	/(^|\/)(__tests__|tests?|spec)\//i,
	/\.(test|spec)\.[cm]?[jt]sx?$/i,
	/_test\.go$/i,
];

const DANGEROUS_PATCH_RULES = [
	{
		id: "hardcoded-secret",
		severity: "blocking",
		category: "security",
		pattern:
			/^\+.*(api[_-]?key|secret|password|private[_-]?key|access[_-]?token)\s*[:=]\s*['"][^'"]{8,}/im,
		title: "Possible hardcoded secret introduced",
		impact:
			"Committed credentials can be harvested from git history even after removal.",
		suggestion:
			"Move the value to environment variables or a secret manager and rotate exposed secrets.",
		howToVerify:
			"Inspect the added line, confirm it is not a real credential, and verify no secret value remains in git history.",
	},
	{
		id: "unsafe-eval",
		severity: "blocking",
		category: "security",
		pattern: /^\+.*\b(eval|new Function)\s*\(/im,
		title: "Dynamic code execution introduced",
		impact:
			"Dynamic execution is hard to audit and can become a code-injection vector.",
		suggestion:
			"Replace dynamic execution with explicit parsing or a constrained command map.",
		howToVerify:
			"Trace the input source and confirm untrusted input cannot reach dynamic execution.",
	},
	{
		id: "empty-catch",
		severity: "warning",
		category: "code-smell",
		pattern: /^\+.*catch\s*\([^)]*\)\s*\{\s*\}/im,
		title: "Empty catch block introduced",
		impact:
			"Swallowed errors hide failure modes and slow incident diagnosis.",
		suggestion:
			"Log useful context, return a typed error, or explain why the error is intentionally ignored.",
		howToVerify:
			"Trigger the failure path and confirm it leaves enough signal for users or operators.",
	},
	{
		id: "sql-concat",
		severity: "warning",
		category: "security",
		pattern: /^\+.*(select|insert|update|delete).*(\+|\$\{)/im,
		title: "Possible SQL string interpolation introduced",
		impact:
			"Building SQL through interpolation can create injection vulnerabilities.",
		suggestion:
			"Use parameterized queries or a query builder for values influenced by users.",
		howToVerify:
			"Confirm all dynamic values are parameterized and add an injection-shaped test case.",
	},
];

export function scanPullRequest(snapshot) {
	const findings = [];
	const files = snapshot.changedFiles;

	for (const file of files) {
		findings.push(...scanFile(file));
	}

	findings.push(...scanAggregate(snapshot));

	return dedupeFindings(findings)
		.sort(compareFindings)
		.slice(0, 20);
}

function scanFile(file) {
	const findings = [];
	const path = file.filename.toLowerCase();

	for (const rule of RISK_PATH_RULES) {
		const matchedKeyword = rule.keywords.find((keyword) => path.includes(keyword));
		if (matchedKeyword) {
			findings.push(
				createFinding(rule, file, {
					lineHint: "path",
					evidence: `filename contains "${matchedKeyword}"`,
				}),
			);
		}
	}

	if (DEPENDENCY_FILES.some((name) => path.endsWith(name))) {
		findings.push(
			createFinding(
				{
					id: "dependency-file",
					severity: "warning",
					category: "dependency",
					title: "Dependency definition changed",
					impact:
						"Dependency changes can introduce supply-chain, compatibility, or build risks.",
					suggestion:
						"Confirm why the dependency changed and verify lockfile consistency.",
					howToVerify:
						"Run a clean install and check that package and lockfile changes are intentional.",
				},
				file,
				{ lineHint: "file", evidence: "file is a dependency manifest or lockfile" },
			),
		);
	}

	if (file.status === "removed" && isTestFile(path)) {
		findings.push(
			createFinding(
				{
					id: "removed-test",
					severity: "warning",
					category: "test",
					title: "Test file removed",
					impact:
						"Removing tests can reduce regression coverage for changed behavior.",
					suggestion:
						"Confirm the deleted test is obsolete or replaced by equivalent coverage.",
					howToVerify:
						"Find the replacement test or explain why the covered behavior no longer exists.",
				},
				file,
				{ lineHint: "file", evidence: "file status is removed and path matches test patterns" },
			),
		);
	}

	if (file.changes >= 500) {
		findings.push(
			createFinding(
				{
					id: "large-file-change",
					severity: "warning",
					category: "reviewability",
					title: "Large file change",
					impact:
						"Large diffs are harder to review and have a higher chance of hiding regressions.",
					suggestion:
						"Split unrelated changes or call out the review focus in the PR description.",
					howToVerify:
						"Check whether formatting or generated code is mixed with logic changes.",
				},
				file,
				{ lineHint: "file", evidence: `${file.changes} changed lines in one file` },
			),
		);
	}

	for (const rule of DANGEROUS_PATCH_RULES) {
		const matchedLine = findMatchingAddedLine(file.patch, rule.pattern);
		if (matchedLine) {
			findings.push(
				createFinding(rule, file, {
					lineHint: firstPatchLine(file.patch),
					evidence: `added line matches ${rule.id}: ${truncate(matchedLine, 160)}`,
				}),
			);
		}
	}

	return findings;
}

function scanAggregate(snapshot) {
	const findings = [];
	const files = snapshot.changedFiles;
	const productionFiles = files.filter((file) => !isTestFile(file.filename));
	const testFiles = files.filter((file) => isTestFile(file.filename));
	const changedLines = snapshot.pr.additions + snapshot.pr.deletions;

	if (snapshot.pr.changedFiles >= 30 || changedLines >= 1200) {
		findings.push({
			id: "pr-large-change-set",
			severity: "warning",
			category: "reviewability",
			file: "PR",
			lineHint: "-",
			title: "Large PR change set",
			evidence: `${snapshot.pr.changedFiles} files changed, ${changedLines} total changed lines`,
			impact:
				"Large PRs are harder to review completely and can hide unrelated behavior changes.",
			suggestion:
				"Consider splitting the PR or adding a review guide that names the riskiest areas.",
			howToVerify:
				"Check whether the PR mixes formatting, generated files, and behavior changes.",
			confidence: "high",
		});
	}

	if (productionFiles.length > 0 && testFiles.length === 0) {
		findings.push({
			id: "pr-no-tests",
			severity: "suggestion",
			category: "test",
			file: "PR",
			lineHint: "-",
			title: "No test files changed",
			evidence: `${productionFiles.length} non-test files changed and 0 test files changed`,
			impact:
				"Behavior changes without nearby test changes can increase regression risk.",
			suggestion:
				"Check whether existing tests cover the behavior or add a focused regression test.",
			howToVerify:
				"Look for test evidence in the PR description or run the relevant existing test suite.",
			confidence: "medium",
		});
	}

	return findings;
}

function createFinding(rule, file, match) {
	return {
		id: `${rule.id}:${file.filename}`,
		severity: rule.severity,
		category: rule.category,
		file: file.filename,
		lineHint: String(match.lineHint),
		title: rule.title,
		evidence: match.evidence,
		impact: rule.impact,
		suggestion: rule.suggestion,
		howToVerify: rule.howToVerify,
		confidence: rule.severity === "blocking" ? "high" : "medium",
	};
}

function isTestFile(path) {
	return TEST_PATTERNS.some((pattern) => pattern.test(path));
}

function firstPatchLine(patch) {
	return patch?.split("\n").find((line) => line.startsWith("@@")) || "patch";
}

function findMatchingAddedLine(patch, pattern) {
	if (!patch) return "";
	return patch
		.split("\n")
		.find((line) => line.startsWith("+") && !line.startsWith("+++") && pattern.test(line));
}

function compareFindings(a, b) {
	const severityWeight = { blocking: 0, warning: 1, suggestion: 2 };
	const confidenceWeight = { high: 0, medium: 1, low: 2 };
	return (
		severityWeight[a.severity] - severityWeight[b.severity] ||
		confidenceWeight[a.confidence] - confidenceWeight[b.confidence] ||
		a.file.localeCompare(b.file)
	);
}

function dedupeFindings(findings) {
	const seen = new Set();
	return findings.filter((finding) => {
		const key = `${finding.id}:${finding.file}:${finding.title}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function truncate(value, maxLength) {
	return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}
