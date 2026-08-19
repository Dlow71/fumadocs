# Fumadocs 文档站项目交接说明

## 1. 当前状态

- 本地路径：`/Users/dlow/Code/GlassJelly/fumadocs`
- Fork：`https://github.com/Dlow71/fumadocs.git`
- 当前分支：`dev`
- 克隆时提交：`2899bc1f586b1f213a4827ba4896444ab1c7f035`
- 当前仓库性质：Fumadocs 上游框架的完整 monorepo，同时包含平台专属业务文档站 `apps/platform-docs`。
- 平台文档站已经可以本地运行，开发端口为 `3002`，公开入口为 `http://localhost:3002/docs`。
- 文档内容的唯一管理入口在主项目 DlowAPI 的管理员控制台；Fumadocs 只负责读取“已发布”内容并生成公开站点。
- 主项目当前本地 API 端口为 `3003`，公开文档接口为 `/api/docs/manifest` 和 `/api/docs/content/*path`。
- 已完成文档分类、Markdown 草稿、乐观锁、发布/取消发布、历史版本恢复、删除、构建记录和失败重试。

`fumadocs/` 与主项目 `/Users/dlow/Code/GlassJelly/dlow-newapi` 并列，各自保留独立的 `.git`。两个仓库应分别提交和发布；主项目通过链接、CI 输入或部署配置与文档站对接，不直接记录 Fumadocs 内部提交。

Fumadocs 使用 MIT License。框架可以商用、修改和二次开发。业务文档站应尽量作为独立应用维护，避免直接改写 Fumadocs 的核心包，以便后续同步上游版本。

## 2. 项目目标

建设一个独立部署的公开开发者文档站，用于帮助用户完成平台接入和故障排查。目标域名建议使用 `docs.<主域名>`，现有控制台只增加文档入口，不把文档代码打进控制台主包。

文档站首期范围：

1. 快速开始：注册、获取 API Key、配置 Base URL、完成第一次调用。
2. 客户端接入：Cherry Studio、Claude Code、Codex CLI、Gemini CLI、OpenAI SDK 等。
3. API Reference：由 OpenAPI 定义生成。
4. 计费与额度：充值、模型倍率、余额、限速等用户可见规则。
5. 故障排查：401、403、429、模型不可用、流式请求中断等常见问题。
6. 更新日志：新模型、新能力和用户可见规则变化。

在线 CMS 已经纳入实现，但只放在 DlowAPI 管理端，不把数据库、权限和编辑器带进公开文档站。首期仍不做多人实时编辑、私有内部知识库和通用 API 代理。

## 3. 推荐的仓库组织

不要把 `apps/docs` 直接改造成业务站。该目录是 Fumadocs 自己的官方文档，并直接依赖大量 `workspace:*` 包，后续同步上游时容易冲突。

建议在当前 fork 内新增独立应用：

```text
fumadocs/
├── apps/
│   ├── docs/                       # 上游 Fumadocs 官方文档，不改业务内容
│   └── platform-docs/              # 平台专属文档站
│       ├── app/
│       ├── components/
│       ├── content/docs/
│       │   ├── getting-started/
│       │   ├── clients/
│       │   ├── api/
│       │   ├── billing/
│       │   ├── troubleshooting/
│       │   └── changelog/
│       ├── public/
│       ├── scripts/
│       ├── package.json
│       └── next.config.mjs
├── examples/
│   ├── next-static/                # 静态站实现参考
│   └── openapi/                    # OpenAPI 实现参考
└── packages/                       # 上游框架包，非必要不修改
```

`apps/platform-docs` 已从静态示例起步，并保留当前 workspace 包依赖。它在每次构建前调用 DlowAPI 的公开 manifest，只把已发布 Markdown 写入受控的 `content/docs/` 目录，然后执行 Fumadocs 静态构建。管理端只允许纯 Markdown，拒绝 HTML、`import`、`export` 和 MDX 组件，因此不会把管理员输入当作代码执行。

## 4. 公开内容与安全边界

主项目的 `docs/` 目录同时包含公开接口定义、本地开发备忘和服务器运维资料，不能整目录发布。

