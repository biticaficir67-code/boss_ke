# 零基础练习与参考答案

先读 [项目解析](CODE_GUIDE.md)，有符号不懂查 [语法详解](SYNTAX.md)。下面的基础练习只操作自己创建的示例对象，不需要真实 GitHub 密钥。

**当前本地预览与线上采用同一套 GitHub 操作。不要把真实密钥填入本地后台后，当作隔离练习环境随意发布。** 自动测试已经提供假仓库，学习提交过程用它即可。

## 1. 分清文件来源

打开 [文件来源索引](FILE_MAP.md)，先不看答案，给这些文件分类：package.json、main.js、AdminView.vue、client.js、package-lock.json、pages-output/index.html、node_modules/vue。

<details><summary>参考答案</summary>

package.json 是工具识别的常见配置，内容由项目填写；main.js 是常见入口组织，当前逻辑由项目编写；AdminView 与 client 是定制业务代码；lock 由 npm 自动维护；pages-output 是构建结果；node_modules/vue 是安装的第三方库。

“文件名常见”和“内容自动生成”不是同一个分类。
</details>

## 2. 在浏览器 Console 里创建一份自己的数据

打开任意普通网页的开发工具 Console，输入下面独立示例：

```js
const learningGame = {
  name: '学习用游戏',
  enabled: true,
  slides: ['海岛', '森林', '旅途'],
};
console.log(learningGame.name);
console.log(learningGame.slides[0]);
console.log(learningGame.slides.length);
```

预测三次输出，再执行。这里没有调用项目保存接口。

<details><summary>参考答案</summary>

分别输出“学习用游戏”“海岛”和 3。点号读取字段，方括号读取指定下标，length 是数量。数组下标从 0 开始。
</details>

## 3. const 能不能修改对象

接着输入：

```js
learningGame.name = '另一个名字';
learningGame.slides.push('新画面');
console.log(learningGame);
```

解释为什么 const 没有阻止这两次修改。

<details><summary>参考答案</summary>

const 禁止给 learningGame 重新绑定另一个对象，并不冻结对象的字段。push 向原数组末尾追加，结果会有 4 张图。
</details>

## 4. 复现“新图在第四张”

```js
const learningSlides = ['岛', '森林', '旅途'];
learningSlides.push('新图片');
console.log(learningSlides[0]);
console.log(learningSlides[3]);
[learningSlides[0], learningSlides[3]] = [learningSlides[3], learningSlides[0]];
console.log(learningSlides);
```

然后去源码找 moveSlide 和 chooseImage，比较新增、替换、交换三个动作。

<details><summary>参考答案</summary>

push 不会替换第一张。最后用数组解构交换两项，新图才到第一项。源码 picker=-1 是新增，非负下标表示替换指定项。
</details>

## 5. 用 if 写出下载按钮规则

自己写一个函数，要求：开关关闭返回“不显示”；开启但没地址返回“下载即将开放”；有地址返回“开始冒险”。这里只练条件，不验证真实链接。

<details><summary>参考写法</summary>

```js
function learningDownload(enabled, url) {
  if (!enabled) return '不显示';
  if (!url) return '下载即将开放';
  return '开始冒险';
}
console.log(learningDownload(false, ''));
console.log(learningDownload(true, ''));
console.log(learningDownload(true, 'https://example.com/game.zip'));
```

真实项目还会验证 HTTPS 和其他约束，位置在 content/validation.js 与 renderDownload。
</details>

## 6. 浅复制和深复制

```js
const learningOriginal = { brand: { name: '旧名称' } };
const learningShallow = { ...learningOriginal };
learningShallow.brand.name = '浅复制后修改';
console.log(learningOriginal.brand.name);

const learningDeep = structuredClone(learningOriginal);
learningDeep.brand.name = '仅改变副本';
console.log(learningOriginal.brand.name, learningDeep.brand.name);
```

<details><summary>参考答案</summary>

第一次改变原对象的嵌套字段，因为共享同一个 brand；深复制后的嵌套对象独立，第二次不改变原对象。回到 acceptDraft 思考为什么要给 form 一个独立副本。
</details>

## 7. 亲手生成一小段 HTML

在 IDEA 的项目根目录终端执行：

```sh
node --input-type=module -e "import { defaultContent } from './src/content/default-content.js'; import { renderDocument } from './src/site/render.js'; const content = defaultContent(); content.brand.name = '我的学习游戏'; console.log(renderDocument(content).slice(0, 600));"
```

观察输出里的 title。这条命令只在内存创建样例并打印，不写文件，不访问 GitHub。

<details><summary>参考答案</summary>

defaultContent 返回一个完整样例，修改 brand.name，renderDocument 转成字符串，slice 只打印开头。没有 repository.commit 或文件 write，所以不是发布。
</details>

## 8. map、filter、find 三个方法

```js
const learningPictures = [
  { id: 'a', name: '岛', selected: true },
  { id: 'b', name: '森林', selected: false },
];
```

