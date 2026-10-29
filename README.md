# boss_ke · 独立游戏官网与内容工作台

首页提供大图轮播、游戏介绍和外部下载入口。支持 GitHub Pages 在线托管：管理员通过网页表单编辑、上传图片和发布，内容提交到 GitHub 后由 Actions 自动生成并部署官网，无需租服务器。另保留 Vue 3 + Node.js 的本地工作台。

GitHub 模式使用公开仓库与 GitHub Pages，普通访客只加载静态文件；在线工作台需要连接 GitHub API。首次安装 npm 依赖需要联网。本地工作台与 GitHub 在线工作台的数据独立，修改本地 `.data` 不会自动同步线上仓库。

## GitHub Pages 在线版

官网：<https://biticaficir67-code.github.io/boss_ke/>。

工作台：<https://biticaficir67-code.github.io/boss_ke/admin/>。

1. 将本项目代码推送到 GitHub 的 `main` 分支。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。已有自动配置时无需重复操作。
3. `.github/workflows/pages.yml` 自动测试、构建 `pages-output/`，再部署至 Pages。可在仓库 Actions 页面查看结果。
4. 网站负责人在 GitHub **Settings → Developer settings → Personal access tokens → Fine-grained tokens** 创建仅授权此仓库的密钥，Repository permissions 的 **Contents** 设置为 **Read and write**，并设置有效期。
5. 在线上工作台粘贴发布密钥后进入。日常只需编辑表单、保存草稿、点击“发布官网”。无需客户编辑文件或操作 Git。

发布后由 GitHub 自动部署，需要等待构建结束。工作台每 15 秒核实线上 `deploy-info.json` 是否对应本次发布；显示“正式官网已上线”后才代表新版可访问。提交失败、网络超时或其他窗口产生冲突时会显示错误，不会强制覆盖其他提交。

线上工作台使用发布密钥授权，**不使用本地管理员密码，也不要求输入 GitHub 登录密码**。密钥仅保留在当前标签页的 sessionStorage，会话结束或退出时清除，不写入仓库、构建产物或发布内容。仅有读取权限的密钥无法保存与发布；受保护分支还需允许相应写入。

`site-content/state.json` 保存草稿、素材记录和最近 30 个发布版本；`site-content/published.json` 指定正式官网内容；图片保存在 `site-content/uploads/`。草稿和素材操作不触发部署，正式发布时原子更新内容与发布指针，然后触发 Actions。仓库公开，因此草稿与历史内容也可被查看，勿填写秘密或私人资料。上传过的图片保存在 Git 历史中，不应作为敏感文件存储。

GitHub Pages 仅部署 `pages-output/` 内的官网与静态编辑器，不上传 `.data`、`.env`、本地账号或 Node.js 后端。游戏安装包继续使用外部下载链接。

本地验证线上版构建：

```sh
npm run build:pages
```

生成 `pages-output/`，支持仓库子目录与哈希路由，无需服务器路由回退。迁移仓库时，Actions 从 `GITHUB_REPOSITORY` 和 `GITHUB_REF_NAME` 自动读取目标；本地构建默认使用上述仓库。

## 开始运行

需要 **Node.js 22.12 或更高版本**。

**Windows 可直接双击根目录的 `start.bat`**：自动检查 Node.js、按需安装依赖、构建页面，再启动网站并打开管理后台。首页直接使用静态 HTML，后台使用打包后的 Vue 页面。保留启动窗口，按 `Ctrl+C` 停止服务；重复双击时只复用同一数据、同一模式的本站服务。首次安装依赖需要联网。

也可以在 IDEA 底部 Terminal 手动启动：

```sh
npm install
npm run dev
```

- 官网：<http://127.0.0.1:5173>
- 后台：<http://127.0.0.1:5173/admin>
- 首次打开后台时创建唯一的管理员账号，密码至少 10 个字符。
- 没有默认密码或公开注册。刷新后内容仍然保留；重启服务后需要重新登录。
- 修改代码后关闭原启动窗口，再双击 `start.bat`，会重新构建；需要前端热更新时使用 `npm run dev` 或 `start.bat --dev`，修改 `server/` 后重新启动开发服务。
- 启动失败时窗口会保留报错，启动记录写入 `.data/launcher.log`。端口被其他程序或其他项目占用时会明确提示，不会结束其他程序。
- 后台脚本加载失败时显示具体错误，本机错误记录写入 `.data/browser-errors.log`（最多约 256KB）。不记录表单、密码、Cookie 和网址参数；该文件不能从网页访问。

## 已实现功能

- 自适应官网：轮播自动播放、手动切换、播放暂停、键盘切换、介绍和下载区。
- 单管理员初始化、登录、退出与修改密码。
- 游戏名称、文案、工作室和联系信息编辑。
- 轮播图上传、替换、排序、移除及播放间隔设置。
- 素材库：上传 JPG、PNG、WebP 时自动压缩，服务器检查格式，单张最多 3MB。
- 下载区开关、HTTPS 外部链接、版本号、平台、文件大小和提取码复制。
- 草稿保存、手机实时预览、完整草稿预览、HTML 源码查看。
- 发布生成静态文件，发布记录恢复到草稿，已发布官网 ZIP 导出。
- 保存版本冲突检测，避免多个窗口相互覆盖；登录限速、服务端权限和 CSRF 校验。

