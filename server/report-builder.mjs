export function buildPullRequestReport(snapshot) {
	const fileNames = snapshot.changedFiles.map((file) => file.filename);
	const summary =
		fileNames.length > 0
			? `已拉取真实 GitHub PR 数据。本次变更包含 ${snapshot.pr.changedFiles} 个文件：${fileNames.slice(0, 5).join("、")}${fileNames.length > 5 ? " 等" : ""}。`
			: "已拉取真实 GitHub PR 数据，但这个 PR 没有返回文件变更。";

	const markdown = [
		"## PR Snapshot",
		"",
		`- Title: ${snapshot.pr.title}`,
		`- Author: ${snapshot.pr.author}`,
		`- Branch: ${snapshot.pr.headBranch} -> ${snapshot.pr.baseBranch}`,
		`- Files: ${snapshot.pr.changedFiles}`,
		`- Changes: +${snapshot.pr.additions} / -${snapshot.pr.deletions}`,
		"",
		"### Changed Files",
		...snapshot.changedFiles.map(
			(file) =>
				`- ${file.status} ${file.filename} (+${file.additions} / -${file.deletions})`,
		),
	].join("\n");

	return {
		pr: snapshot.pr,
		changedFiles: snapshot.changedFiles,
		summary,
		riskOverview:
			"当前阶段只完成 PR 元信息和文件变更拉取。下一步会基于文件路径、patch 和变更规模做规则扫描。",
		findings: [],
		nextSteps: [
			"基于 filename/status/patch 增加规则扫描。",
			"识别认证、权限、配置、依赖、测试删除等高风险变更。",
			"将 PR 上下文和规则扫描结果交给 AI 生成 Review 建议。",
		],
		markdown,
	};
}
