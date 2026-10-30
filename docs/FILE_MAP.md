# 文件来源与逐文件索引

## 1. 先纠正“默认文件”的一个误解

文件名被工具约定，不等于文件内容由工具完整生成。`package.json`、`vite.config.js`、`main.js`、`App.vue` 是常见组织方式，但本项目内容已经定制。没有保留原始脚手架证据时，不能只凭名字声称它们就是未修改的默认模板。

“自定义”指本项目开发中新增/改写，包括我们协作编写的代码，不代表你曾亲手输入全部源码。Vue、Router、fflate、Vite、Prettier 的库代码属于第三方，在 node_modules 中；不要把它们也当成自己的业务实现。

## 2. 四类文件先记住

| 类别 | 怎么看待 | 例子 |
| --- | --- | --- |
| 常见配置/入口，内容由项目填写 | 理解规则后可以修改 | package.json、vite.config、main.js、App.vue |
| 开发过程新增的业务代码/素材 | 主要学习对象 | views、github、site、content、scripts、tests |
| 程序维护的数据与产物 | 分清来源，不手工长期维护构建结果 | lock、site-content、pages-output |
| 安装的外部库与私有本地状态 | 不作为业务源码改写或上传 | node_modules、旧 .data、.idea |

## 3. 当前逐文件清单

覆盖本次整理后的 48 个源码、配置、数据、素材与说明文件。上传素材以后会继续增加，职责分类不变。

