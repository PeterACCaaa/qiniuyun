import { randomUUID } from "node:crypto";

const CONTEXT_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_CONTEXTS = 30;
const MAX_THREADS_PER_CONTEXT = 12;
const MAX_MESSAGES_PER_THREAD = 40;

const resultContexts = new Map();

export function saveAiReviewContext({ report, review, mode, skills }) {
	cleanupExpiredContexts();

	const resultId = randomUUID();
	const context = {
		resultId,
		report,
		review,
		mode,
		skills: Array.isArray(skills) ? skills : [],
		createdAt: new Date().toISOString(),
		expiresAt: Date.now() + CONTEXT_TTL_MS,
		threads: new Map(),
	};

	resultContexts.set(resultId, context);
	pruneOldContexts();
	return context;
}

export function getAiReviewContext(resultId) {
	cleanupExpiredContexts();
	if (typeof resultId !== "string" || !resultId.trim()) return null;
	return resultContexts.get(resultId.trim()) || null;
}

export function getOrCreateFollowupThread(context, requestedThreadId) {
	const existingThread =
		typeof requestedThreadId === "string" && requestedThreadId.trim()
			? context.threads.get(requestedThreadId.trim())
			: null;
	if (existingThread) return existingThread;

	const thread = {
		threadId: randomUUID(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		messages: [],
	};

	context.threads.set(thread.threadId, thread);
	pruneOldThreads(context);
	return thread;
}

export function appendFollowupExchange(thread, question, answer) {
	const userMessage = {
		id: randomUUID(),
		role: "user",
		content: question,
		createdAt: new Date().toISOString(),
	};
	const assistantMessage = {
		id: randomUUID(),
		role: "assistant",
		content: answer.content,
		model: answer.model,
		createdAt: answer.createdAt,
	};

	thread.messages.push(userMessage, assistantMessage);
	if (thread.messages.length > MAX_MESSAGES_PER_THREAD) {
		thread.messages.splice(0, thread.messages.length - MAX_MESSAGES_PER_THREAD);
	}
	thread.updatedAt = new Date().toISOString();
	return serializeFollowupThread(thread).messages;
}

export function serializeFollowupThread(thread) {
	return {
		threadId: thread.threadId,
		createdAt: thread.createdAt,
		updatedAt: thread.updatedAt,
		messages: thread.messages.map((message) => ({ ...message })),
	};
}

function cleanupExpiredContexts() {
	const now = Date.now();
	for (const [resultId, context] of resultContexts.entries()) {
		if (context.expiresAt <= now) resultContexts.delete(resultId);
	}
}

function pruneOldContexts() {
	if (resultContexts.size <= MAX_CONTEXTS) return;

	const contexts = [...resultContexts.values()].sort(
		(left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt),
	);
	for (const context of contexts.slice(0, resultContexts.size - MAX_CONTEXTS)) {
		resultContexts.delete(context.resultId);
	}
}

function pruneOldThreads(context) {
	if (context.threads.size <= MAX_THREADS_PER_CONTEXT) return;

	const threads = [...context.threads.values()].sort(
		(left, right) => Date.parse(left.updatedAt) - Date.parse(right.updatedAt),
	);
	for (const thread of threads.slice(0, context.threads.size - MAX_THREADS_PER_CONTEXT)) {
		context.threads.delete(thread.threadId);
	}
}
