import { fetchRepositoryFileText } from "./github-client.mjs";

const MAX_CONTEXT_FILES = 6;
const MAX_VERSION_CHARS = 12000;

export async function enrichReportWithFileContexts(report, snapshot, env = process.env) {
	const targets = selectContextTargets(report.findings);
	if (!targets.length) {
		return {
			...report,
			fileContexts: [],
		};
	}

	const fileContexts = [];
	for (const target of targets) {
		fileContexts.push(await buildFileContext(target, snapshot, env));
	}

	return {
		...report,
		fileContexts,
	};
}

function selectContextTargets(findings) {
	const byFile = new Map();

	for (const finding of findings) {
		if (!finding.file || finding.file === "PR") continue;

		const existing = byFile.get(finding.file) || {
			filename: finding.file,
			highestSeverity: finding.severity,
			riskCount: 0,
			reasons: [],
		};

		existing.riskCount += 1;
		existing.highestSeverity = pickHigherSeverity(
			existing.highestSeverity,
			finding.severity,
		);
		existing.reasons.push(`${finding.severity}: ${finding.title}`);
		byFile.set(finding.file, existing);
	}

	return [...byFile.values()].sort(compareTargets).slice(0, MAX_CONTEXT_FILES);
}

async function buildFileContext(target, snapshot, env) {
	const base = await readVersionContext({
		target,
		snapshot,
		refName: snapshot.pr.baseBranch,
		refSha: snapshot.refs.baseSha,
		env,
	});
	const head = await readVersionContext({
		target,
		snapshot,
		refName: snapshot.pr.headBranch,
		refSha: snapshot.refs.headSha,
		env,
	});

	return {
		filename: target.filename,
		highestSeverity: target.highestSeverity,
		riskCount: target.riskCount,
		reasons: target.reasons,
		base,
		head,
	};
}

async function readVersionContext({ target, snapshot, refName, refSha, env }) {
	if (!snapshot.repository.owner || !snapshot.repository.repo || !refSha) {
		return {
			refName,
			refSha,
			status: "missing",
			content: "",
			truncated: false,
			size: 0,
			error: "missing repository or ref metadata",
		};
	}

	try {
		const result = await fetchRepositoryFileText(
			{
				owner: snapshot.repository.owner,
				repo: snapshot.repository.repo,
				path: target.filename,
				ref: refSha,
			},
			env,
		);

		const context = normalizeVersionContext({
			refName,
			refSha,
			status: result.status,
			content: result.content,
			size: result.size,
			error: result.error,
		});
		return applyPatchFallback(context, target, snapshot, refName, refSha);
	} catch (error) {
		return applyPatchFallback(
			{
				refName,
				refSha,
				status: "error",
				content: "",
				truncated: false,
				size: 0,
				error: error instanceof Error ? error.message : String(error),
			},
			target,
			snapshot,
			refName,
			refSha,
		);
	}
}

function applyPatchFallback(context, target, snapshot, refName, refSha) {
	if (context.status === "loaded") return context;

	const file = snapshot.changedFiles.find((item) => item.filename === target.filename);
	if (!file) return context;

	if (refSha === snapshot.refs.baseSha && file.status === "added") {
		return {
			refName,
			refSha,
			status: "missing",
			content: "",
			truncated: false,
			size: 0,
		};
	}

	if (refSha === snapshot.refs.headSha && file.status === "added") {
		const content = reconstructAddedFileFromPatch(file.patch);
		if (content) {
			return normalizeVersionContext({
				refName,
				refSha,
				status: "loaded",
				content,
				size: content.length,
				error: context.error,
			});
		}
	}

	return context;
}

function normalizeVersionContext({ refName, refSha, status, content, size, error }) {
	if (status !== "loaded") {
		return {
			refName,
			refSha,
			status,
			content: "",
			truncated: false,
			size,
			error,
		};
	}

	const truncated = content.length > MAX_VERSION_CHARS;
	return {
		refName,
		refSha,
		status,
		content: truncated ? content.slice(0, MAX_VERSION_CHARS) : content,
		truncated,
		size,
	};
}

function compareTargets(a, b) {
	const severityWeight = { blocking: 0, warning: 1, suggestion: 2 };
	return (
		severityWeight[a.highestSeverity] - severityWeight[b.highestSeverity] ||
		b.riskCount - a.riskCount ||
		a.filename.localeCompare(b.filename)
	);
}

function pickHigherSeverity(current, candidate) {
	const severityWeight = { blocking: 0, warning: 1, suggestion: 2 };
	return severityWeight[candidate] < severityWeight[current] ? candidate : current;
}

function reconstructAddedFileFromPatch(patch) {
	if (!patch) return "";

	return patch
		.split("\n")
		.filter((line) => line.startsWith("+") && !line.startsWith("+++"))
		.map((line) => line.slice(1))
		.join("\n");
}
