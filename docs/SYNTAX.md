# 零基础语法详解：读懂项目里的每一种常见写法

这不是要求你先背完的一本教材。遇到一行看不懂的代码，先判断它属于 HTML、CSS、JavaScript、Vue 模板还是配置文件，再到对应章节查。每个例子都围绕当前项目，代码片段用于理解，不能把不完整片段直接覆盖进正式文件。

建议顺序：先读第 1–8 节，再读函数和数组，最后进入 Vue 与异步请求。配合 [项目解析](CODE_GUIDE.md)、[文件来源](FILE_MAP.md) 和 [练习](EXERCISES.md)。

## 1. “代码”其实包含几种不同的语言

| 你在哪看到 | 主要语言 | 负责什么 |
| --- | --- | --- |
| .html | HTML，可能内含 CSS/JS | 页面结构 |
| .css | CSS | 外观和布局 |
| .js、.mjs | JavaScript | 运算、数据、交互、请求 |
| .vue 的 script | JavaScript + Vue 提供的函数 | 页面数据与逻辑 |
| .vue 的 template | HTML 风格 + Vue 指令 | 数据如何显示 |
| .json | JSON | 保存数据/配置，不执行函数 |
| .yml | YAML | 描述自动化步骤 |
| .md | Markdown | 写说明、标题、表格、代码示例 |
| .bat | Windows 批处理 | 调用启动命令 |

同一个大括号出现在不同语言里，意义可能不同。先看当前文件和区块，不能把所有符号用一种规则解释。

## 2. 注释、空格和排版

JavaScript：

```js
// 单行说明，程序不会把它当操作执行。
/* 跨行说明，或写在一行中间的说明。 */
const count = 4;
```

HTML 用 `<!-- 说明 -->`，CSS 用 `/* 说明 */`。普通 JSON 不允许注释。

缩进主要帮助人看清结构。我们用两个空格缩进。Prettier 是排版工具，不决定业务逻辑；`npm run format` 修改排版，`format:check` 只检查。

换行、缩进不等于“新的功能”。但字符串里面的空格和换行可能是实际输出的内容；HTML 内联元素之间的空格也可能影响显示，因此不能随意对所有文本做删除空白处理。

## 3. HTML：标签、属性、内容

```html
<h1 class="game-title">我的游戏</h1>
```

逐项读：`h1` 表示一级标题；`class="game-title"` 给它一个 CSS 类；两个标签中间是显示文字；`</h1>` 表示结束。

```html
<a href="https://example.com/game.zip">下载游戏</a>
<img src="./assets/island.svg" alt="海岛与灯塔" />
```

`href` 是链接目的地，`src` 是图片来源，`alt` 是图片无法显示时的替代文字，也帮助不能直接看图的用户。`img` 没有一段包起来的正文，不像 p、h1 那样写一对开始/结束标签。

| 常见标签 | 本项目的用途 |
| --- | --- |
| html / head / body | 文档整体、元信息、可见内容 |
| header / nav / main / section / footer | 页头、导航、主要内容、区块、页脚 |
| div / span | 分组容器和较小范围的行内内容 |
| h1 / h2 / h3 / p | 标题和段落 |
| button / a | 执行动作的按钮 / 跳转链接 |
| input / textarea / select / option | 输入一行、多行、选择项 |
| label / form | 输入说明 / 一组表单 |
| iframe | 在当前页面内放入另一个文档，项目用于预览 |
| svg / path | 用坐标描述矢量图形，项目用于图标 |

`class` 可以重复出现在多个元素上；`id` 用于定位某个具体元素，通常应在一个文档中唯一。`href="#download"` 跳到 id 为 download 的位置。

## 4. HTML 的几个容易误解的属性

```html
<button disabled>下载即将开放</button>
<input type="password" />
```

disabled 是布尔属性，在普通 HTML 中只要出现，就表示禁用。写 `disabled="false"` 并不是启用；Vue 中需要用 `:disabled="某个布尔表达式"` 来动态控制。

type=password 只是遮住输入框里的显示，不代表内容被加密，也不代表保存位置安全。是否能访问仓库，仍由 GitHub 的授权检查决定。

`target="_blank"` 常用于新窗口/标签页打开外部链接。当前完整草稿预览改为在同一页切换，保持当前标签页的登录状态。

