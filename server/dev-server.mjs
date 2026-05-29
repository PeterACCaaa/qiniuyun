import http from "node:http";
import { generateAiReview } from "./ai-reviewer.mjs";
import { loadDotenv } from "./env-loader.mjs";
import { enrichReportWithFileContexts } from "./file-context.mjs";
import { fetchPullRequestSnapshot } from "./github-client.mjs";
import { buildPullRequestReport } from "./report-builder.mjs";

loadDotenv();

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
			const report = await enrichReportWithFileContexts(
				buildPullRequestReport(snapshot),
				snapshot,
			);
			sendJson(res, 200, {
				ok: true,
				report,
			});
		} catch (error) {
			sendJson(res, error.statusCode || 500, {
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
		return;
	}

	if (req.method === "POST" && req.url === "/api/ai-review") {
		const body = await readJson(req);

		try {
			rejectClientCredentials(body);
			const review = await generateAiReview(body.report);
			sendJson(res, 200, {
				ok: true,
				review,
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
		"Cache-Control": "no-store",
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

function rejectClientCredentials(body) {
	const forbiddenFields = [
		"apiKey",
		"api_key",
		"openaiApiKey",
		"OPENAI_API_KEY",
		"baseUrl",
		"base_url",
		"OPENAI_BASE_URL",
		"model",
		"OPENAI_MODEL",
	];

	const found = forbiddenFields.find((field) => body && body[field] !== undefined);
	if (!found) return;

	const error = new Error(
		"AI 凭据和模型配置只能放在服务端 .env，不能由前端请求传入。",
	);
	error.statusCode = 400;
	throw error;
}
