import http from "node:http";
import { createMockReport } from "./mock-report.mjs";

const PORT = Number(process.env.API_PORT || 8787);

const server = http.createServer(async (req, res) => {
	if (req.method === "OPTIONS") {
		sendJson(res, 204, {});
		return;
	}

	if (req.method === "POST" && req.url === "/api/analyze-pr") {
		const body = await readJson(req);
		const prUrl = typeof body.prUrl === "string" ? body.prUrl.trim() : "";

		if (!isGithubPullRequestUrl(prUrl)) {
			sendJson(res, 400, {
				ok: false,
				error: "请输入有效的 GitHub PR 链接，例如 https://github.com/owner/repo/pull/123",
			});
			return;
		}

		sendJson(res, 200, {
			ok: true,
			report: createMockReport(prUrl),
		});
		return;
	}

	sendJson(res, 404, {
		ok: false,
		error: "Not found",
	});
});

server.listen(PORT, () => {
	console.log(`Mock API server listening on http://localhost:${PORT}`);
});

function sendJson(res, statusCode, payload) {
	res.writeHead(statusCode, {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Content-Type": "application/json; charset=utf-8",
	});

	if (statusCode === 204) {
		res.end();
		return;
	}

	res.end(JSON.stringify(payload));
}

function readJson(req) {
	return new Promise((resolve) => {
		let raw = "";
		req.on("data", (chunk) => {
			raw += chunk;
		});
		req.on("end", () => {
			try {
				resolve(raw ? JSON.parse(raw) : {});
			} catch {
				resolve({});
			}
		});
	});
}

function isGithubPullRequestUrl(value) {
	return /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+\/?$/i.test(value);
}
