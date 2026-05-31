# AI PR Review Assistant

七牛云 XEngineer 第二批次题目三项目：AI PR Review 助手。

项目目标是把 GitHub Pull Request 从一堆 diff 转成有证据的风险地图，再结合真实大模型生成 reviewer 可执行的 Review 建议。系统默认使用中文界面和中文报告模板，适合直接录制和演示。

演示视频：[QQ20260531-200731-HD](https://www.bilibili.com/video/BV1c2VU6VEbt?vd_source=1b0b11fae8fe02343fb73a307206a67b)

## 项目功能

### 1. 真实 PR 解析

输入 GitHub PR 链接后，后端会解析 `owner / repo / pullNumber`，并调用 GitHub REST API 拉取：

- PR 标题、作者、状态、base/head 分支
- changed files 数量
- additions / deletions
- 每个变更文件的 filename、status、additions、deletions、changes、patch 摘要

示例 PR：

```txt
https://github.com/PeterACCaaa/pr/pull/1
```

### 2. 确定性风险地图

系统不会直接把整个 PR 丢给 AI，而是先执行确定性规则扫描，生成可解释的风险地图。每条风险 finding 包含：

- 风险等级：阻塞 / 警告 / 建议
- 风险类别：安全、认证权限、数据、依赖、交付、测试、可审查性、代码异味
- 文件位置：文件路径和 patch hunk / path
- 证据：系统为什么认为这里值得优先审查
- 影响：这个风险可能造成什么后果
- 建议：reviewer 应该重点检查什么
- 复核方式：如何验证这条风险是否真实存在
- 置信度：高 / 中 / 低

当前规则覆盖：

- 认证 / 权限 / token / RBAC 路径变更
- security / crypto / secret / password 路径变更
- 数据库 / schema / migration 相关文件变更
- CI / Docker / deploy 相关文件变更
- 依赖文件变更，例如 `package.json`、lockfile、`go.mod`
- 测试文件删除
- 大文件或大 PR 变更
- patch 中疑似硬编码密钥、`eval`、空 `catch`、SQL 字符串拼接

### 3. 审查工作台

前端默认中文展示，并将报告拆成分段工作台：

- 概览：展示 PR 元信息、风险数量、最高风险等级和风险分布
- 优先级：按风险等级展示 reviewer 应优先处理的 finding
- 文件：展示变更文件列表和高风险文件上下文
- AI Review：选择 Review 模式和 Review Skills 后生成 AI 审查建议
- Markdown 输出：展示可复制的中文审查报告模板

这种布局避免报告变成很长的表单或长页面，适合演示和实际 review 场景。

### 4. 高风险文件上下文补全

对于风险较高的文件，后端会补全 base/head 两侧文件内容，让 AI Review 不只依赖局部 patch。上下文补全会标记：

- base 版本是否存在
- head 版本是否存在
- 文件是否新增、删除或加载失败
- 内容长度和是否被截断

这一步用于降低模型只看局部 diff 时误判的概率。

### 5. AI Review 生成

风险地图生成后，可以调用 OpenAI-compatible 大模型生成 AI Review。输出包括：

- AI 总结
- Review 结论：approve / comment / request_changes
- 关键风险列表
- 人工复核清单
- 可直接复制到 GitHub PR 的 Markdown Review Comment
- 实际使用的模型、模式和 Review Skills

支持三种模式：

- 快速：适合小 PR 或快速预检
- 标准：适合常规代码评审
- 深度：适合高风险 PR 或比赛演示

支持 Review Skills：

- Security：密钥、注入、鉴权、权限边界
- Tests：测试缺失、边界用例、回归路径
- Maintainability：复杂度、重复逻辑、模块边界
- Performance：重复计算、N+1、渲染或数据处理性能
- Frontend：React 状态、交互、可访问性、UI 回归
- Backend：API 契约、错误处理、数据一致性

### 6. AI Review 追问

AI Review 生成后，可以继续追问本次结论。追问会携带：

- 原始 PR 信息
- 风险地图
- 高风险文件上下文
- 本次 AI Review 结果
- 当前追问线程历史

适合继续询问“这个结论的依据是什么”“如何修复”“哪些点最需要人工复核”。

### 7. 安全边界

- `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` 只允许配置在服务端 `.env`
- 前端不会读取、保存或传递任何模型 API Key
- `/api/ai-review` 和 `/api/ai-followup` 会拒绝客户端请求体中携带的 key、baseURL 或 model 字段
- 规则扫描先于 AI 执行，AI 输出必须基于已有 PR 上下文和风险证据

## 启动配置

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

复制环境变量模板：

```bash
copy .env.example .env
```

`.env.example`：

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

说明：

- 公开仓库可以不配置 `GITHUB_TOKEN`，但容易遇到 GitHub API rate limit。
- 私有仓库必须配置有权限的 `GITHUB_TOKEN`。
- 真实 AI Review 必须配置 `OPENAI_API_KEY`。
- `OPENAI_BASE_URL` 使用 OpenAI-compatible `/v1` 接口。
- 如果已有服务使用 `OPENAI_API_BASE_URL` 或 `OPENAI_API_BASE`，后端也会兼容读取。

### 3. 启动 API 服务

```bash
npm run api
```

默认地址：

```txt
http://localhost:8787
```

### 4. 启动前端

另开一个终端：

```bash
npm run dev
```

访问 Vite 输出的本地地址，例如：

```txt
http://localhost:5173
```

### 5. 验证命令

```bash
npm run build
npm run test:ai-reviewer
npm run test:file-context
```

## API 说明

当前服务提供三个接口：

```txt
POST /api/analyze-pr
POST /api/ai-review
POST /api/ai-followup
```

### `/api/analyze-pr`

请求：

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123"
}
```

响应：

- PR 元信息
- 变更文件列表
- 确定性风险地图
- 高风险文件上下文
- 中文 Markdown 报告

### `/api/ai-review`

请求：

```json
{
  "report": "POST /api/analyze-pr 返回的 report 对象",
  "mode": "deep",
  "skills": ["security", "test", "maintainability"]
}
```

响应：

- AI 总结
- Review 结论
- 关键风险
- 人工复核清单
- 可复制的 Markdown Review Comment
- 模型信息和 Review Skills
- `resultId`，用于后续追问

### `/api/ai-followup`

请求：

```json
{
  "resultId": "ai-review-result-id",
  "threadId": "optional-thread-id",
  "question": "这个阻塞风险的主要依据是什么？"
}
```

响应：

- 追问线程 ID
- 本次回答
- 完整追问消息列表

## 设计思路

### 模型选择

前端只提供业务层模式：快速、标准、深度。具体模型、base URL、reasoning effort 和 text verbosity 都由服务端 `.env` 控制。

这样设计有三个原因：

1. 避免前端暴露 API Key 和模型配置。
2. 允许部署方切换不同 OpenAI-compatible 服务商。
3. 保持用户交互简单，reviewer 只需要选择审查深度，不需要理解底层模型参数。

当前模式映射：

- 快速：低推理强度，适合小 PR 或快速预检
- 标准：中等推理强度，适合常规 review
- 深度：高推理强度，适合高风险 PR 和演示场景

### 上下文获取方式

系统采用“规则先行、上下文补全、AI 总结”的顺序。

1. 先通过 GitHub API 拉取 PR metadata 和 changed files。
2. 对 patch 和文件路径执行确定性规则扫描。
3. 根据风险结果挑选高风险文件。
4. 拉取这些文件的 base/head 完整内容。
5. 将 PR 概览、风险地图、changed files 和 file contexts 一起交给模型。

这种方式比直接把完整仓库交给模型更轻量，也比只给 patch 更可靠。模型重点处理已经被规则定位过的风险区域，输出更容易追溯到证据。

### 未来扩展方向

1. 团队自定义规则
   将当前写死的规则迁移到配置文件或规则管理界面，让不同团队按自己的代码规范定义风险项。

2. 更严格的 AI 输出校验
   引入 schema 校验、自动重试和降级策略，确保模型输出稳定符合前端结构。

3. GitHub Review 闭环
   在复制 Markdown 的基础上，支持模拟提交或真实提交 GitHub PR Review Comment。

4. 更完整的上下文策略
   支持按 import 依赖、调用链、测试文件关系扩展上下文，而不只补全高风险文件本身。

5. 演示兜底模式
   增加 demo/mock mode，避免比赛演示时被 GitHub rate limit、网络或模型服务影响。

6. 更丰富的验证能力
   增加 rule scanner、report builder、API error path 的测试覆盖，并补充端到端 smoke test。
