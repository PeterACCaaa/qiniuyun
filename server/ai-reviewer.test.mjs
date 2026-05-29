import assert from "node:assert/strict";
import {
	createAiReviewRequestPayload,
	extractModelContent,
	normalizeBaseUrl,
} from "./ai-reviewer.mjs";

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

assert.deepEqual(
	createAiReviewRequestPayload({}, "gpt-5.5", "fast", {}).reasoning,
	{ effort: "low" },
);
assert.deepEqual(
	createAiReviewRequestPayload({}, "gpt-5.5", "standard", {}).reasoning,
	{ effort: "medium" },
);
assert.deepEqual(
	createAiReviewRequestPayload({}, "gpt-5.5", "deep", {}).reasoning,
	{ effort: "xhigh" },
);
assert.deepEqual(
	createAiReviewRequestPayload({}, "gpt-5.5", "fast", {
		OPENAI_REASONING_EFFORT: "xhigh",
		OPENAI_TEXT_VERBOSITY: "high",
	}).reasoning,
	{ effort: "low" },
);
assert.deepEqual(
	createAiReviewRequestPayload({}, "gpt-5.5", undefined, {
		OPENAI_REASONING_EFFORT: "high",
	}).reasoning,
	{ effort: "high" },
);

const skillPayload = createAiReviewRequestPayload(
	{},
	"gpt-5.5",
	"deep",
	{},
	["security", "backend", "security", "unknown"],
);
assert.match(skillPayload.input, /"reviewSkills"/);
assert.match(skillPayload.input, /"id": "security"/);
assert.match(skillPayload.input, /"id": "backend"/);
assert.doesNotMatch(skillPayload.input, /unknown/);

console.log("ai-reviewer parser checks passed");