`aria-label`、`aria-pressed` 等属性帮助辅助技术理解按钮功能和状态。它们不是轮播切换的主要业务逻辑，但应随着状态同步更新。

## 5. CSS：选择器找到谁，大括号说明怎么显示

```css
.game-title {
  color: #345344;
  font-size: 32px;
  margin-bottom: 16px;
}
```

`.game-title` 选中 class 包含 game-title 的元素。每条规则为“属性: 值;”。花括号把同一组规则包起来。

| 写法 | 选择谁 |
| --- | --- |
| `h1` | 所有 h1 元素 |
| `.panel` | class 包含 panel 的元素 |
| `#download` | id 为 download 的元素 |
| `.panel p` | panel 内部后代 p |
| `.panel > p` | panel 的直接子元素 p |
| `.button.primary` | 同一个元素同时有 button 和 primary 两个类 |
| `.button:hover` | 鼠标悬停的按钮 |
| `.button:disabled` | 禁用状态的按钮 |
| `[data-slide]` | 带 data-slide 属性的元素 |

`.gs-slide.is-active` 不是名叫“gs-slide.is-active”的单独类，它要求两个类同时存在。项目中 JS 添加/删除 is-active，CSS 据此显示当前轮播图。

## 6. CSS 布局和单位

每个元素可看作盒子：内容 → padding 内边距 → border 边框 → margin 外边距。

```css
.panel {
  padding: 20px;
  border: 1px solid #dddddd;
  margin-bottom: 16px;
}
```

padding 增加内容到边框的距离；margin 增加盒子与其他盒子的距离。`box-sizing: border-box` 让设置的宽度通常包含 padding 和 border，便于控制整体尺寸。

| 写法 | 解释 |
| --- | --- |
| 20px | CSS 像素长度 |
| 100% | 相对于相应包含块等上下文计算的比例 |
| 100vh | 相对于视口高度的单位 |
| 1rem | 相对于根元素字号 |
| opacity: .5 | 半透明；0 看不见，1 完全不透明 |
| color: #345344 | 十六进制颜色 |
| object-fit: cover | 图片保持比例铺满容器，可能裁边 |

Flex 常用于把导航、按钮、工具栏排成一行：`display:flex`、`gap`、`align-items`、`justify-content`。

Grid 常用于同时管理行列：`display:grid`、`grid-template-columns`、`gap`。

`position:relative` 建立定位参照，`position:absolute` 让覆盖层相对参照定位；`z-index` 控制叠层。轮播的遮罩、文字和图片有多层，因此要同时看定位与层级。

```css
@media (max-width: 700px) {
  .editor-layout {
    display: block;
  }
}
```

这表示在满足屏幕条件时使用里面的规则，是手机适配的重要方式。规则不是创建新 HTML，而是改变已有结构的外观。

## 7. 变量：给一个值起名字

```js
const name = '我的游戏';
let current = 0;
current = 1;
```

`const` 创建不能重新绑定的变量；`let` 创建允许重新赋值的变量。`=` 是赋值，不是询问两边是否相同。分号结束语句。

```js
const content = { name: '旧名字' };
content.name = '新名字'; // 可以：修改对象的字段。
// content = {};        // 不可以：给 const 重新绑定另一个对象。
```

因此 `const form = ref(...)` 并不表示表单内容永远不能改。变量名大小写不同就是不同名字，例如 form 和 Form。

## 8. 值的类型：不是每个内容都一样

```js
const title = 'Hello';  // 字符串
const interval = 5500;  // 数字
const enabled = true;   // 布尔值
const nothing = null;  // 明确表示这里暂时没有对象
let notAssigned;       // undefined：还没有赋值
const slides = [];     // 数组
const brand = {};      // 对象
```

`'4'` 是字符串，`4` 是数字，`false` 是布尔值，`'false'` 是非空字符串。类型不同，运算和条件结果也可能不同。

`typeof value` 可以观察类型，但有历史细节，例如 typeof null 是 object，不能只靠这一项判断“有效的普通对象”。验证代码额外检查 null 与数组就是这个原因。

NaN 表示不是有效数字的数值结果，例如 `Number('abc')`。项目使用 Number.isInteger 等进一步检查端口和间隔。

## 9. 引号、换行、模板字符串

单引号和双引号都能创建字符串：`'游戏'`、`"游戏"`。普通引号里的 `\n` 表示换行字符；反斜杠也用于转义引号等特殊字符。