允许作为自动生成输入的资产目前只有：

```text
../dlow-newapi/docs/openapi/api.json
../dlow-newapi/docs/openapi/relay.json
```

以上路径相对于本 Fumadocs 仓库根目录。业务教程应重新整理到 `apps/platform-docs/content/docs/`，不要自动扫描或复制主项目的整个 `docs/` 目录。若 CI 只检出 Fumadocs 仓库，则需要在构建前从主项目下载或复制这两份接口资产。

发布前必须检查：

- 文档、截图和代码示例中没有真实 API Key、密码、Cookie、Session、数据库地址或服务器 IP。
- 示例统一使用 `sk-example`、`https://api.example.com/v1` 等占位值。
- 内部部署路径、故障日志和运维命令没有被误加入公开内容。
- OpenAPI 中没有只供管理员或内部服务调用的敏感接口；如有，生成时显式排除。

## 5. 本地开发环境

当前 fork 根目录的 `package.json` 指定：

- Node.js：`>= 24.14.0`
- 包管理器：`pnpm@11.5.3`
- 构建系统：Turborepo

截至本次交接，本机默认 `node` 为 `v22.11.0`，不满足当前 fork 的要求；在安装依赖或启动页面前必须切换到 Node.js 24.14.0 或更高版本。

虽然主项目前端通常优先使用 Bun，但这个 Fumadocs 上游 monorepo 已明确绑定 pnpm，因此维护框架 fork 时应遵循仓库自身的 pnpm 配置，不要混写 lockfile。

首次安装：

```bash
cd /Users/dlow/Code/GlassJelly/fumadocs
corepack enable
corepack prepare pnpm@11.5.3 --activate
pnpm install
```

运行上游官方文档用于验证环境：

```bash
pnpm run build --filter='./packages/*'
pnpm run dev --filter=docs
```

当前 `apps/platform-docs` 包名为 `platform-docs`，对应命令为：

```bash
pnpm run dev --filter=platform-docs
pnpm run build --filter=platform-docs
pnpm run types:check --filter=platform-docs
```

应用自身的 `package.json` 还提供 `sync:content` 和 `start`：`sync:content` 只在构建时同步已发布内容，`start` 用于预览 `out/` 静态产物。

## 6. 静态部署方案

第一阶段推荐纯静态部署。`apps/platform-docs/next.config.mjs` 使用 Next.js 静态导出；文档站是独立端口、独立部署单元，不和 DlowAPI、AI Canvas 共用进程：

```js
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config = {
  output: 'export',
  reactStrictMode: true,
};

export default withMDX(config);
```

构建后产物预计位于：

```text
apps/platform-docs/out/
```

推荐部署流程：

1. CI 检出主项目与本文档站所需代码，并设置 `DOCS_API_BASE_URL` 指向 DlowAPI。
2. 执行 `pnpm --filter platform-docs build`；构建脚本从 `/api/docs/manifest` 拉取发布清单，再逐页读取 Markdown。
3. 执行类型检查和静态构建。
4. 将 `apps/platform-docs/out/` 发布到 CDN、对象存储、Cloudflare Pages、Vercel 或现有 Nginx。
5. 绑定 `docs.<主域名>`，并在 DlowAPI 系统设置中把 `general_setting.docs_link` 配置为该地址。

本地开发时可以直接运行：

```bash
cd /Users/dlow/Code/GlassJelly/fumadocs
DOCS_API_BASE_URL=http://localhost:3003 pnpm --filter platform-docs dev
```

`dev` 默认使用端口 `3002`。如果 API 暂时不可用，开发构建会保留仓库内的 bootstrap 内容；生产环境应设置 `DOCS_SYNC_REQUIRED=true`，同步失败就让构建失败，避免发布旧内容。

### 6.2 本次首次生产部署记录（2026-08-19）