| 文件 | 来源/分类 | 用途 |
| --- | --- | --- |
| [package.json](../package.json) | 常见配置名，内容由项目编写 | npm 识别的项目配置；依赖、脚本、模块模式由我们填写。 |
| [package-lock.json](../package-lock.json) | npm 自动维护 | 锁定完整依赖版本；不要手工编辑整个依赖树。 |
| [index.html](../index.html) | 常见入口名，内容已定制 | Vue 后台外壳、加载与脚本失败提示；不是玩家首页模板。 |
| [vite.config.js](../vite.config.js) | 工具约定配置名，内容已定制 | Vue 插件、相对资源地址、后台构建目录。 |
| [.gitignore](../.gitignore) | Git 约定配置名，规则由项目编写 | 排除依赖、构建产物、私有历史数据与环境文件。 |
| [.prettierrc.json](../.prettierrc.json) | 排版工具常见配置名，项目新增 | 两空格、单引号、分号等排版设置。 |
| [.prettierignore](../.prettierignore) | 排版工具常见配置名，项目新增 | 不格式化第三方依赖、内容快照和生成目录。 |
| [start.bat](../start.bat) | 项目自定义启动入口 | Windows 检查 Node、进入项目目录、运行启动脚本。 |
| [src/main.js](../src/main.js) | Vue 常见入口组织，逻辑由项目编写 | 创建应用、哈希路由、授权导航检查和挂载。 |
| [src/App.vue](../src/App.vue) | Vue 常见根组件名，内容已定制 | RouterView、全局提示与会话过期跳转。 |
| [src/styles.css](../src/styles.css) | 项目自定义样式 | 登录、编辑器、弹窗、预览容器与手机适配。 |
| [src/components/Icon.vue](../src/components/Icon.vue) | 项目自定义组件 | 根据 name 和 size 显示本地 SVG 图标。 |
| [src/content/default-content.js](../src/content/default-content.js) | 项目自定义样例数据 | 返回完整内容样例，供测试和学习；不重置正式数据。 |
| [src/content/validation.js](../src/content/validation.js) | 项目自定义业务规则 | 检查内容结构、字段长度、图片、间隔、下载地址，返回允许字段。 |
| [src/lib/api.js](../src/lib/api.js) | 项目自定义操作入口 | 统一转交 GitHub 操作，授权失效时发出页面事件。 |
| [src/lib/auth.js](../src/lib/auth.js) | 项目自定义共享状态 | 记录页面登录状态，读取和接收授权结果。 |
| [src/lib/hosting.js](../src/lib/hosting.js) | 项目自定义路径工具 | 公开仓库配置、官网地址、素材临时地址、预览资源。 |
| [src/lib/notify.js](../src/lib/notify.js) | 项目自定义提示工具 | 共享通知状态和自动隐藏。 |
| [src/views/LoginView.vue](../src/views/LoginView.vue) | 项目自定义页面 | 发布密钥登录。当前唯一登录页，不是 Vue 自动提供的后台。 |
| [src/views/AdminView.vue](../src/views/AdminView.vue) | 项目自定义主要业务页面 | 内容概览、介绍、轮播、下载、素材、发布授权、预览、发布、历史和 ZIP。 |
| [src/views/PreviewView.vue](../src/views/PreviewView.vue) | 项目自定义页面 | 读取已保存草稿，在 iframe 里显示完整预览。 |
| [src/github/state.js](../src/github/state.js) | 项目自定义数据转换 | 校验仓库状态，转换保存、发布、恢复、素材操作。 |
| [src/github/client.js](../src/github/client.js) | 项目自定义业务适配 | 密钥会话、操作分发、图片预载、写队列、ZIP 与上线查询。 |
| [src/github/repository.js](../src/github/repository.js) | 项目自定义 GitHub 客户端 | API 授权/超时/错误、快照读取、文件对象和非强制分支提交。 |
| [src/site/render.js](../src/site/render.js) | 项目自定义官网模板 | 生成下载区、官网主体、完整文档，统一文字转义。 |
| [src/site/runtime.js](../src/site/runtime.js) | 项目自定义浏览器交互 | 图片轮播、暂停、键盘、焦点、可见性和复制提取码。 |
| [src/site/site.css](../src/site/site.css) | 项目自定义官网样式 | 面向玩家的官网外观和响应式。 |
| [scripts/build-pages.mjs](../scripts/build-pages.mjs) | 项目自定义构建脚本 | 读取正式数据、生成公开文件、构建 Vue 后台、写发布标识。 |
| [scripts/start.mjs](../scripts/start.mjs) | 项目自定义本地工具 | 检查依赖，构建并打开本地静态预览，不建立独立内容后台。 |
| [.github/workflows/pages.yml](../.github/workflows/pages.yml) | Actions 约定目录，自定义流程 | 何时检查、构建、上传和部署。此文件是我们配置的，不是 GitHub 自动替你写业务。 |
| [site-content/state.json](../site-content/state.json) | 项目内容结构，后台更新的数据 | 当前草稿、正式快照、素材记录与最近 30 个历史。 |
| [site-content/published.json](../site-content/published.json) | 项目内容结构，后台更新的数据 | 正式发布清单；与 state.published 对应。 |
| [site-content/uploads/f7443860-1aa3-4893-b79f-4c2d1207754c.webp](../site-content/uploads/f7443860-1aa3-4893-b79f-4c2d1207754c.webp) | 用户上传后程序生成的资源文件 | 已发布的第 4 张图；不是模板默认依赖，保留实际内容。 |
| [public/favicon.svg](../public/favicon.svg) | 项目静态素材 | 标签页图标。 |
| [public/sample-art/island.svg](../public/sample-art/island.svg) | 项目演示素材 | 内置海岛插画，非 Vue 自动图片。 |
| [public/sample-art/forest.svg](../public/sample-art/forest.svg) | 项目演示素材 | 内置森林插画。 |
| [public/sample-art/journey.svg](../public/sample-art/journey.svg) | 项目演示素材 | 内置旅途插画。 |
| [tests/content.test.mjs](../tests/content.test.mjs) | 项目自定义测试 | 正式清单、图片存在、输入约束、转义与渲染条件。 |
| [tests/github.test.mjs](../tests/github.test.mjs) | 项目自定义测试 | 草稿隔离、并发、素材提交和历史恢复。 |
| [tests/repository.test.mjs](../tests/repository.test.mjs) | 项目自定义测试 | 中文编码、连接失败、超时、错误状态。 |
| [tests/helpers/github-fixture.mjs](../tests/helpers/github-fixture.mjs) | 项目自定义模拟器 | 内存仓库和模拟 fetcher；测试不需要真实密钥。 |
| [tests/browser-github.mjs](../tests/browser-github.mjs) | 项目自定义浏览器检查 | 真实构建页面配合假 API，验证完整后台操作。 |
| [README.md](../README.md) | 常见说明文件名，内容自写 | 使用入口、命令、部署与学习顺序。 |
| [AUDIT.md](../AUDIT.md) | 项目自定义整理记录 | 本次删除、迁移、保留与验证范围。 |
| [docs/CODE_GUIDE.md](../docs/CODE_GUIDE.md) | 项目自定义学习文档 | 围绕当前唯一架构解析功能调用链。 |
| [docs/FILE_MAP.md](../docs/FILE_MAP.md) | 项目自定义学习文档 | 文件来源、职责、函数和本次清理说明。 |
| [docs/SYNTAX.md](../docs/SYNTAX.md) | 项目自定义学习文档 | 从零解释本项目实际使用的语法。 |
| [docs/EXERCISES.md](../docs/EXERCISES.md) | 项目自定义学习文档 | 不依赖真实账号的练习与答案。 |