任务：取得所有名字；取得 selected=true 的项；取得 id=b 的一项。

<details><summary>参考答案</summary>

```js
learningPictures.map((picture) => picture.name);
learningPictures.filter((picture) => picture.selected);
learningPictures.find((picture) => picture.id === 'b');
```

前两项是数组，最后一项是找到的对象或 undefined。map 不等于查找；find 不是返回全部匹配项。
</details>

## 9. 不运行也要能区分三种状态

阅读 AdminView，写出：输入改了未保存，保存了没发布，发布了等待部署，各对应哪种状态。

<details><summary>参考答案</summary>

unsaved=true 表示表单未保存；保存后 unsaved=false、meta.dirty=true 表示草稿待发布；正式提交后 dirty=false，但 online 还要等 deploy-info 中 releaseId 与本次一致。

实时预览反映当前表单，不证明已保存；ZIP 读取正式发布版本。
</details>

## 10. 跟踪一个按钮

在 IDEA 搜索“保存草稿”，从 @click 开始画出调用链，并写出每一层输入和输出。

<details><summary>参考答案</summary>

save → persist → request → githubRequest → handle → mutation('save') → repository.read → changeState → repository.commit → asDraft → acceptDraft。

Vue 页面负责表单和消息，state 负责数据规则，repository 负责网络提交。页面操作名称不等于 Pages 上的真实后端路由。
</details>

## 11. 用假数据理解版本冲突

```js
let learningRevision = 4;
const learningWindowA = 4;
const learningWindowB = 4;
if (learningWindowA === learningRevision) learningRevision++;
console.log(learningWindowB === learningRevision);
```

<details><summary>参考答案</summary>

false。A 保存后版本已是 5，B 仍基于第 4 版。真实代码拒绝这种覆盖，让用户重读；不应通过删掉 expectedRevision 检查来消除报错。
</details>

## 12. 阅读并运行自动检查

```sh
npm test
```

先在 github.test.mjs 找到“保存后正式内容仍是旧名称”的断言，再看第二个并发提交为什么失败。接着看 fixture 为什么用 Map 和 fake fetcher。

<details><summary>参考答案</summary>

测试使用内存中的初始状态，Repository 的网络函数被替换为 fixture.fetcher。fake ref 更新检查父提交必须仍是当前分支头，所以第二个旧快照提交不能覆盖新结果。

内容和仓库测试不需要真实 token，不向真实 GitHub 写数据。浏览器检查还需要已有 Playwright 环境，使用的同样是假仓库。
</details>

## 13. 读构建目录，不修改构建目录

运行 npm run build，打开 pages-output/index.html、admin/index.html 和 deploy-info.json，解释区别。

<details><summary>参考答案</summary>

根 index.html 是已经生成的玩家官网；admin/index.html 是 Vue 后台外壳；deploy-info 标识本次版本。构建会重新生成目录，所以修改源文件和内容，再构建，不在产物里长期维护手工改动。

本地仓库内容若旧于远程，生成的也是旧内容。拉取最新内容与“重新构建”是两个步骤。
</details>

## 14. 新增字段前先列清单（进阶）

假设未来给 brand 加一个可选 slogan。先不改线上，写出涉及哪些层。

<details><summary>参考答案</summary>

样例数据、旧记录兼容、validateContent 返回字段、后台输入框、renderSite 输出、对应测试，再构建部署。

验证可选字段的思路：

```js
slogan: text(brand.slogan ?? '', '游戏口号', 80, { required: false })
```

这只是一段字段示例，需要放在正确的返回对象里。只加输入框可能在保存时被白名单过滤；只改默认数据不会覆盖已经保存的内容。
</details>

## 15. 最后自测

| 问题 | 应能说出的要点 |
| --- | --- |
| 哪些东西真是框架生成，哪些只是名字常见？ | 常见入口/配置与第三方依赖、构建结果分开 |
| persist 是 Vue 内置函数吗？ | 不是，是项目自定义保存函数 |
| 改表单就是改源码吗？ | 通常只改内容对象，源码模板不变 |
| 关闭电脑官网为什么还在？ | 已发布静态文件在 GitHub Pages |
| 登录成功为何可能不能保存？ | 读取授权不等于仓库写权限 |
| 新图为什么会在第四张？ | 追加到数组末尾 |
| 为什么模板要 escapeHtml？ | 把文案当文本，避免被当成标签/属性 |
| 为什么需要 await persist？ | 确保先保存完再发布 |
| 为什么提交成功仍显示等待？ | Actions 还要构建和部署 |
| 为什么不能看 200 就说新版本上线？ | 旧页面也能返回 200，需要核对 releaseId |
| 本地预览填真实密钥会操作哪里？ | 仍写真实 GitHub，不能当隔离沙盒 |

能自己从按钮找到函数、数据、仓库提交、生成 HTML 和最终页面，就是已经理解项目的证据。掌握一个完整功能后，再扩大阅读范围。