反引号支持多行与插值：

```js
const game = '雾海来信';
const html = `<h1>${game}</h1>`;
```

`${game}` 的意思是“计算 game，把结果放在这个位置”。这里是 JavaScript 模板字符串，不是 Vue 的双大括号，也不是 Actions 的 `${{ ... }}`。

源码 render.js 的 HTML 最后仍是一个字符串。它要被写入 HTML 文件或放进 iframe，才由浏览器按 HTML 规则解释。

## 10. 对象：用字段描述一件事

```js
const brand = {
  name: '我的游戏',
  studio: '我的工作室',
};

console.log(brand.name);
brand.name = '新的游戏名';
```

花括号包含对象。`name` 是键，后面冒号右边是值，逗号分隔字段。末尾多一个逗号在 JavaScript 中通常允许，在标准 JSON 中不允许。

点号访问字段：brand.name。也可以用方括号：brand['name']。方括号里的键可以来自另一个变量。

```js
const field = 'name';
console.log(brand[field]);
```

同一份内容里的嵌套对象可以这样访问：`content.hero.title`。每个点号都向里面再取一层。

## 11. 数组：把多项按顺序放在一起

```js
const slides = ['岛', '森林', '旅途'];
console.log(slides[0]);     // 岛
console.log(slides.length); // 3
slides.push('新画面');      // 追加到末尾
```

数组下标从 0 开始。length 是数量，最后一项的下标是 length - 1。

| 方法 | 效果 | 是否修改原数组 |
| --- | --- | --- |
| push(x) | 末尾增加 | 是 |
| unshift(x) | 开头增加 | 是 |
| pop() | 移除末尾一项 | 是 |
| splice(i, 1) | 从 i 位置移除一项 | 是 |
| slice(a, b) | 复制一段，通常不含 b | 否 |
| includes(x) | 是否包含 x | 否 |
| find(fn) | 第一项满足条件的值 | 否，回调自身另改数据则另说 |
| filter(fn) | 满足条件的项组成新数组 | 否，元素对象仍可能共享引用 |
| map(fn) | 把每项转换后组成新数组 | 否，转换是否返回原对象要看回调 |
| join('') | 把各项拼成一个字符串 | 否 |

数组添加图片不会自动变成第一张；顺序由它在 hero.slides 中的位置决定。

## 12. 判断：if、严格比较、真假值

```js
if (slides.length === 0) {
  console.log('还没有图片');
} else {
  console.log('可以显示轮播');
}
```

`===` 比较值与类型是否一致，`!==` 表示不一致；`=` 用来赋值。`4 === '4'` 为 false。项目通常使用严格比较，避免隐式类型转换造成歧义。

常见假值包括 false、0、空字符串、null、undefined、NaN。空数组和空对象都是真值，所以不能用 `if ([])` 判断数组里面是否有项，要看 length。

```js
if (!repository) throw new Error('请先授权');
```

`!` 取反；`!!value` 把值转成明确的布尔值。上面意思是“没有仓库对象，就报错退出”。

## 13. &&、||、?? 和三元表达式

```js
if (enabled && url) {
  console.log('开关打开，而且有地址');
}
const label = customLabel || '下载游戏';
const text = oldRecord.note ?? '';
const status = online ? '已上线' : '等待部署';
```

`&&` 前面为假值时不继续算后面；`||` 前面为真值时使用前面，否则使用后面。它们返回的是参与运算的值，不一定只返回 true/false。

`??` 只在左侧为 null 或 undefined 时使用右侧，所以 `0 ?? 5500` 是 0，而 `0 || 5500` 是 5500。

三元写法是“条件 ? 成立时 : 否则”。源码中连续三元可以先按下面的 if 链理解：

```js
if (unsaved) return '有未保存修改';
if (dirty) return '草稿待发布';
if (!online) return '等待部署';
return '已全部发布';
```

阅读短写法时先拆开，不用一开始就追求自己也写得很短。

## 14. 函数：给一组步骤起名字

```js
function greet(name) {
  return '你好，' + name;
}

const result = greet('玩家');
```

name 是参数；调用时传入的“玩家”是实参。return 把结果交给调用者，并结束这一次函数执行。没有显式返回值的函数通常返回 undefined。

函数可以做动作，也可以计算结果。renderDocument 返回 HTML；notify 改提示状态；它们都叫函数，但职责不同。

