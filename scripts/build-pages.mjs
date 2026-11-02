import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { contentImages } from '../src/content/sections.js';
import { renderDocument } from '../src/site/render.js';
import { validateContent } from '../src/content/validation.js';
import { validateState, imageRepositoryPath } from '../src/github/state.js';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = path.join(projectRoot, 'pages-output');
const state = validateState(
  JSON.parse(await fs.readFile(path.join(projectRoot, 'site-content/state.json'), 'utf8')),
);
const release = JSON.parse(
  await fs.readFile(path.join(projectRoot, 'site-content/published.json'), 'utf8'),
);
const content = validateContent(release.content);
if (JSON.stringify(release) !== JSON.stringify(state.published))
  throw new Error('发布指针与仓库内容不一致，停止生成官网');
const [owner, repository] = (process.env.GITHUB_REPOSITORY || 'biticaficir67-code/boss_ke').split(
  '/',
);
const branch = process.env.GITHUB_REF_NAME || 'main';
if (!owner || !repository) throw new Error('GitHub 仓库配置不正确');
// Pages 会缓存固定地址；样式或脚本变化时换一个版本，防止新 HTML 混用旧资源。
const assetHash = createHash('sha256');
for (const source of ['src/site/site.css', 'src/site/runtime.js', 'public/favicon.svg'])
  assetHash.update(await fs.readFile(path.join(projectRoot, source)));
const assetVersion = assetHash.digest('hex').slice(0, 12);
// 固定生成目录，禁止由用户输入或环境变量决定递归清理目标。
if (path.dirname(output) !== projectRoot || path.basename(output) !== 'pages-output')
  throw new Error('生成目录不正确');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
await fs.writeFile(
  path.join(output, 'index.html'),
  renderDocument(content, { editorHref: './admin/', assetVersion }),
);
await fs.copyFile(path.join(projectRoot, 'src/site/site.css'), path.join(output, 'site.css'));
await fs.copyFile(path.join(projectRoot, 'src/site/runtime.js'), path.join(output, 'site.js'));
await fs.copyFile(path.join(projectRoot, 'public/favicon.svg'), path.join(output, 'favicon.svg'));
for (const src of contentImages(content))
  await fs.copyFile(
    path.join(projectRoot, imageRepositoryPath(src)),
    path.join(output, 'assets', path.basename(src)),
  );
await fs.writeFile(
  path.join(output, 'deploy-info.json'),
  JSON.stringify({
    releaseId: release.id,
    revision: release.revision,
    commit: process.env.GITHUB_SHA || '',
    builtAt: new Date().toISOString(),
  }),
);
await fs.writeFile(path.join(output, '.nojekyll'), '');
await build({
  configFile: path.join(projectRoot, 'vite.config.js'),
  root: projectRoot,
  define: {
    'import.meta.env.VITE_GITHUB_OWNER': JSON.stringify(owner),
    'import.meta.env.VITE_GITHUB_REPOSITORY': JSON.stringify(repository),
    'import.meta.env.VITE_GITHUB_BRANCH': JSON.stringify(branch),
    'import.meta.env.VITE_SITE_ASSET_VERSION': JSON.stringify(assetVersion),
  },
});
const adminDir = path.join(output, 'admin');
await fs.mkdir(path.join(adminDir, 'site-assets'), { recursive: true });
await fs.copyFile(
  path.join(projectRoot, 'src/site/site.css'),
  path.join(adminDir, 'site-assets/site.css'),
);
await fs.copyFile(
  path.join(projectRoot, 'src/site/runtime.js'),
  path.join(adminDir, 'site-assets/site.js'),
);
console.log(`GitHub Pages 官网与在线工作台已生成：${output}`);
