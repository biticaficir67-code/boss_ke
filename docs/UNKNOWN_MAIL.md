# 《未知的邮件》功能与视觉说明

美术已更新为完整的 5 张场景与 2 张角色立绘，文件清单与全部生成提示词见 [美术素材记录](ARTWORK.md)。下文的 `post-office.webp` 是此前保留的历史主视觉，当前页面使用 `public/artwork/` 下的新素材。

本次沿用 GitHub Pages 静态托管。没有新增服务器程序、账号体系或数据库；客户仍在工作台编辑、保存、发布。

## 新增的自定义文件

| 文件 | 作用 |
| --- | --- |
| [sections.js](../src/content/sections.js) | 新栏目默认内容、旧版本的空栏目、收集全部被引用的图片。 |
| [ExtendedEditor.vue](../src/components/ExtendedEditor.vue) | 来信、角色、玩法、动态、问答、配置、外部链接的编辑表单。 |
| [admin-theme.css](../src/admin-theme.css) | 后台的夜间档案配色，复用原有布局。 |
| [post-office.webp](../public/sample-art/post-office.webp) | 新增的夜雾邮局概念主视觉，约 188 KiB。 |

这些都是项目自定义内容，不是 Vue、GitHub 或 IDEA 默认生成的功能。原有的 `render.js` 负责生成网页，`runtime.js` 负责交互，`validation.js` 负责检查字段。

## 内容结构

新数据存放在内容对象的 `extra` 字段中，不改变原有介绍、轮播和下载字段。

| 字段 | 维护内容 | 上限 |
| --- | --- | --- |
| extra.story | 开关、来信标题、发件信息、正文 | 正文 4000 字符 |
| extra.characters | 名称、身份、引语、介绍、图片 | 6 个角色 |
| extra.gameplay | 玩法标题、介绍 | 6 项 |
| extra.updates | 日期、分类、标题、正文 | 20 条 |
| extra.faq | 问题、回答 | 12 条 |
| extra.system | 配置项目、配置说明 | 8 项 |
| extra.links | 社区、商店或其他 HTTPS 链接 | 8 个 |

旧的历史版本没有 `extra` 时，读取为空栏目；恢复历史不会凭空填入新的剧情设定。列表为空就隐藏栏目，角色图片可以不填。动态按日期从新到旧展示，同一天保留后台顺序。

`contentImages(content)` 同时收集轮播和角色图片，构建、导出、检查上传素材、删除保护都使用它。只放在角色档案里、没有放到轮播的图片也不会漏打包。

`ExtendedEditor.vue` 的 `defineModel()` 接收父页面的 `v-model="form"`。表单修改同一个响应式内容对象，因此父页面原有的未保存提示、预览、保存和发布逻辑继续生效。每条记录使用独立 ID，移动顺序不会把另一条的输入内容混淆。

## 浏览器里的交互

- 角色列表采用标签页：鼠标选择；左右方向键切换，Home/End 到首尾。
- 来信、动态、配置、问答使用原生 `details/summary`，无需额外接口。
- 大图使用原生 `dialog`，支持切图、Esc、关闭后恢复焦点和滚动。
- 手机菜单展开后选择栏目或按 Esc 会关闭。
- 氛围开关只保存在当前浏览器本地，不发送个人数据，也不会自动播放声音。
- 系统“减少动态效果”生效时关闭雾层动画，并保留轮播暂停控制。
- 下载链接为空时保留禁用状态；配置说明仍可浏览。实际安装包继续放在外部平台。

当前剧情、角色引语与玩法文案是官网概念稿；主视觉、人物卷宗已标注概念属性。正式版本号、下载地址、运行要求仍需用真实资料填写，没有编造已发售状态或确定的硬件要求。

## 主视觉生成记录

工具：内置 `image_gen`，模式为生成全新概念插画。原有上传图片未被覆盖。生成的 PNG 转成 WebP 后放入项目；原始生成文件仍保留在生成目录。

项目素材：[public/sample-art/post-office.webp](../public/sample-art/post-office.webp)。它是概念视觉，不作为实机截图。

使用的完整提示词：

```text
Use case: stylized-concept. Asset type: a wide 16:9 cinematic concept illustration for an original Chinese furry mystery game website named Unknown Mail. A deserted rural postal station at night in a dense misty conifer forest. On the RIGHT half of the composition, a single adult anthropomorphic wolf mail carrier in a worn dark overcoat with an old canvas satchel, viewed three-quarter from behind, holds a small warm amber lantern beside a weathered mailbox and a damp wooden post office doorway. Recognizably furry animal ears, muzzle silhouette and tail, no human face. A pale sealed letter is caught on the mailbox. Deep slate blue and desaturated forest green shadows, layered fog, very restrained amber window light, wet stone and wood textures, atmospheric painterly game key art with fine film grain and excellent environmental storytelling. Quiet uncanny anticipation, subtle horror, emotionally intriguing, no violence or gore, no jump scare, no monsters attacking. Composition MUST leave the LEFT 45% low-detail and dark for a website title overlay; subject, post office and warm light on right. Wide landscape, detailed but readable, no text, no lettering, no logo, no watermarks, no user interface. This is concept artwork, not a screenshot.
```
