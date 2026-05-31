import type { ReviewFinding, ReviewSeverity, RiskCategory } from "../types/review";

type DisplayFinding = Omit<ReviewFinding, "severity" | "category" | "confidence"> & {
	severity: string;
	category: string;
	confidence: string;
};

const severityText: Record<ReviewSeverity | "clear", string> = {
	blocking: "阻塞",
	warning: "警告",
	suggestion: "建议",
	clear: "无明显风险",
};

const categoryText: Record<RiskCategory, string> = {
	security: "安全",
	auth: "认证权限",
	data: "数据",
	dependency: "依赖",
	delivery: "交付",
	test: "测试",
	reviewability: "可审查性",
	"code-smell": "代码异味",
};

const titleText: Record<string, string> = {
	"Auth or permission path changed": "认证或权限路径发生变更",
	"Security-sensitive path changed": "安全敏感路径发生变更",
	"Database or schema path changed": "数据库或结构路径发生变更",
	"Build, CI, or deployment path changed": "构建、CI 或部署路径发生变更",
	"Dependency definition changed": "依赖定义发生变更",
	"Test file removed": "测试文件被删除",
	"Large file change": "单文件大规模变更",
	"Possible hardcoded secret introduced": "疑似引入硬编码密钥",
	"Dynamic code execution introduced": "引入动态代码执行",
	"Empty catch block introduced": "引入空 catch 块",
	"Possible SQL string interpolation introduced": "疑似引入 SQL 字符串拼接",
	"Large PR change set": "PR 变更规模较大",
	"No test files changed": "未发现测试文件变更",
};

const impactText: Record<string, string> = {
	"Authentication and authorization changes can affect every protected API path.":
		"认证和权限变更可能影响所有受保护的接口路径。",
	"Security-sensitive code has a high blast radius and can expose data or credentials.":
		"安全敏感代码影响面较大，可能导致数据或凭据暴露。",
	"Data-layer changes can affect compatibility, rollback, and production safety.":
		"数据层变更可能影响兼容性、回滚能力和生产安全。",
	"Delivery changes can break release flow even when application code is correct.":
		"即使应用代码正确，交付链路变更也可能破坏发布流程。",
	"Dependency changes can introduce supply-chain, compatibility, or build risks.":
		"依赖变更可能带来供应链、兼容性或构建风险。",
	"Removing tests can reduce regression coverage for changed behavior.":
		"删除测试可能降低对行为变更的回归覆盖。",
	"Large diffs are harder to review and have a higher chance of hiding regressions.":
		"大规模 diff 更难审查，也更容易隐藏回归问题。",
	"Committed credentials can be harvested from git history even after removal.":
		"提交过的凭据即使删除，也可能从 Git 历史中被找回。",
	"Dynamic execution is hard to audit and can become a code-injection vector.":
		"动态执行难以审计，可能成为代码注入入口。",
	"Swallowed errors hide failure modes and slow incident diagnosis.":
		"吞掉错误会隐藏失败模式，降低线上问题排查效率。",
	"Building SQL through interpolation can create injection vulnerabilities.":
		"通过字符串插值构造 SQL 可能引入注入漏洞。",
	"Large PRs are harder to review completely and can hide unrelated behavior changes.":
		"大型 PR 难以被完整审查，也可能混入无关行为变更。",
	"Behavior changes without nearby test changes can increase regression risk.":
		"行为变更缺少相邻测试更新，会增加回归风险。",
};

const suggestionText: Record<string, string> = {
	"Prioritize this file in review and verify access-control behavior before merging.":
		"优先审查该文件，并在合并前验证访问控制行为。",
	"Review input handling, secret handling, backwards compatibility, and logging.":
		"重点检查输入处理、密钥处理、向后兼容性和日志输出。",
	"Check migration order, rollback strategy, and compatibility with existing data.":
		"检查迁移顺序、回滚策略以及对现有数据的兼容性。",
	"Verify the updated pipeline with a clean run and confirm secret usage is safe.":
		"用干净环境验证更新后的流水线，并确认密钥使用安全。",
	"Confirm why the dependency changed and verify lockfile consistency.":
		"确认依赖变更原因，并检查 lockfile 是否一致。",
	"Confirm the deleted test is obsolete or replaced by equivalent coverage.":
		"确认被删除的测试已经过时，或已有等价覆盖替代。",
	"Split unrelated changes or call out the review focus in the PR description.":
		"拆分无关变更，或在 PR 描述中明确审查重点。",
	"Move the value to environment variables or a secret manager and rotate exposed secrets.":
		"将该值迁移到环境变量或密钥管理器，并轮换已暴露密钥。",
	"Replace dynamic execution with explicit parsing or a constrained command map.":
		"用显式解析或受限命令映射替代动态执行。",
	"Log useful context, return a typed error, or explain why the error is intentionally ignored.":
		"记录有用上下文、返回类型化错误，或说明为何有意忽略该错误。",
	"Use parameterized queries or a query builder for values influenced by users.":
		"对用户可影响的值使用参数化查询或 query builder。",
	"Consider splitting the PR or adding a review guide that names the riskiest areas.":
		"考虑拆分 PR，或添加审查指南标出最高风险区域。",
	"Check whether existing tests cover the behavior or add a focused regression test.":
		"确认现有测试是否覆盖该行为，或补充聚焦的回归测试。",
};

