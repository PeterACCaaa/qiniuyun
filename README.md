# AI PR Review Assistant

七牛云 XEngineer 第二批次题目三的 MVP：AI PR Review 助手。

当前产品定位：

> 把 GitHub PR 从一堆 diff 变成有证据的风险地图，再交给真实大模型生成 reviewer 可执行的 Review 建议。

## 当前能力

- 输入 GitHub PR URL
- 后端解析 owner / repo / pullNumber
- 调 GitHub REST API 拉取 PR metadata
- 调 GitHub REST API 拉取 changed files
- 后端执行确定性规则扫描
- 前端展示真实 PR 概览、文件变更列表、风险地图和 Markdown 报告
- 支持中文展示开关
- 支持调用真实 OpenAI-compatible 大模型生成 AI Review

## 启动

安装依赖：

```bash
npm install
```

复制环境变量：

```bash
copy .env.example .env
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
https://github.com/PeterACCaaa/pr/pull/1
```

## 环境变量

参考 `.env.example`：

```bash
API_PORT=8787
GITHUB_TOKEN=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_BASE_URL=
OPENAI_API_BASE=
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=xhigh
OPENAI_TEXT_VERBOSITY=low
```

公开仓库可以不配置 `GITHUB_TOKEN`，但容易遇到 GitHub API rate limit。当前会额外为高风险文件补全 base/head 上下文，因此建议本地演示也配置 `GITHUB_TOKEN`。私有仓库必须配置有权限的 token。

`OPENAI_BASE_URL` 使用 OpenAI-compatible `/v1` 接口，可切换到兼容 Responses API 的服务商。真实 AI Review 必须配置 `OPENAI_API_KEY`。如果你已有项目使用 `OPENAI_API_BASE_URL` 或 `OPENAI_API_BASE`，这里也会兼容读取。

`OPENAI_REASONING_EFFORT` 可选值为 `low`、`medium`、`high`、`xhigh`。其中 `xhigh` 是部分中转服务支持的扩展值，适合深度 Review。`OPENAI_TEXT_VERBOSITY` 可选值为 `low`、`medium`、`high`，不建议填 `xhigh`。

安全边界：

- `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` 只允许配置在服务端 `.env`
- 前端不会读取、保存或传递任何模型 API Key
- `/api/ai-review` 会拒绝客户端请求体中携带的 key、baseURL 或 model 字段

## 当前 API

```txt
POST /api/analyze-pr
POST /api/ai-review
```

`/api/analyze-pr` 请求：

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

`/api/ai-review` 请求：

```json
{
  "report": "POST /api/analyze-pr 返回的 report 对象"
}
```

响应会返回：

- AI 总结
- Review 结论
- 关键风险
- 人工复核清单
- 可复制到 GitHub PR 的 Markdown Review Comment
- 实际使用的模型信息

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

1. 拉取高风险文件的周边源码，提升上下文理解。
2. 支持复制 Markdown 和模拟提交 Review。
3. 增加团队自定义规则配置。
4. 给 AI 输出增加更严格的 schema 校验和重试机制。