“雾海来信”、文案、工作室和三张 SVG 插画都是演示内容。初始下载地址为空，下载按钮不可点击，不会假装存在游戏安装包。

## 编辑与发布

1. 登录后台，在“游戏介绍”“首页轮播”“下载设置”中修改内容。
2. “保存草稿”仅保存编辑，不影响正式官网；右侧预览反映当前输入。
3. 完整预览页显示最近保存的草稿。
4. “发布官网”先保存未保存修改，再生成完整静态文件，最后切换官网当前版本。
5. 从“内容概览”导出已发布官网 ZIP，其中只有公开资源，没有账号或管理后台。

下载功能仅链接到外部平台。网盘分享链接会进入网盘页面，文件直链的行为由目标平台决定。本站不存放或转发游戏安装包。

## 构建与生产方式运行

```sh
npm run build
npm start
```

官网：<http://127.0.0.1:3000>，后台：<http://127.0.0.1:3000/admin>。

生产模式首页直接提供发布好的静态 HTML；后台使用构建后的 Vue 应用。若尚未构建，先执行 `npm run build`。

默认仅监听本机。需要修改时，复制 `.env.example` 为 `.env`。对外开放前，先以默认 `HOST=127.0.0.1` 在本机创建管理员，再设置 `HOST`、`PUBLIC_ORIGIN` 并通过 HTTPS 反向代理访问。非本机监听模式关闭首次初始化，避免被他人抢先注册。

## 导出为完全静态的网站

```sh
npm run export
```

输出 `site-output/` 文件夹和 `site-output.zip`。每次导出完整替换上一份生成目录，移除旧版本残留文件；目录与 ZIP 使用同一发布快照。文件夹包含 `index.html`、`site.css`、`site.js`、`favicon.svg` 和 `assets/` 图片。将其上传至支持静态站点的免费托管平台即可。请通过 HTTP 静态服务预览，不要直接双击 HTML（浏览器对本地文件 ES 模块有限制）。

这个导出命令仅导出本地 `.data` 中的官网。GitHub 在线版请使用上面的工作台和自动部署流程。静态 ZIP 能独立运行，不依赖本项目 API、Vue 或 Node.js。

## 文件结构

```text
src/
  views/              官网、登录、后台、预览
  components/         通用组件
  lib/                API、登录状态和提示
  site/render.js      官网模板：预览和静态发布共用
  site/runtime.js     独立轮播和提取码脚本
  site/site.css       独立官网样式
  styles.css          管理后台样式
server/
  app.mjs             路由、接口鉴权和静态文件服务
  auth.mjs            密码哈希和会话
  store.mjs           持久化、草稿、发布、素材和 ZIP
  validation.mjs      内容校验
  default-content.mjs 默认演示内容
public/sample-art/    本地演示插画
scripts/             开发启动和静态导出
tests/app.test.mjs    接口与持久化测试
```

## 数据与备份

`.data/` 保存账号、草稿、图片和历史发布快照，被 Git 忽略。请备份整个目录；不要放入公开网站目录或提交到仓库。密码使用带随机盐的 scrypt 哈希保存。会话只在内存保留，重启后失效。

历史快照保留完整资源，会占用本地空间。删除素材时检查当前草稿及已发布官网的引用。没有内置邮箱找回，请妥善保管管理员密码。

修改 `src/site/` 模板或样式后，请在后台重新发布一次以更新静态产物。代码构建与内容发布是两个独立步骤。

## 验证

```sh
npm test
npm run build
```

测试使用 `.data/test-runs/` 中的独立临时目录，不改变真实账号和内容；覆盖初始化、鉴权、哈希、草稿隔离、冲突、转义、链接校验、上传、发布、ZIP、历史恢复、重启持久化和密码修改。

其他专项检查使用 `test-results/` 临时目录，覆盖启动冲突、不同工作目录、自定义数据目录保护、请求超时、异常 JSON、损坏数据和重复导出。

已有 Playwright 环境时，可设置 `PLAYWRIGHT_MODULE` 为其包路径后运行浏览器检查，无需将它加入网站运行依赖：

```sh
node tests/browser-smoke.mjs --dev
node tests/browser-smoke.mjs
node tests/browser-resilience.mjs --edge
node tests/browser-github.mjs
```

开发与构建模式都会实际验证官网和后台。GitHub 检查模拟 GitHub API，验证子目录部署、网页授权、草稿隔离、提交发布、上线确认、图片与轮播编辑、会话及退出，不向真实仓库写入测试数据。故障模拟检查脚本加载失败、后台模块加载失败、接口断连与请求超时后的提示和恢复。完整记录见 [排查记录](AUDIT.md)。
