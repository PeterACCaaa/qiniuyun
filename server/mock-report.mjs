export function createMockReport(prUrl) {
	return {
		pr: {
			title: "Mock: 改进鉴权中间件并补充错误处理",
			url: prUrl,
			author: "demo-user",
			baseBranch: "main",
			headBranch: "feature/auth-review",
			changedFiles: 6,
			additions: 184,
			deletions: 42,
		},
		summary:
			"这个 PR 主要调整鉴权中间件、补充接口错误处理，并更新部分测试用例。当前报告来自 mock 数据，用于验证页面和 API 骨架。",
		riskOverview:
			"风险集中在鉴权路径、异常处理和测试覆盖。下一步接入 GitHub API 后，规则扫描会基于真实 diff 输出文件级风险。",
		findings: [
			{
				id: "mock-1",
				severity: "blocking",
				file: "src/server/auth.ts",
				lineHint: "42",
				title: "鉴权失败路径需要显式返回",
				reason: "认证中间件属于高风险路径，空 token 和过期 token 的行为需要一致且可测试。",
				suggestion: "补充未登录、过期 token、权限不足三类测试，并明确 HTTP 状态码。",
				confidence: "high",
			},
			{
				id: "mock-2",
				severity: "warning",
				file: "src/api/user.ts",
				lineHint: "88",
				title: "异常处理可能隐藏真实错误",
				reason: "catch 块返回了通用错误，缺少日志上下文，排查线上问题会变慢。",
				suggestion: "记录 request id 和错误类型，响应仍保持脱敏。",
				confidence: "medium",
			},
			{
				id: "mock-3",
				severity: "suggestion",
				file: "tests/auth.test.ts",
				lineHint: "12",
				title: "建议补充边界用例",
				reason: "当前测试覆盖主流程，但缺少权限边界和异常输入。",
				suggestion: "增加无效 token、空 header、跨租户访问的断言。",
				confidence: "medium",
			},
		],
		nextSteps: [
			"接入 GitHub REST API 拉取 PR metadata 和 changed files。",
			"实现规则扫描器，先找确定性风险，再交给 AI 汇总。",
			"接入模型 API，生成结构化 Review 报告。",
		],
		markdown: [
			"## AI Review Summary",
			"",
			"这个 PR 调整鉴权中间件和错误处理，建议优先确认鉴权失败路径和测试覆盖。",
			"",
			"### Findings",
			"- [blocking] src/server/auth.ts:42 鉴权失败路径需要显式返回。",
			"- [warning] src/api/user.ts:88 异常处理需要保留排障上下文。",
			"- [suggestion] tests/auth.test.ts:12 建议补充权限边界用例。",
		].join("\n"),
	};
}
