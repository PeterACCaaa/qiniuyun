import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadDotenv(filePath = resolve(process.cwd(), ".env")) {
	if (!existsSync(filePath)) return;

	const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const separator = trimmed.indexOf("=");
		if (separator === -1) continue;

		const key = trimmed.slice(0, separator).trim();
		const value = normalizeValue(trimmed.slice(separator + 1).trim());
		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

function normalizeValue(value) {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	return value;
}