```js
function imagePath(src) {
  if (imageResolver) return imageResolver(src);
  if (staticAssets) return './assets/' + src.split('/').pop();
  return src;
}
```

每个 return 都让后面的步骤不再执行，这叫提前返回。看懂提前返回，比只看最后一行更重要。

## 15. 默认参数与选项对象

```js
function show(message = '你好') {
  return message;
}
```

没传参数或传 undefined 时使用默认值；传 null 不会自动换成“你好”。

项目经常接收选项对象：

```js
request('/api/admin/draft', {
  method: 'PUT',
  body: { content: form.value, expectedRevision: meta.value.revision },
});
```

第一个参数是操作名；第二个参数用字段说明方法和数据。把相关设置放成对象，可以不用记一长串位置参数的顺序。

## 16. 箭头函数和回调

```js
const getName = (image) => image.name;
const getNameLong = (image) => {
  return image.name;
};
```

上面这两段在返回值方面相同。箭头后面直接接表达式时可省 return；后面是花括号代码块时，想返回值就要写 return。

```js
const names = uploads.map((image) => image.name);
```

map 会对每个元素调用你传进去的函数；这个函数就是回调。image 名字是我们自己起的，不是固定关键字。

```js
button.addEventListener('click', save);   // 传入函数，点击时调用
// button.addEventListener('click', save()); // 会立即调用，再把结果交给监听器
```

Vue 的 `@click="save"` 与传函数处理事件的思路相似。`@click="moveSlide(index, -1)"` 由 Vue 编译成事件处理表达式，不要直接当成普通 JS 参数来机械替换。

箭头函数没有自己的 this；普通方法中的 this 与调用方式有关。GitHubRepository 的方法使用 this，通常通过 repo.read() 调用，不应随意脱离对象单独取出来运行。

## 17. 循环和数组转换一起读

```js
for (const slide of content.hero.slides) {
  console.log(slide.src);
}

const cards = content.hero.slides
  .map((slide) => `<img src="${slide.src}">`)
  .join('');
```

第一段逐项执行动作；第二段把每项变成字符串，再拼起来。这个例子省略了真实代码中的路径验证和 HTML 转义，实际模板需要它们。

find 用于找一个，filter 用于保留多个，map 用于转换。`(_, index)` 中下划线只是开发者表示“这个参数暂时不用”的名字，不是特殊语法。

## 18. 解构：从对象或数组取值

```js
const { brand, hero } = content;
```

相当于分别取 content.brand、content.hero。不要误读成创建一个新 content。

```js
const [first, second] = ['岛', '森林'];
[slides[a], slides[b]] = [slides[b], slides[a]];
```

数组解构按位置取值，第二行交换两个位置。项目的 moveSlide 正是用这种方式排序。

```js
function renderSite(content, { editorLink = true } = {}) {
  // ...
}
```

这行同时用了函数参数、对象解构、字段默认值、参数默认值。可以拆成：第二个参数默认是空对象，再从它取 editorLink，没有值时用 true。

## 19. 展开 ... 与复制数据

```js
const allImages = [...uploads, ...samples];
const next = { ...oldState, revision: oldState.revision + 1 };
```

数组展开把多个列表接在一起；对象展开把字段复制到新对象，同名字段后写的覆盖先写的。

展开是浅复制。对象里的 brand 若仍指向旧对象，修改 next.brand.name 可能也影响 oldState.brand.name。

项目的内容是普通结构化数据，使用 structuredClone 创建独立副本：

```js
const editable = structuredClone(data.content);
```

它适合这里的普通对象/数组。不要认为所有对象、函数、DOM 节点都可以这样复制。深复制也不是“自动保存到硬盘”。

## 20. 可选链 ?. 防止读取不存在的层级

```js
const sources = form.value?.hero.slides.map((slide) => slide.src) || [];
```

先尝试读取 form.value；它为 null/undefined 时，可选链停止，结果为 undefined；再由 `|| []` 提供空数组。

它不是绕过一切数据错误：如果某个本应存在的中间结构不符合约定，仍可能报错。所以读取正式数据时还需要 validateState/validateContent。

可选函数调用例如 `cleanup?.()` 表示 cleanup 存在时调用。它与属性读取是同一个“可选”的思路。

## 21. import/export：文件之间怎样连接