## 4. 生成目录不是另一套源码

| 目录/文件 | 谁生成 | 该怎么用 |
| --- | --- | --- |
| node_modules/ | npm 安装第三方包 | 用 package 管依赖，不直接改库源码 |
| package-lock.json | npm 安装/更新依赖 | 提交锁文件，让 Actions 安装相同依赖 |
| pages-output/ | npm run build | 部署/预览结果，重建会替换 |
| test-results/ | 浏览器检查 | 看截图，不作为正式内容 |
| .idea/ | IDEA 维护 | 编辑器配置，不属于网站功能 |
| .data/ | 旧本地版本运行留下 | 私有历史数据，当前代码不再使用，也不提交 |
| .env 等环境文件 | 个人本地配置 | 默认被忽略；不要放进公开仓库 |

## 5. 具名函数与关键入口

行号以本次排版后的源码为准，后续改动可能移动；在 IDEA 可按函数名查找。以下覆盖主要具名函数/方法，匿名事件回调、模板指令与 CSS 规则在主手册/语法文档解释。

### src/content/default-content.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`defaultContent`](../src/content/default-content.js#L1) | 1 | 返回全新内容样例。 |

### src/content/validation.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`constructor`](../src/content/validation.js#L2) | 2 | 设置实例或错误对象的初始字段。 |
| [`text`](../src/content/validation.js#L7) | 7 | 检查字符串类型、长度、必填并去边空白。 |
| [`validateContent`](../src/content/validation.js#L17) | 17 | 验证并返回允许保存的内容字段。 |

### src/lib/api.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`request`](../src/lib/api.js#L2) | 2 | 页面的统一操作入口，转交 GitHub 模块。 |

### src/lib/auth.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`acceptAuth`](../src/lib/auth.js#L6) | 6 | 接收登录显示状态。 |
| [`refreshAuth`](../src/lib/auth.js#L10) | 10 | 重新检查授权状态。 |

### src/lib/hosting.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`rememberImage`](../src/lib/hosting.js#L8) | 8 | 登记临时图片 URL，替换时释放旧 Blob URL。 |
| [`imageUrl`](../src/lib/hosting.js#L12) | 12 | 查找可显示的素材地址。 |
| [`previewOptions`](../src/lib/hosting.js#L15) | 15 | 生成预览用资源前缀与图片解析器。 |

### src/lib/notify.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`notify`](../src/lib/notify.js#L4) | 4 | 显示消息并定时清除。 |

### src/views/LoginView.vue

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`submit`](../src/views/LoginView.vue#L12) | 12 | 读取密钥，发起授权并进入工作台。 |

### src/views/AdminView.vue

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`checkDeployment`](../src/views/AdminView.vue#L56) | 56 | 比较官网与当前发布的 releaseId。 |
| [`date`](../src/views/AdminView.vue#L71) | 71 | 转换界面显示时间。 |
| [`acceptDraft`](../src/views/AdminView.vue#L82) | 82 | 设置 meta、复制表单、重置 saved。 |
| [`load`](../src/views/AdminView.vue#L87) | 87 | 同时读取草稿、素材、历史。 |
| [`persist`](../src/views/AdminView.vue#L144) | 144 | 有未保存改动时提交草稿。 |
| [`save`](../src/views/AdminView.vue#L152) | 152 | 管理保存按钮和提示。 |
| [`publish`](../src/views/AdminView.vue#L164) | 164 | 先保存、再正式发布、检查上线。 |
| [`downloadZip`](../src/views/AdminView.vue#L185) | 185 | 下载已发布内容的 ZIP。 |
| [`ask`](../src/views/AdminView.vue#L205) | 205 | 登记确认弹窗动作。 |
| [`runConfirmed`](../src/views/AdminView.vue#L208) | 208 | 执行确认后的动作。 |
| [`reloadDraft`](../src/views/AdminView.vue#L217) | 217 | 确认后放弃本地输入并重读。 |
| [`restore`](../src/views/AdminView.vue#L220) | 220 | 历史内容恢复为新草稿。 |
| [`moveSlide`](../src/views/AdminView.vue#L242) | 242 | 交换两项数组位置。 |
| [`removeSlide`](../src/views/AdminView.vue#L248) | 248 | 移除轮播项，至少保留一张。 |
| [`chooseImage`](../src/views/AdminView.vue#L252) | 252 | 新增或替换轮播图片引用。 |
| [`startUpload`](../src/views/AdminView.vue#L264) | 264 | 触发文件选择并记录是否追加轮播。 |
| [`prepareImage`](../src/views/AdminView.vue#L268) | 268 | 缩放图片、转 WebP 和 Base64。 |
| [`uploadFiles`](../src/views/AdminView.vue#L294) | 294 | 逐张处理上传并更新素材/轮播。 |
| [`deleteImage`](../src/views/AdminView.vue#L321) | 321 | 确认后删除允许删除的素材。 |
| [`logout`](../src/views/AdminView.vue#L333) | 333 | 清理本标签页授权并返回登录。 |
| [`copySource`](../src/views/AdminView.vue#L344) | 344 | 复制当前表单生成的 HTML。 |
| [`onEscape`](../src/views/AdminView.vue#L352) | 352 | ESC 关闭弹窗。 |

### src/github/state.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`initialState`](../src/github/state.js#L6) | 6 | 创建隔离测试使用的初始内容状态。 |
| [`validateState`](../src/github/state.js#L20) | 20 | 检查仓库状态和素材记录结构。 |
| [`imageRepositoryPath`](../src/github/state.js#L42) | 42 | 逻辑图片路径转换成仓库路径。 |
| [`assertImages`](../src/github/state.js#L46) | 46 | 确认内容引用的上传素材仍在记录中。 |
| [`asDraft`](../src/github/state.js#L52) | 52 | 组织返回页面的草稿、版本与 dirty。 |
| [`changeState`](../src/github/state.js#L63) | 63 | 处理 save/publish/restore/upload/remove 并检查版本。 |

### src/github/client.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`hydrate`](../src/github/client.js#L17) | 17 | 读取图片字节，登记编辑器临时地址。 |
| [`read`](../src/github/client.js#L36) | 36 | 读取当前仓库一致快照；client 还会预载图片。 |
| [`mutation`](../src/github/client.js#L40) | 40 | 按 action 转换状态并提交相关文件。 |
| [`imageRecord`](../src/github/client.js#L55) | 55 | 检查图片编码、大小和文件头，创建素材记录。 |
| [`handle`](../src/github/client.js#L79) | 79 | 按统一操作名称选择登录、内容、素材、发布或导出行为。 |
| [`githubRequest`](../src/github/client.js#L191) | 191 | 写操作排队，其他操作直接执行。 |

### src/github/repository.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`encodeText`](../src/github/repository.js#L3) | 3 | 把 Unicode 文字转成 GitHub 使用的 Base64。 |
| [`decodeText`](../src/github/repository.js#L10) | 10 | 把 Base64 还原成 Unicode 文字。 |
| [`constructor`](../src/github/repository.js#L17) | 17 | 设置实例或错误对象的初始字段。 |
| [`api`](../src/github/repository.js#L36) | 36 | 实际 GitHub 请求、超时和响应状态处理。 |
| [`read`](../src/github/repository.js#L81) | 81 | 读取当前仓库一致快照；client 还会预载图片。 |
| [`bytes`](../src/github/repository.js#L92) | 92 | 读取指定快照中的文件字节。 |
| [`commit`](../src/github/repository.js#L99) | 99 | 准备 blob/tree/commit，最后非强制更新分支。 |

### src/site/render.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`renderDownload`](../src/site/render.js#L21) | 21 | 按开关和链接决定下载区 HTML。 |
| [`renderSite`](../src/site/render.js#L56) | 56 | 把游戏内容变为官网主体 HTML。 |
| [`renderDocument`](../src/site/render.js#L151) | 151 | 补上完整文档结构和 CSS/JS 引用。 |

### src/site/runtime.js

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`mountSite`](../src/site/runtime.js#L1) | 1 | 为生成的 DOM 绑定轮播等交互，并返回清理函数。 |

### scripts/start.mjs

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`installDependencies`](../scripts/start.mjs#L9) | 9 | 首次缺少依赖时安装。 |

### tests/repository.test.mjs

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`repository`](../tests/repository.test.mjs#L5) | 5 | 测试用 Repository 工厂。 |

### tests/helpers/github-fixture.mjs

| 函数/方法 | 行 | 作用 |
| --- | --- | --- |
| [`githubFixture`](../tests/helpers/github-fixture.mjs#L4) | 4 | 创建隔离的内存 GitHub 模拟器。 |

## 6. 本次删掉的旧代码，为什么能删

| 旧文件/逻辑 | 处理和理由 |
| --- | --- |
| server/app、auth、store、config 等 Node 本地后台 | Pages 不运行这套服务，业务只保留 GitHub 路线 |
| server/default-content 与 validation | 没丢掉共用逻辑，迁移到 src/content |
| src/views/GitHubLoginView 与旧 LoginView 双入口 | 只保留名为 LoginView 的密钥页，去掉账号密码分支 |
| SiteView | 正式官网已由 renderDocument 生成，不再使用本地 /api/site |
| scripts/dev、scripts/export | 不再维护独立本地数据库、开发服务器与本地数据导出 |
| 本地密码设置、CSRF、账号初始化 | 当前没有独立账号服务，前端残留会误导阅读 |
| tests/app、robustness、api 及旧本地浏览器测试 | 去掉测试已删除服务的代码；当前内容与仓库规则另有测试覆盖 |
| .env.example 的 HOST/私有目录等设置 | 对应的本地服务器已经移除 |
| 旧密码框/账号说明 CSS | 页面不再使用，删除对应规则 |

清理不是把全部 Node.js 都删掉：生成文件、启动预览仍需要 Node.js。测试和样例也有用途，并非只要不直接显示在页面上就是冗余。旧实现可从 Git 历史查阅。

## 7. 最容易找错的地方

- 要改玩家官网样式，先找 site/site.css；要改后台，找 styles.css。
- 要改游戏文字，通常通过后台内容，不是去根 index.html。
- 要学习业务函数，读 src，不从 node_modules 或压缩产物开始。
- 要看保存去哪里，沿 request → client → state → repository；目前没有第二套本地密码后端。
