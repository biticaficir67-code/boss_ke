# 《未知的邮件》整套美术素材

本套使用内置 `image_gen` 工具逐张生成，共 5 张场景、2 张角色立绘。全部为概念美术，不是实机截图。统一冷灰绿、午夜蓝与暗琥珀光，图像不含界面文字。

## 已保存的项目素材

生成的 PNG 原图保留在工具生成目录；网页使用压缩后的 WebP，文件总计约 1.47 MiB。

| 素材 | 项目文件 | 尺寸 | 文件大小 |
| --- | --- | --- | --- |
| 夜雾邮局 | [public/artwork/arrival.webp](../public/artwork/arrival.webp) | 1672 × 941 | 214 KiB |
| 迷途林道 | [public/artwork/forest-road.webp](../public/artwork/forest-road.webp) | 1672 × 941 | 261 KiB |
| 午夜分拣室 | [public/artwork/sorting-room.webp](../public/artwork/sorting-room.webp) | 1672 × 941 | 245 KiB |
| 雾岸灯塔 | [public/artwork/lighthouse.webp](../public/artwork/lighthouse.webp) | 1672 × 941 | 197 KiB |
| 未投递的来信 | [public/artwork/dead-letter.webp](../public/artwork/dead-letter.webp) | 1672 × 940 | 210 KiB |
| 收件人 · 雪豹 | [public/artwork/receiver.webp](../public/artwork/receiver.webp) | 1086 × 1448 | 167 KiB |
| 夜班投递员 · 灰狼 | [public/artwork/courier.webp](../public/artwork/courier.webp) | 1086 × 1448 | 214 KiB |

`src/content/artwork.js` 是当前素材清单，官网轮播、画廊、默认角色图片、后台选择器都使用这一套。登录页使用夜雾邮局，后台概览跟随首张轮播。角色档案按 3:4 显示立绘。

旧 `public/sample-art/` 与原上传图片继续保留给历史版本恢复；当前官网不再引用旧演示图。历史图片的路径校验和恢复能力未删除。所有图片参与静态构建和 ZIP 导出，没有增加图片服务或运行时后端。

## 完整提示词

下列为各张图片实际使用的完整提示词。生成模式为全新生成，没有修改原上传图片；WebP 仅用于网页压缩交付。

### 夜雾邮局

目标文件：`public/artwork/arrival.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Wide cinematic 16:9 hero key art. A disused rural post office deep in conifer forest at midnight, wet stone path and rotting wooden facade. On the RIGHT third stands an adult male gray wolf mail carrier in a long charcoal overcoat with a worn brown canvas postal satchel and a small brass amber lantern, three-quarter rear view with recognizable wolf muzzle, upright ears, fluffy gray tail and silver facial fur. A pale sealed envelope protrudes from a rusted mailbox. Warm window light silhouettes the courier, fog conceals the forest road. Leave LEFT 45 percent of the frame dark, low-detail and spacious for website title overlay. Beautiful cinematic depth and melancholy uncanny storytelling, composed for a wide website hero.
```

### 迷途林道

目标文件：`public/artwork/forest-road.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Wide landscape 16:9 environmental concept art. A narrow wet road disappears into extremely tall conifers and layered midnight fog. In the right-middle distance, a small adult anthropomorphic snow leopard traveler in a dark moss hooded raincoat, hood down, worn small canvas satchel, walks away holding a cream envelope. Rounded spotted ears, fluffy spotted gray tail, clearly animal and adult. A crooked wooden postal direction post and an abandoned red-brown mailbox sit beside the path, no readable signage. One very distant amber window gives depth. A few dim fireflies-like dust motes, beautiful foliage and puddle reflections. Oppressive but intriguing quiet, no pursuing monster.
```

### 午夜分拣室