```js
export function renderDocument(content) { /* ... */ }
import { renderDocument } from '../site/render.js';
```

这是具名导出和具名导入，名字需要对应。

```js
import App from './App.vue';
```

这是默认导入，Vue 编译后的组件会提供相应默认导出。默认导入名字可以由调用文件命名；花括号写法和无花括号写法不能随便互换。

`./` 表示当前目录，`../` 表示向上一层。`src/github/state.js` 里的 `../content/validation.js` 是先从 github 回到 src，再进入 content。

`import('路径')` 是动态导入，返回 Promise，项目用它按需加载页面和操作模块。package.json 的 type:module 声明 .js 按模块规则解释；.mjs 也明确表示 ES 模块。

## 22. Promise：尚未完成的结果

网络读取不是立即得出结果，所以用 Promise 表示将来的成功或失败。

```js
const pending = fetch('https://example.com/data.json');
```

pending 不是数据内容，而是一个等待中的结果。`.then()` 接成功后的动作，`.catch()` 接失败后的动作。

```js
pending
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.log(error.message));
```

每一层返回的值，会成为下一层收到的结果；返回另一个 Promise 时，会继续等待它。抛出错误会把链路转成失败，直到有 catch 接住。

## 23. async/await：把等待过程写得像顺序步骤

```js
async function loadContent() {
  const response = await fetch('https://example.com/data.json');
  const data = await response.json();
  return data;
}
```

async 函数返回 Promise。await 暂停这个函数后续步骤，等当前结果完成，不是阻塞整个浏览器的所有功能。

发布时必须先保存再发布：

```js
await persist();
await request('/api/admin/publish', { method: 'POST', body });
```

如果去掉第一个 await，发布可能在保存完成前读取旧草稿。

## 24. Promise.all：同时开始独立工作

```js
const [draft, images, releases] = await Promise.all([
  request('/api/admin/draft'),
  request('/api/admin/uploads'),
  request('/api/admin/history'),
]);
```

这三项可以独立读取，所以同时发起。全部成功后，结果顺序仍与传入顺序对应，不是按谁先完成排序。任意一项失败，等待会报错。

保存和发布互相依赖，不适合为了“快一点”直接塞进同一个 Promise.all。

## 25. try/catch/finally 与 throw

```js
busy.value = 'save';
try {
  await persist();
  notify('已保存');
} catch (error) {
  notify(error.message, 'error');
} finally {
  busy.value = '';
}
```

try 运行可能失败的操作；catch 处理错误；finally 无论成功失败都做收尾。没有 finally，保存失败后按钮可能一直禁用。

```js
throw new Error('图片格式不正确');
```

throw 不是显示提示，它中断当前正常流程，把错误交给外层。之后由页面 catch 和 notify 显示。HttpError 是本项目自己扩展的 Error，额外带 status，便于区别版本冲突等情况。

## 26. fetch、状态码和超时

```js
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
if (!response.ok) throw new Error('请求没有成功');
```

fetch 返回 Response，不是直接返回 JSON。需要根据内容调用 response.json()、text()、blob() 或 arrayBuffer()。

HTTP 401/403 等响应一般不会只因为状态码就让 fetch 自己抛出网络错误，因此 repository.api 显式检查 response.ok。

| 方法/状态 | 本项目里怎么读 |
| --- | --- |
| GET | 获取数据 |
| POST | 创建资源或执行操作 |
| PUT | 保存草稿的统一操作名称 |
| PATCH | 更新 Git 分支引用 |
| DELETE | 移除素材的统一操作名称 |
| 200/201 | 成功或创建成功 |
| 401 | 授权失效/需要登录 |
| 403 | 权限不够或请求被拒绝 |
| 404 | 对应资源未找到 |
| 409 | 版本冲突/操作与现状冲突 |
| 422 | GitHub 拒绝某种提交/引用更新 |

统一操作名称在 client 里会映射为真实 GitHub 请求，所以页面写 PUT 不代表它向 Pages 的同名地址发了 PUT。

AbortController 可以把取消信号交给 fetch；计时器到期调用 abort，避免无限等待。repository.api 的默认请求超时是 45 秒，finally 清理计时器。

## 27. class、new、constructor、this

```js
class Website {
  constructor(name) {
    this.name = name;
  }
  label() {
    return this.name;
  }
}
const site = new Website('我的游戏');
console.log(site.label());
```

