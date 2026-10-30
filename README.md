# boss_ke · 独立游戏官网与内容工作台

介绍、首页大图轮播、外部下载入口，以及可以编辑和发布内容的 Vue 3 后台。官网部署到 GitHub Pages；管理员通过发布密钥登录，内容保存到 GitHub，再由 Actions 生成静态页面。

官网：[打开游戏官网](https://biticaficir67-code.github.io/boss_ke/)。后台：[打开内容工作台](https://biticaficir67-code.github.io/boss_ke/admin/)。

## 零基础从这里开始

1. [项目代码解析](docs/CODE_GUIDE.md)：先看懂网站怎么工作，再沿着登录、编辑、保存、发布逐步追代码。
2. [文件来源与逐文件索引](docs/FILE_MAP.md)：区分常见配置/入口、自定义业务文件、自动生成文件，以及这次删除的旧文件。
3. [语法详细讲解](docs/SYNTAX.md)：HTML、CSS、JavaScript、Vue、异步请求、JSON、GitHub Actions，从符号和小例子讲起。
4. [练习与参考答案](docs/EXERCISES.md)：使用独立示例数据和模拟测试学习，不需要真实发布密钥。

源码已经统一排版。IDEA 中先看 `src/content/default-content.js`、`src/site/render.js`，再看 `src/views/AdminView.vue` 的脚本部分，不要从打包后的文件开始。

## 本地启动与预览

需要 Node.js 22.12 或更高版本。Windows 可以直接双击 `start.bat`：缺少依赖时安装依赖，生成页面，再打开管理后台。

也可以在项目目录的终端运行：

```sh
npm install
npm run dev
```

官网预览：`http://127.0.0.1:5173/`，管理后台：`http://127.0.0.1:5173/admin/`。关闭终端或 Ctrl+C 停止预览。端口被占用时关闭自己的旧预览窗口，或在启动前设置 `PORT`。

本地与线上使用同一套 GitHub 发布逻辑。**本地预览不是独立内容数据库：填入真实密钥后，保存、上传和发布仍然修改真实 GitHub 仓库。** 学习练习和浏览器测试使用模拟数据，无需真实密钥。

改完源码后重新运行 `npm run dev` 生成并预览；这个命令使用构建后的静态文件，当前没有热更新开发服务。

## 内容怎么上线

1. 负责人生成仅授权本仓库、Contents 为 Read and write 的 GitHub fine-grained token。
2. 在后台输入发布密钥。没有额外的本地用户名密码账号。
3. 编辑游戏介绍、轮播和下载信息，右侧预览跟随输入变化。
4. 保存草稿只保存内容；点击“发布官网”才更新正式发布清单。
5. Actions 自动检查、构建和部署。后台约每 15 秒读取 `deploy-info.json`，匹配本次发布 ID 后显示“正式官网已上线”。

密钥仅保留在当前标签页会话，退出后清除，不写入仓库和生成的 HTML。登录时验证可读，保存/发布还需要写权限。仓库公开，草稿、素材和历史也是公开数据。

游戏安装包放在外部下载平台，后台只填写完整 HTTPS 下载地址。地址为空时按钮显示“下载即将开放”；上传图片默认追加到轮播末尾，需要时在后台上移或替换第一张。

## 常用命令

| 命令 | 做什么 |
| --- | --- |
| `npm run dev` / 双击 `start.bat` | 检查依赖、构建、启动本地静态预览 |
| `npm run build` | 生成 `pages-output/`，不自动上传 |
| `npm start` | 预览已经生成的 `pages-output/`，不重新构建 |
| `npm test` | 内容、提交、并发与错误处理的自动检查 |
| `npm run test:browser` | 使用已有 Playwright 环境执行完整浏览器检查 |
| `npm run format` | 统一排版源码 |
| `npm run format:check` | 只检查排版，不修改文件 |

`build:pages` 和 `test:pages` 是保留的旧命令别名，分别调用 `build` 和 `test`，没有另维护一套构建。

浏览器测试需要已有的 Playwright 和 Chrome。可通过 `PLAYWRIGHT_MODULE` 指定已有 Playwright 包的绝对路径；它不属于官网运行依赖。测试模拟 GitHub，不上传演示内容到真实仓库。

## 源码与数据

```text
src/views/        Vue 登录、内容编辑、完整预览
src/lib/          统一操作入口、登录状态、路径和提示
src/github/       内容状态转换、仓库 API、文件提交
src/content/      内容结构样例与校验
src/site/         官网 HTML 模板、CSS、轮播脚本
scripts/          页面生成与本地预览启动
site-content/     当前草稿、正式内容、上传图片
tests/            隔离的自动检查和浏览器检查
docs/             零基础学习资料
.github/workflows/ 自动构建和 Pages 部署
```

当前项目已经移除旧的本地 Node.js 账号后台和独立数据存储代码。此前 `.data/` 等私有运行数据继续被 Git 忽略，不会作为网站上传。清理详情见 [本次整理记录](AUDIT.md)。

`site-content/state.json` 保存草稿、素材和最近 30 个发布快照，`published.json` 是正式发布内容。它们由后台更新，不建议初学时手动乱改。`pages-output/` 是生成结果，可以重新构建；`node_modules/` 是安装的第三方代码，不属于自己编写的源码。

## GitHub 部署

推送代码到 `main` 后，工作流会执行 `npm ci`、`npm test`、`npm run build`，最后部署 `pages-output/`。仓库 Settings → Pages 的来源使用 GitHub Actions。

保存草稿、上传素材和只改 Markdown 不触发官网部署；正式发布修改 `site-content/published.json` 后触发。推送源码也会更新部署。本项目不提供公开用户注册、在线支付或大游戏包文件托管。