const verifyText: Record<string, string> = {
	"Check unauthenticated, expired token, insufficient permission, and happy-path cases.":
		"检查未登录、token 过期、权限不足和正常路径用例。",
	"Confirm secrets are not logged or committed, and run focused negative-path tests.":
		"确认密钥没有进入日志或提交记录，并运行负向路径测试。",
	"Run migration locally on representative data and confirm rollback or recovery steps.":
		"在代表性数据上本地运行迁移，并确认回滚或恢复步骤。",
	"Run the affected workflow or build command from a clean environment.":
		"在干净环境中运行受影响的 workflow 或构建命令。",
	"Run a clean install and check that package and lockfile changes are intentional.":
		"执行干净安装，并确认 package 与 lockfile 变更符合预期。",
	"Find the replacement test or explain why the covered behavior no longer exists.":
		"找到替代测试，或说明原测试覆盖的行为已经不存在。",
	"Check whether formatting or generated code is mixed with logic changes.":
		"检查是否把格式化、生成代码和逻辑变更混在一起。",
	"Inspect the added line, confirm it is not a real credential, and verify no secret value remains in git history.":
		"检查新增行，确认不是真实凭据，并确认 Git 历史中没有真实密钥。",
	"Trace the input source and confirm untrusted input cannot reach dynamic execution.":
		"追踪输入来源，确认不可信输入无法进入动态执行路径。",
	"Trigger the failure path and confirm it leaves enough signal for users or operators.":
		"触发失败路径，确认对用户或运维保留足够诊断信号。",
	"Confirm all dynamic values are parameterized and add an injection-shaped test case.":
		"确认所有动态值都参数化，并补充注入形态测试。",
	"Check whether the PR mixes formatting, generated files, and behavior changes.":
		"检查 PR 是否混合了格式化、生成文件和行为变更。",
	"Look for test evidence in the PR description or run the relevant existing test suite.":
		"查看 PR 描述中的测试证据，或运行相关既有测试套件。",
};

export function displaySeverity(value: ReviewSeverity | "clear", chinese: boolean) {
	return chinese ? severityText[value] : value;
}

export function displayCategory(value: RiskCategory, chinese: boolean) {
	return chinese ? categoryText[value] : value;
}

export function displayFinding(
	finding: ReviewFinding,
	chinese: boolean,
): ReviewFinding | DisplayFinding {
	if (!chinese) return finding;

	return {
		...finding,
		severity: displaySeverity(finding.severity, true),
		category: displayCategory(finding.category, true),
		title: titleText[finding.title] || finding.title,
		evidence: translateEvidence(finding.evidence),
		impact: impactText[finding.impact] || finding.impact,
		suggestion: suggestionText[finding.suggestion] || finding.suggestion,
		howToVerify: verifyText[finding.howToVerify] || finding.howToVerify,
		confidence: translateConfidence(finding.confidence),
	};
}

export function displayRiskOverview(raw: string, chinese: boolean) {
	if (!chinese) return raw;
	if (raw.startsWith("风险地图") || raw.startsWith("规则扫描")) return raw;

	const match = raw.match(
		/Risk map found (\d+) evidence-backed review priorities: (\d+) blocking, (\d+) warning, (\d+) suggestion\./,
	);
	if (!match) return raw;

	return `风险地图发现 ${match[1]} 个有证据支撑的审查重点：${match[2]} 个阻塞、${match[3]} 个警告、${match[4]} 个建议。每条结果都包含证据、影响和复核方式。`;
}

export function displaySummary(raw: string, chinese: boolean) {
	if (!chinese) return raw;
	if (raw.startsWith("已拉取真实 GitHub PR 数据")) return raw;

	const match = raw.match(
		/Fetched real GitHub PR data\. This PR changes (\d+) files \((\d+) additions, (\d+) deletions\): (.*)\./,
	);
	if (!match) return raw;

	return `已拉取真实 GitHub PR 数据。本次 PR 修改 ${match[1]} 个文件，新增 ${match[2]} 行，删除 ${match[3]} 行：${match[4]}。`;
}

function translateEvidence(value: string) {
	let result = value
		.replace(/^filename contains "(.+)"$/, '文件路径包含 "$1"')
		.replace(/^file is a dependency manifest or lockfile$/, "文件是依赖清单或 lockfile")
		.replace(
			/^(\d+) non-test files changed and 0 test files changed$/,
			"$1 个非测试文件发生变更，但测试文件变更数为 0",
		);

	result = result.replace(/^added line matches ([^:]+): /, "新增代码命中 $1：");
	return result;
}

function translateConfidence(value: "high" | "medium" | "low") {
	const map = {
		high: "高置信",
		medium: "中置信",
		low: "低置信",
	};
	return map[value];
}