class 定义一类对象；new 创建实例；constructor 初始化；this 指向当前调用关联的对象；label 是实例方法。

GitHubRepository 把目标仓库、分支、token、fetcher 放进同一个实例，后续方法通过 this 使用这些配置。测试传入假的 fetcher，真实页面使用 globalThis.fetch。

## 28. 正则表达式：检查某类字符串

```js
/^https:\/\//i.test(url)
```

两侧斜杠表示正则；`^` 表示从字符串开头匹配；`\/` 表示字面斜杠；`i` 表示忽略大小写；test 返回是否匹配。

```js
/\n/g
```

匹配换行；g 表示处理所有匹配，项目用 replace 把它们转成 `<br>`。

`[a-f0-9-]` 表示允许十六进制字符或横线这一类字符；`{36}` 表示重复指定次数。图片路径验证还限定目录和扩展名，不是随意接受用户提供的任意路径。

正则是字符串规则检查工具，不会自动确认一个文件确实可以安全解码或一个下载链接里真的存在游戏。

## 29. Map、Set 和缓存

```js
const cache = new Map();
cache.set('/uploads/example.webp', '某个临时地址');
const value = cache.get('/uploads/example.webp');
```

Map 用键查值。图片预载缓存有时存的是 Promise：已经有读取任务就等待同一任务，避免多个同时发出的读取重复下载。

Set 保存不重复的值。`new Set(ids).size` 可用于检查 ID 是否重复。不要把 Map、Set 当作自动持久化数据库，它们通常只活在当前程序内存中。

## 30. DOM 与事件：JS 怎样找到页面

```js
const hero = document.querySelector('.gs-hero');
hero.addEventListener('mouseenter', handler);
```

document 是当前浏览器文档；querySelector 按 CSS 风格选择器找一个元素；querySelectorAll 找一组元素；addEventListener 在事件发生时调用处理函数。

`event.currentTarget` 是当前绑定处理器的元素，`event.target` 可能是内部真正触发事件的子元素。图片选择的 event.target.files 是用户选中的文件列表。

`element.dataset.interval` 读取 `data-interval`，读到的通常是字符串，代码用 Number 转成数字。

绑定事件之后用同一个函数引用 removeEventListener 才能正确移除。项目用 cleanups 数组保存移除步骤，并在清理函数中执行。

## 31. 定时器、闭包、轮播和防抖

setTimeout 延迟执行一次；setInterval 周期执行；时间单位是毫秒，1000 毫秒等于 1 秒。clearTimeout、clearInterval 取消相应任务。

```js
let timer;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => console.log('停止输入后再运行'), 220);
}
```

连续调用 schedule 会不断取消旧任务，这就是项目预览使用的简单防抖。

内部函数还能访问外层的 timer、current 等变量，这种保持访问关系的机制称为闭包。mountSite 返回的清理函数仍能访问它创建的计时器和监听列表。

轮播使用 `(next + slides.length) % slides.length`，将上一张/下一张的常见边界绕回合法下标。它不是可以处理一切任意大负数的通用函数。

## 32. Blob、Base64、UTF-8 与图片

Blob 表示一段二进制数据和类型。`URL.createObjectURL(blob)` 给当前浏览器里的数据创建临时可显示地址，`revokeObjectURL` 释放它。这个地址不能拿给其他玩家作为永久文件地址。

Base64 把字节编码为适合文本传输的字符，不是加密。图片上传把图像结果放进 JSON，GitHub 文件 API 也会用它返回内容。

中文字符不能简单当成单字节。encodeText 先通过 TextEncoder 转成 UTF-8 字节，再编码 Base64；decodeText 反过来用 TextDecoder 还原。

图片处理链：File → createImageBitmap → Canvas 缩放 → toBlob 输出 WebP → FileReader 转成文本编码。每一步数据类型不同，所以不应把 file、bitmap、blob、Base64 字符串都当成同一种对象。

## 33. JSON：数据文本与 JS 对象的区别

```json
{
  "name": "我的游戏",
  "enabled": true,
  "slides": []
}
```

JSON 的字段名和字符串必须用双引号，不能写函数、注释、undefined、尾逗号。

JSON.stringify 把对象变成字符串；JSON.parse 把合法 JSON 还原成值。项目用 stringify 比较当前规范化内容是否变化，但不要把它当成适用于所有 JavaScript 对象、所有字段顺序的万能深比较。