- 部署方式：本机使用 Node.js 24.16.0 + pnpm 11.5.3 构建，上传 `apps/platform-docs/out/` 到服务器 Nginx 静态目录；没有新增 Node 常驻进程。
- 构建命令：`pnpm --filter platform-docs types:check`，以及 `DOCS_API_BASE_URL=https://dlowapi.me DOCS_SYNC_REQUIRED=true pnpm --filter platform-docs build`。
- 服务器目录：`/opt/dlow/apps/fumadocs/releases/<timestamp>-<commit>/`，`current` 软链指向现役版本。发布前必须保留旧 release，便于回滚。
- 首次构建曾因 DlowAPI 尚未部署而收到 `/api/docs/manifest` 的 404；正确顺序是先部署并重启 DlowAPI，确认 manifest 返回 200，再构建文档站。
- `docs.dlowapi.me` 已解析到 `47.76.59.121`，并已签发 Let's Encrypt 证书；HTTP 会 301 跳转 HTTPS。证书复用 DlowAPI 现有 `/opt/dlow/bin/certbot-renew.sh` 和 `/etc/cron.d/dlowapi-certbot`，每天 03:17、15:17 自动续期并 reload Nginx。
- 文档站是 Nginx 静态站，不需要开放 3002 等应用端口；服务器防火墙保留 `http`/`https`（80/443）即可。
- 传输 macOS 生成的构建目录会带 `._*` AppleDouble 文件；不影响站点，但后续发布应使用禁用扩展属性的 tar，减少无用文件。

DlowAPI 发布、取消发布或删除已发布文档后，会创建构建记录并调用 `DOCS_BUILD_WEBHOOK_URL`。该 webhook 应由 CI/部署服务接收，重新执行上述构建并发布 `out/`。`DOCS_BUILD_WEBHOOK_SECRET`（可选）会以 `X-Docs-Signature: sha256=...` 发送 HMAC-SHA256 签名。未配置 webhook 时，管理页会显示“构建未配置”，可以在部署系统中手动执行构建或点击重试。

静态部署不需要数据库和常驻 Node 服务。只有加入服务端 AI 问答、受控 API 代理或动态鉴权后，才需要改为 Next.js 服务端部署。

### 6.1 DlowAPI、AI Canvas 与文档入口

- DlowAPI 控制台的“文档管理”栏目位于 `/documentation-management`，仅管理员可见。
- DlowAPI 系统设置的“文档链接”字段就是单一配置源，公开返回为 `/api/status` 的 `data.docs_link`。
- AI Canvas 后端通过 `NEWAPI_BASE_URL` 指向 DlowAPI，并提供 `/api/site-config`；它只转发校验过的 `http`/`https` 文档地址，不把配置硬编码到前端。
- AI Canvas 桌面顶栏和移动导航都会根据 `/api/site-config` 动态显示“文档”入口。Canvas 与文档站可以使用不同端口，例如 Canvas `3000`、DlowAPI `3003`、文档站 `3002`。

AI Canvas 的关键环境变量：

```dotenv
NEWAPI_BASE_URL=http://localhost:3003
```

部署时只需要在 DlowAPI 修改文档链接，AI Canvas 会在下一次加载时读取新地址；无需重新构建 Canvas 前端。

## 7. OpenAPI 接入

建议使用 `fumadocs-openapi` 在构建时生成 API 页面。生成内容应输出到独立目录，例如：

```text
apps/platform-docs/content/docs/api/generated/
```

生成目录必须有“自动生成、禁止手改”的说明。接口描述的修改应回到主项目 OpenAPI 源文件完成，然后重新生成，避免生成页面与真实接口长期漂移。

建议按 tag 分组，并分别展示：

- 管理与业务 API：来源于 `api.json`。
- 模型中继 API：来源于 `relay.json`。
- cURL、JavaScript、Python、Go 示例。
- 请求参数、请求体、响应体和错误码。

第一阶段不要开启 Fumadocs 通用服务端请求代理。该代理可能转发 `Authorization`、Cookie 等敏感请求头。在线 Playground 如后续启用，只允许访问明确列出的 API 域名，禁止任意目标 URL，并确保凭据不会写入日志或 URL。

## 8. AI 页面与知识库问答

Fumadocs 提供三类 AI 能力，但不要混为一谈：