目标文件：`public/artwork/sorting-room.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Wide landscape 16:9 environmental concept art. Interior of the same abandoned timber post office at night, an old sorting counter with rows of wooden letter cubbies, dusty brass keys, a rotary desk telephone, paper parcels and an oil lamp. On the desk a single closed cream envelope sealed in dark oxidized red wax, no writing. A stopped wall clock and rain-streaked window opening onto a foggy forest. One uncanny long animal-like shadow falls across the floor without showing a creature. Soft amber lamp against cold slate window light. Rich worn wood and dust detail, readable composition and gentle suspense, no people.
```

### 雾岸灯塔

目标文件：`public/artwork/lighthouse.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Wide landscape 16:9 environmental concept art. A lonely weathered lighthouse and tiny closed postal outpost on a rocky northern coast at night, dense rolling sea fog and dark teal water. A stone path and corroded handrail lead toward a narrow amber lit door; the lighthouse beam barely penetrates mist. A small weathered mailbox on a wooden post in the foreground with a dangling cream envelope caught underneath, blank surfaces. Detailed storm-worn masonry, wet rock, subtle gull silhouettes and pine branches. An isolated destination from the same mysterious postal world, cinematic and eerie, no people, no storm action.
```

### 未投递的来信

目标文件：`public/artwork/dead-letter.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Wide landscape 16:9 narrative still life concept art. Close angled view across an old wooden postal archive desk at midnight: several yellowed envelopes with no readable writing, a weathered antique brass key, a wax seal bearing a simple non-letter paw impression, a partly open cabinet of undelivered letters receding into darkness, a single dusty oil lamp and a cold rain-streaked window. The main blank envelope at right center has a slightly broken dark reddish-brown wax seal and subtly damp edges. Deep shadows suggest an unsolved mystery, highly tactile paper fibers and scratched wood, amber highlights within slate green darkness. No text or typography anywhere.
```

### 收件人 · 雪豹

目标文件：`public/artwork/receiver.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Vertical 3:4 single character portrait for the receiver dossier. An adult anthropomorphic snow leopard traveler, clearly furry animal with rounded ears, soft silver-gray fur, dark rosette spots and alert pale amber eyes, mature balanced proportions, wearing a worn dark moss raincoat with hood down over a charcoal shirt and a simple canvas shoulder strap. Three-quarter upper body portrait including hands, holding one closed blank cream envelope near the chest, looking over the shoulder toward camera with wary curiosity, not smiling or violent. Beautiful expressive animal muzzle and whiskers. Blurred foggy conifer forest and faint amber bokeh behind. Character occupies center and upper two-thirds, restrained moody rim light, detailed fur and fabric, no cropped ears, no text, no props obscuring the face.
```

### 夜班投递员 · 灰狼

目标文件：`public/artwork/courier.webp`。

```text
Use case: stylized-concept. Create production-quality concept art for an original Chinese furry mild-horror mystery game called Unknown Mail. Cohesive atmospheric painterly realism, detailed fur and old materials, desaturated midnight slate blue and gray forest green, restrained warm amber practical light, soft volumetric mist, delicate film grain. Quiet unsettling mystery and loneliness rather than action. Adult anthropomorphic animal people only if requested, anatomically coherent, no humans. No gore, no blood, no jump scare, no cartoon flat vector shapes, no typography, no text, no UI, no lettering, no watermark. This is concept artwork, not a screenshot. Vertical 3:4 single character portrait for the night courier dossier, matching the hero courier exactly in design: adult male anthropomorphic gray wolf with upright ears, silver gray cheek fur, darker charcoal crown and muzzle bridge, muted amber eyes, mature muzzle and thick neck ruff. Long worn charcoal overcoat, weathered brown canvas postal satchel crossing the chest, gloved hand holding a small old brass lantern near lower right. Three-quarter upper body portrait, composed, guarded and enigmatic expression, clearly furry wolf, no human face. A blurred warm post office doorway and cold night fog behind, amber lantern rim light and slate shadows. Centered portrait with entire ears visible and strong expressive facial detail, no text, no badges with lettering.
```