## 34. Vue 单文件组件：三块分别负责什么

```vue
<script setup>
import { ref } from 'vue';
const name = ref('我的游戏');
</script>

<template>
  <input v-model="name" />
  <p>{{ name }}</p>
</template>

<style scoped>
p { color: green; }
</style>
```

script setup 写组件逻辑；template 声明显示结构；style 写样式，scoped 会由编译工具处理为主要作用于当前组件的样式规则。

浏览器不能把 .vue 文件当普通 HTML 直接理解，需要 Vite 的 Vue 插件转换。本项目后台大量样式在共享 styles.css，组件不一定都有 style 块。

## 35. ref、reactive、computed

```js
const count = ref(0);
count.value++;
```

ref 是一个可被 Vue 追踪的包装值。JS 中用 .value；模板会自动解包常用的顶层 ref，因此模板写 count。

```js
const auth = reactive({ authenticated: false, username: '' });
auth.username = '管理员';
```

reactive 追踪对象字段，通常直接读写属性，不使用 .value。auth.js、notify.js 共享这类状态。

```js
const doubled = computed(() => count.value * 2);
```

computed 描述“根据别的状态计算结果”。依赖改变时更新，使用时也有 .value 的 JS 访问形式。项目用它计算 unsaved、当前标签页、素材合并列表等。

这些值是前端内存状态，刷新后会重新建立，不会因为用了 ref 就自动保存到 GitHub。

## 36. Vue 模板指令逐个解释

| 写法 | 读法 |
| --- | --- |
| `{{ form.brand.name }}` | 显示表达式结果，按文本处理 |
| `v-model="form.brand.name"` | 输入与数据双向绑定 |
| `v-model.number="form.hero.interval"` | 绑定并尝试按数字处理输入 |
| `v-if="loading"` | 条件真时渲染这块 |
| `v-else-if="loadError"` | 前面不成立，再判断这个 |
| `v-else` | 前面都不成立时使用 |
| `v-for="image in uploads"` | 为列表每项生成结构 |
| `:key="image.id"` | 给列表项稳定标识，方便正确跟踪变化 |
| `:src="imageUrl(image.src)"` | 动态绑定 src |
| `:class="{ active: selected }"` | 条件真时添加 active 类 |
| `@click="save"` | 点击调用 save |
| `@submit.prevent="submit"` | 阻止浏览器默认表单跳转，使用自己的提交逻辑 |
| `@click.self="close"` | 事件直接发生在这个元素自身时处理，常用于弹窗背景 |
| `v-html="html"` | 把字符串作为 HTML 插入，不能随意放不可信原始输入 |

`:` 是 v-bind 的简写，`@` 是 v-on 的简写。不带冒号的 `name="lock"` 是文字 lock，带冒号的 `:size="18"` 是表达式结果 18。

列表可能重排时，稳定 ID 比简单下标更适合当 key。项目轮播项和图片记录都使用 id。

## 37. watch 与生命周期

```js
watch(form, () => {
  // 表单变化后执行。
}, { deep: true });
```

deep 让监听涉及嵌套字段变化。watch 是“变了以后做一件事”；computed 是“根据依赖计算一个值”，不能因为都跟数据变化有关就互相乱换。

onMounted 在组件挂载后执行，适合读取内容、绑定事件；onUnmounted 在离开后清理计时器和监听器。Router 的 onBeforeRouteLeave 可在离开前处理未保存提醒。

在项目中，watch form 更新预览，不自动保存；onMounted load 读取已保存数据，不会自动覆盖真实内容。

## 38. 组件、props 与 Router

```vue
<Icon name="upload" :size="18" />
```

Icon 是自定义组件，name、size 是调用方传入的属性。组件里的 defineProps 声明它们。图标 paths 对象中的坐标只是素材数据，不需要先背每个数字。

RouterView 显示当前路由页面；RouterLink 用 Router 导航；router.replace 改当前路由而不按普通 push 再加一条导航记录。

`meta: { admin: true }` 是我们约定的页面标记。beforeEach 看它决定是否检查登录；admin 并不是 Router 自带的安全权限名称。真实仓库写权限仍由 GitHub API 验证。

## 39. 逐符号拆开一段真实业务代码

```js
const unsaved = computed(() => !!form.value && JSON.stringify(form.value) !== saved.value);
```

