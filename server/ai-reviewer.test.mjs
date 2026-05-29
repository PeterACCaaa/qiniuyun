import assert from "node:assert/strict";
import { extractModelContent, normalizeBaseUrl } from "./ai-reviewer.mjs";

const jsonText = '{"summary":"ok"}';

assert.equal(
	extractModelContent({
		choices: [{ message: { content: jsonText } }],
	}),
	jsonText,
);

assert.equal(
	extractModelContent({
		choices: [
			{
				message: {
					content: [{ type: "text", text: jsonText }],
				},
			},
		],
	}),
	jsonText,
);

assert.equal(
	extractModelContent({
		choices: [{ text: jsonText }],
	}),
	jsonText,
);

assert.equal(
	extractModelContent({
		output: [
			{
				content: [{ type: "output_text", text: jsonText }],
			},
		],
	}),
	jsonText,
);

assert.equal(normalizeBaseUrl("https://api.openai.com"), "https://api.openai.com/v1");
assert.equal(normalizeBaseUrl("https://api.openai.com/v1"), "https://api.openai.com/v1");
assert.equal(normalizeBaseUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1");

console.log("ai-reviewer parser checks passed");