1. `llms.txt`、`llms-full.txt` 和单页 Markdown：让 AI 或 Agent 更容易读取文档。
2. AI Page Actions：复制 Markdown、查看原文或交给外部 AI。
3. Ask AI：站内对话界面、`/api/chat` 服务端路由和文档搜索工具。

Fumadocs 不提供模型额度，也不是完整的托管知识库。模型调用、检索策略、限流、成本控制和服务端部署仍由本项目负责。

首期推荐采用“关键词检索 + 工具调用”的轻量问答：

```text
用户问题
  -> 文档站 /api/chat
  -> FlexSearch 从公开 MDX 中召回相关页面
  -> 将搜索结果交给模型
  -> 模型生成带文档链接的答案
  -> 流式返回 Ask AI 面板
```

这套方式不需要向量数据库，适合首期公开教程数量不大时使用。文档明显增多、自然语言召回质量不足后，再升级为 Embedding + 向量检索；Fumadocs 可以对接 Mixedbread、Orama、Typesense 等搜索服务，也可以接自建向量库。

创建业务文档应用后，可先安装官方 Ask AI 脚手架：

```bash
cd apps/platform-docs
pnpm dlx @fumadocs/cli@latest add ai/openrouter
```

该命令会生成 Ask AI 组件和 `/api/chat` 路由。平台已有 OpenAI-compatible 网关，因此正式实现不必继续使用 OpenRouter；保留界面和检索逻辑，把模型 Provider 替换为 `@ai-sdk/openai-compatible`：

```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const provider = createOpenAICompatible({
  name: 'platform-docs',
  baseURL: process.env.DOCS_AI_BASE_URL!,
  apiKey: process.env.DOCS_AI_API_KEY!,
});

const model = provider.chatModel(process.env.DOCS_AI_MODEL!);
```

服务端环境变量建议统一为：

```dotenv
DOCS_AI_BASE_URL=https://api.example.com/v1
DOCS_AI_API_KEY=<SERVER_SIDE_KEY>
DOCS_AI_MODEL=<MODEL_ID>
```

`DOCS_AI_API_KEY` 必须是专门给文档助手创建的受限服务端密钥，不能写入 `NEXT_PUBLIC_*`、客户端 JavaScript、MDX、Git 或构建产物。建议设置独立额度、模型白名单、请求频率和每日预算。

Ask AI 上线前必须补齐：

- `/api/chat` 频率限制和问题长度限制。
- 模型最大输出和最大工具调用步数。
- 只索引公开文档，排除内部运维和管理资料。
- 系统提示要求先检索、引用来源、找不到就明确回答不知道。
- 日志脱敏，不记录用户 API Key 或完整敏感请求头。
- 防止任意 URL 抓取和通用代理滥用。
- 记录调用量、错误率、平均响应时间和用户反馈。

部署上有两种选择：

1. **推荐首期：Next.js 服务端部署。** 文档页面仍可预渲染，`/api/chat` 由 Node.js 服务处理，部署最直接。
2. **静态站 + 独立聊天 API。** `out/` 放 CDN，聊天请求发往主项目或单独的服务端接口；适合后期拆分，但检索索引同步和跨域配置更复杂。

只要启用 `/api/chat`，就不能把整个站点当作只有 `output: 'export'` 的纯静态应用。若仍使用静态导出，AI API 必须部署在另一个服务中。

## 9. 信息架构与视觉要求

首页定位为“开发者中心”，不是传统博客，也不是 Fumadocs 默认示例页。

推荐首页顺序：

1. 品牌标题、核心价值和全局搜索。
2. “5 分钟完成首次调用”主入口。
3. 常用客户端接入卡片。
4. 可复制的 Base URL 和首个 cURL 请求。
5. 热门教程与常见问题。
6. 最新更新、服务状态和支持入口。

正文采用左侧章节导航、中间正文、右侧页内目录的三栏结构。必须支持移动端、键盘导航、清晰焦点态、深浅色模式和代码复制。减少大面积空白和纯装饰动画，优先保证教程步骤、截图和代码块易读。

## 10. 上游同步策略

建议为官方仓库增加 `upstream` remote：

```bash
git remote add upstream https://github.com/fuma-nama/fumadocs.git
git fetch upstream
```

