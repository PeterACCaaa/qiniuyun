# AI PR Review Assistant

七牛云 XEngineer 第二批次题目三的 MVP：AI PR Review 助手。

当前产品定位：

> 把 GitHub PR 从一堆 diff 变成有证据的风险地图，帮助 reviewer 更快知道先看哪里、为什么危险、怎么验证。

## 当前能力

- 输入 GitHub PR URL
- 后端解析 owner / repo / pullNumber
- 调 GitHub REST API 拉取 PR metadata
- 调 GitHub REST API 拉取 changed files
- 后端执行确定性规则扫描
- 前端展示真实 PR 概览、文件变更列表、风险地图和 Markdown 报告

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
https://github.com/microsoft/TypeScript/pull/63513
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
- 风险地图结果：severity、category、file、lineHint、evidence、impact、suggestion、howToVerify、confidence

## 风险地图原则

规则扫描不是判定 bug，而是排序 review 优先级。

每条 finding 必须包含：

- Evidence：为什么系统认为这里值得看
- Impact：这个风险可能造成什么影响
- Suggestion：reviewer 应该关注什么
- How to verify：如何复核这条风险
- Confidence：系统对这条判断的信心

## 当前规则

- 认证 / 权限 / token / RBAC 路径变更
- security / crypto / secret / password 路径变更
- 数据库 / schema / migration 相关文件变更
- CI / Docker / deploy 相关文件变更
- 依赖文件变更，例如 `package.json`、lockfile、`go.mod`
- 测试文件删除
- 大文件或大 PR 变更
- patch 中疑似硬编码密钥、`eval`、空 `catch`、SQL 字符串拼接

## 下一步

1. 将 PR 上下文和风险地图交给 AI 生成 Review 建议。
2. 拉取高风险文件的周边源码，提升上下文理解。
3. 支持复制 Markdown 和模拟提交 Review。
4. 增加团队自定义规则配置。
