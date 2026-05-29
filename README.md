# AI PR Review Assistant

七牛云 XEngineer 第二批次题目三的 MVP 骨架：AI PR Review 助手。

当前阶段只完成基础框架：

- Vite + React + TypeScript 单页应用
- PR URL 输入区
- Review 报告展示区
- 本地 mock API：`POST /api/analyze-pr`
- 后续 GitHub API、规则扫描、AI 分析模块的目录边界

## 启动

安装依赖：

```bash
npm install
```

启动 mock API：

```bash
npm run api
```

另开一个终端启动前端：

```bash
npm run dev
```

访问 Vite 输出的本地地址，输入 GitHub PR 链接即可看到 mock 报告。

## 环境变量

参考 `.env.example`：

```bash
API_PORT=8787
GITHUB_TOKEN=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5-mini
```

## 下一步实现顺序

1. 解析 GitHub PR URL，提取 owner、repo、pullNumber。
2. 接 GitHub REST API，拉取 PR metadata 和 changed files。
3. 做规则扫描器，输出确定性风险。
4. 接 AI 模型，生成结构化 Review 报告。
5. 支持复制 Markdown 和模拟提交 Review。
