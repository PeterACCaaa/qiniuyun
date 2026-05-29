import http from "node:http";
import { fetchPullRequestSnapshot } from "./github-client.mjs";
import { buildPullRequestReport } from "./report-builder.mjs";

const PORT = Number(process.env.API_PORT || 8787);

const server = http.createServer(async (req, res) => {
	if (req.method === "OPTIONS") {
		sendJson(res, 204, {});
		return;
	}

	if (req.method === "POST" && req.url === "/api/analyze-pr") {
		const body = await readJson(req);
		const prUrl = typeof body.prUrl === "string" ? body.prUrl.trim() : "";

		try {
			const snapshot = await fetchPullRequestSnapshot(prUrl);
			sendJson(res, 200, {
				ok: true,
				report: buildPullRequestReport(snapshot),
			});
		} catch (error) {
			sendJson(res, error.statusCode || 500, {
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
		return;
	}

	sendJson(res, 404, {
		ok: false,
		error: "Not found",
	});
});

server.listen(PORT, () => {
	console.log(`API server listening on http://localhost:${PORT}`);
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