同步前先确认工作区干净，并在独立分支处理：

```bash
git switch dev
git fetch upstream
git merge upstream/dev
```

不要在未检查差异时强制重置 fork。业务定制尽量限制在 `apps/platform-docs`，这样上游包、示例和官方文档更新时冲突最少。

## 11. 分支与提交建议

- `dev`：跟随 Fumadocs 上游开发分支。
- `docs/main`：平台文档站稳定发布分支，名称可按团队习惯调整。
- 功能分支：按 `docs/<topic>` 创建，例如 `docs/client-guides`。

每次提交尽量只包含一种变化：主题、教程、OpenAPI 同步或部署配置。自动生成的 API 页面应与对应 OpenAPI 变更一起提交，或者完全由 CI 生成，不要两种模式混用。

## 12. 验收清单

每次交付至少检查：

- `pnpm run types:check --filter=platform-docs` 通过。
- `pnpm run build --filter=platform-docs` 通过。
- 首页、搜索、侧栏、页内目录和深浅色模式正常。
- 375px、768px、1440px 宽度下无横向滚动和内容遮挡。
- 所有代码复制按钮和外链可用。
- 关键教程由未参与开发的人照着走一遍。
- OpenAPI 页面与当前接口资产一致。
- 构建产物不包含密钥、内部运维文档和私有地址。
- `docs.<主域名>` 可访问，控制台入口和返回控制台链接正确。

## 13. CMS 使用流程

### 13.1 新增和发布文档

1. 用管理员账号登录 DlowAPI default 控制台，打开“文档与办公 → 文档管理”。
2. 点击“新增文档”，填写标题、路径、描述、分类、排序和 Markdown 正文。路径只能使用小写字母、数字、连字符和 `/`，例如 `getting-started/first-request`。
3. 点击“保存”。保存只更新草稿，不会影响线上文档。
4. 在列表中确认内容后点击“发布”。系统会生成不可变发布版本，并触发文档构建 webhook。
5. 构建状态变为已触发后，等待部署系统完成；打开“文档站”链接检查公开页面。

### 13.2 修改、回滚和下线

- 已发布文档可以继续编辑；编辑只改变草稿，线上仍使用上一次发布版本。
- 再次点击“发布”会创建新版本。旧版本会保留在“历史”中，可用“恢复”把内容复制回当前草稿，再重新发布。
- “取消发布”会使该页面从公开 manifest 中消失，并触发一次构建。
- 删除已发布文档同样会触发构建；删除操作不可撤销，历史版本也会一并删除。
- 保存、发布、恢复和取消发布都带有版本号校验；如果多人同时操作，页面会提示文档已被修改，需要刷新后再提交。

### 13.3 内容边界

CMS 只接受 Markdown。HTML、MDX 组件、顶层 `import`/`export` 会被拒绝；单篇正文上限为 1 MB。不要在公开内容中写入 API Key、Cookie、内部 IP、数据库地址或运维命令。

### 13.4 管理端接口

公开接口：

```text
GET /api/docs/manifest
GET /api/docs/content/*path
```

管理员接口（需要 DlowAPI 管理员认证）：

```text
GET/POST       /api/admin/docs
GET            /api/admin/docs/categories
GET            /api/admin/docs/builds
POST           /api/admin/docs/:id/publish
POST           /api/admin/docs/:id/unpublish
GET            /api/admin/docs/:id/revisions
POST           /api/admin/docs/:id/revisions/:revision_id/restore
POST           /api/admin/docs/builds/:build_id/retry
```

## 14. 下一步建议

1. 配置 CI/部署服务接收 DlowAPI 的文档构建 webhook。
2. 通过 CMS 补齐快速开始、客户端教程、计费说明、故障排查和更新日志。
3. 根据接口稳定性，再接入两份 OpenAPI 文件并生成 API Reference。
4. 配置静态搜索、SEO、站点地图和正式域名。

后续维护者开始工作前，应先阅读本文档、根目录 `README.md`、`.github/contributing.md`、`examples/next-static` 和 `examples/openapi`，再决定是否需要修改框架包。
