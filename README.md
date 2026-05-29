# AI PR Review Assistant

七牛云 XEngineer 第二批次题目三的 MVP：AI PR Review 助手。

当前已完成第一个真实功能切片：

- 输入 GitHub PR URL
- 后端解析 owner / repo / pullNumber
- 调 GitHub REST API 拉取 PR metadata
- 调 GitHub REST API 拉取 changed files
- 前端展示真实 PR 概览和文件变更列表
- Review 建议区暂时保留为空，下一步接规则扫描

## 启动

安装依赖：

```bash
npm install
```

启动 API：

```bash
npm run api
```

另开一个终端启动前端：

```bash
npm run dev
```

访问 Vite 输出的本地地址，输入真实 GitHub PR 链接：

```txt
https://github.com/facebook/react/pull/32257
```

## 环境变量

参考 `.env.example`：

```bash
API_PORT=8787
GITHUB_TOKEN=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5-mini
```

公开仓库可以不配置 `GITHUB_TOKEN`，但容易遇到 GitHub API rate limit。私有仓库必须配置有权限的 token。

## 当前 API

```txt
POST /api/analyze-pr
```

请求：

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123"
}
```

响应会返回：

- PR 标题、作者、状态、base/head 分支
- changed files 数量
- additions / deletions
- 每个变更文件的 filename、status、additions、deletions、changes、patch 摘要

## 下一步实现顺序

1. 基于 changed files 做规则扫描。
2. 识别认证、权限、配置、依赖、测试删除等高风险变更。
3. 将 PR 上下文和规则扫描结果交给 AI 生成 Review 建议。
4. 支持复制 Markdown 和模拟提交 Review。
