import assert from "node:assert/strict";
import { enrichReportWithFileContexts } from "./file-context.mjs";

const snapshot = {
	repository: { owner: "owner", repo: "repo" },
	refs: { baseSha: "base-sha", headSha: "head-sha" },
	pr: { baseBranch: "main", headBranch: "feature" },
	changedFiles: [
		{
			filename: "src/auth/token-service.js",
			status: "added",
			patch: "@@ -0,0 +1,2 @@\n+const token = \"demo\";\n+export const ok = true;",
		},
	],
};

const report = {
	findings: [
		{
			file: "src/auth/token-service.js",
			severity: "blocking",
			title: "Auth path changed",
		},
	],
};

const enriched = await enrichReportWithFileContexts(report, snapshot, {});
assert.equal(enriched.fileContexts.length, 1);
assert.equal(enriched.fileContexts[0].base.status, "missing");
assert.equal(enriched.fileContexts[0].head.status, "loaded");
assert.match(enriched.fileContexts[0].head.content, /const token/);

console.log("file-context checks passed");