从外到内读：

1. const unsaved：把结果起名 unsaved。
2. computed(...)：这是一个随依赖更新的计算值。
3. () => ...：传入一个无参数的函数。
4. !!form.value：先确认表单已有内容。
5. &&：前面成立才继续比较。
6. JSON.stringify(form.value)：把当前表单转成可比较的字符串。
7. !== saved.value：与上次保存的字符串不同。

整句是“表单已经加载，而且现在的内容与上次保存不同”。模板里的保存按钮据此决定是否可以点击。

## 40. 再拆一段写操作队列

```js
const job = queue.then(() => handle(url, options));
queue = job.catch(() => {});
return job;
```

第一行把本次操作接到之前任务后面。第二行给“后续队列的连接点”接住错误，避免一次失败阻断以后所有操作。第三行仍返回原 job，所以当前调用者仍能收到本次失败，并显示错误。

如果直接把 catch 后的结果当成“操作成功”返回，可能把真实保存失败吞掉；如果完全不处理队列失败，后面的操作可能一直不运行。

这只串行化当前页面实例的写操作，不能代替 expectedRevision 和 Git 非强制分支更新。

## 41. Node.js 文件操作与路径

```js
import fs from 'node:fs/promises';
await fs.writeFile(filename, html);
```

node: 前缀说明是 Node.js 内置模块。fs 写硬盘文件，promises 版本返回 Promise，所以配合 await。

path.join 连接路径，path.resolve 规范化为绝对路径。Windows 的反斜杠与网页 URL 的斜杠不是同一种路径规则，不要手工混着拼。

`import.meta.url` 是当前模块地址；`new URL('..', import.meta.url)` 找上层目录地址；fileURLToPath 转成系统文件路径。本项目再用 path.resolve 规范化，避免目录末尾斜杠影响安全比较。

这些操作出现在构建和启动脚本，不是在普通玩家浏览器里直接写项目文件。

## 42. npm、配置和自动部署的语法

package.json 的 scripts 是名称到命令的映射。`npm run build` 查找 build 字段并执行对应命令。name、scripts、dependencies 是 npm 认识的键，里面的项目名和命令内容由开发者填写。

`dependencies` 是应用使用的库，`devDependencies` 是构建、排版等开发工具；Actions 构建需要安装相应开发工具。package-lock 由 npm 维护具体版本，不需要你手写依赖树。

YAML 示例：

```yaml
steps:
  - run: npm test
  - run: npm run build
```

冒号表示字段；缩进表示层级；短横线表示列表项。Actions 看到 run 时运行后面的命令。缩进在 YAML 中有结构意义，不能像普通文本随便挪。

Actions 的 `${{ github.sha }}` 与 JS 的 `${value}` 是两种语法，由不同工具解释。

Vite 配置里的 define 可把指定值放进前端构建；浏览器能拿到这些值，因此这里只放公开仓库地址，不放 GitHub 密钥。

## 43. 最后认清“语言自带”和“我们自己起名”

| 名称 | 来源 |
| --- | --- |
| const、let、if、return、async、await、class | JavaScript 语法 |
| JSON、Map、Set、Promise | JavaScript 标准内置对象 |
| fetch、document、FileReader、Canvas、sessionStorage | 浏览器或相应运行环境提供的 API |
| ref、computed、watch、onMounted | Vue 提供的函数 |
| createRouter、RouterView | Vue Router 提供 |
| renderDocument、persist、changeState、GitHubRepository、notify | 本项目自己编写 |
| form、busy、picker、unsaved、revision | 本项目自己起的变量或字段名 |

例如 persist 不是 Vue 关键字，只是“保存当前表单”的自定义函数名。你可以改名，但必须同步修改所有调用它的地方。

## 44. 查阅与继续学习

先使用本项目练习验证自己的理解，再看完整官方资料：

- [Vue 官方响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)：查 ref 与响应式对象的更多细节。
- [MDN 中文变量入门](https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Scripting/Variables)：巩固变量和类型。
- [Vite 官方 JavaScript API](https://vite.dev/guide/api-javascript.html)：查 build、preview 的调用方式。

本文示例按当前项目的用途逐步解释，不代表完整覆盖一门语言。能独立读懂“从输入框改变对象，到保存、提交、生成 HTML”这条链路，再扩展其他语法会更容易。
