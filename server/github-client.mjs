const GITHUB_API = "https://api.github.com";
const GITHUB_RAW = "https://raw.githubusercontent.com";
const MAX_FILES = 100;

export function parseGithubPullRequestUrl(value) {
	const match = value
		.trim()
		.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)\/?$/i);

	if (!match) {
		const error = new Error(
			"请输入有效的 GitHub PR 链接，例如 https://github.com/owner/repo/pull/123",
		);
		error.statusCode = 400;
		throw error;
	}

	return {
		owner: match[1],
		repo: match[2],
		pullNumber: Number(match[3]),
	};
}

export async function fetchPullRequestSnapshot(prUrl, env = process.env) {
	const target = parseGithubPullRequestUrl(prUrl);
	const pr = await githubGet(
		`/repos/${target.owner}/${target.repo}/pulls/${target.pullNumber}`,
		env,
	);
	const files = await githubGet(
		`/repos/${target.owner}/${target.repo}/pulls/${target.pullNumber}/files?per_page=${MAX_FILES}`,
		env,
	);

	if (!Array.isArray(files)) {
		throw new Error("GitHub files response is invalid.");
	}

	return normalizePullRequest(pr, files, prUrl);
}

export async function fetchRepositoryFileText(
	{ owner, repo, path, ref },
	env = process.env,
) {
	if (!env.GITHUB_TOKEN) {
		return fetchRawRepositoryFileText({ owner, repo, path, ref });
	}

	const encodedPath = path.split("/").map(encodeURIComponent).join("/");
	const response = await githubRequest(
		`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
		env,
		{ Accept: "application/vnd.github.raw" },
	);

	if (response.status === 404) {
		return {
			status: "missing",
			content: "",
			size: 0,
		};
	}

	const text = await response.text();
	if (!response.ok) {
		const data = parseMaybeJson(text);
		throw createGithubError(response.status, data);
	}

	return {
		status: "loaded",
		content: text,
		size: text.length,
	};
}

async function fetchRawRepositoryFileText({ owner, repo, path, ref }) {
	const encodedPath = path.split("/").map(encodeURIComponent).join("/");
	const url = `${GITHUB_RAW}/${encodeURIComponent(owner)}/${encodeURIComponent(
		repo,
	)}/${encodeURIComponent(ref)}/${encodedPath}`;
	const response = await fetch(url);

	if (response.status === 404) {
		return {
			status: "missing",
			content: "",
			size: 0,
		};
	}

	if (!response.ok) {
		return {
			status: "error",
			content: "",
			size: 0,
			error: `raw file request failed with HTTP ${response.status}`,
		};
	}

	const text = await response.text();
	return {
		status: "loaded",
		content: text,
		size: text.length,
	};
}

async function githubGet(path, env) {
	const response = await githubRequest(path, env, {
		Accept: "application/vnd.github+json",
	});
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw createGithubError(response.status, data);
	}

	return data;
}

async function githubRequest(path, env, extraHeaders = {}) {
	const headers = {
		...extraHeaders,
		"User-Agent": "ai-pr-review-assistant",
		"X-GitHub-Api-Version": "2022-11-28",
	};

	if (env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
	}

	return fetch(`${GITHUB_API}${path}`, { headers });
}

function createGithubError(status, data) {
	const message = data?.message || `GitHub request failed with HTTP ${status}`;
	const error = new Error(formatGithubError(status, message));
	error.statusCode = status === 404 ? 404 : 502;
	return error;
}

function formatGithubError(status, message) {
	if (status === 404) {
		return "没有找到这个 PR。请确认链接存在，或为私有仓库配置 GITHUB_TOKEN。";
	}

	if (status === 403 && /rate limit/i.test(message)) {
		return "GitHub API 访问频率受限。请配置 GITHUB_TOKEN 后重试。";
	}

	return `GitHub API 请求失败：${message}`;
}

function normalizePullRequest(pr, files, prUrl) {
	return {
		repository: {
			owner: readString(pr.base?.repo?.owner?.login, ""),
			repo: readString(pr.base?.repo?.name, ""),
		},
		refs: {
			baseSha: readString(pr.base?.sha, ""),
			headSha: readString(pr.head?.sha, ""),
		},
		pr: {
			title: readString(pr.title, "Untitled PR"),
			url: readString(pr.html_url, prUrl),
			author: readString(pr.user?.login, "unknown"),
			baseBranch: readString(pr.base?.ref, "unknown"),
			headBranch: readString(pr.head?.ref, "unknown"),
			changedFiles: readNumber(pr.changed_files),
			additions: readNumber(pr.additions),
			deletions: readNumber(pr.deletions),
			state: readString(pr.state, "unknown"),
			createdAt: readString(pr.created_at, ""),
			updatedAt: readString(pr.updated_at, ""),
		},
		changedFiles: files.map(normalizeChangedFile),
	};
}

function normalizeChangedFile(file) {
	return {
		filename: readString(file.filename, "unknown"),
		status: readString(file.status, "modified"),
		additions: readNumber(file.additions),
		deletions: readNumber(file.deletions),
		changes: readNumber(file.changes),
		patch: typeof file.patch === "string" ? file.patch : "",
		rawUrl: readString(file.raw_url, ""),
		blobUrl: readString(file.blob_url, ""),
	};
}

function readString(value, fallback) {
	return typeof value === "string" && value ? value : fallback;
}

function readNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseMaybeJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}
