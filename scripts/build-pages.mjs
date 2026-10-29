import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { projectRoot } from '../server/config.mjs';
import { renderDocument } from '../src/site/render.js';
import { validateContent } from '../server/validation.mjs';
import { validateState, imageRepositoryPath } from '../src/github/state.js';

const output = path.join(projectRoot, 'pages-output');
const state = validateState(JSON.parse(await fs.readFile(path.join(projectRoot, 'site-content/state.json'), 'utf8')));
const release = JSON.parse(await fs.readFile(path.join(projectRoot, 'site-content/published.json'), 'utf8'));
const content = validateContent(release.content);
if (JSON.stringify(release) !== JSON.stringify(state.published)) throw new Error('发布指针与仓库内容不一致，停止生成官网');
const [owner, repository] = (process.env.GITHUB_REPOSITORY || 'biticaficir67-code/boss_ke').split('/');
const branch = process.env.GITHUB_REF_NAME || 'main';
if (!owner || !repository) throw new Error('GitHub 仓库配置不正确');
// 固定生成目录，禁止由用户输入或环境变量决定递归清理目标。
if (path.dirname(output) !== projectRoot || path.basename(output) !== 'pages-output') throw new Error('生成目录不正确');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
await fs.writeFile(path.join(output, 'index.html'), renderDocument(content, { editorHref: './admin/' }));
await fs.copyFile(path.join(projectRoot, 'src/site/site.css'), path.join(output, 'site.css'));
await fs.copyFile(path.join(projectRoot, 'src/site/runtime.js'), path.join(output, 'site.js'));
await fs.copyFile(path.join(projectRoot, 'public/favicon.svg'), path.join(output, 'favicon.svg'));
for (const slide of content.hero.slides) await fs.copyFile(path.join(projectRoot, imageRepositoryPath(slide.src)), path.join(output, 'assets', path.basename(slide.src)));
await fs.writeFile(path.join(output, 'deploy-info.json'), JSON.stringify({ releaseId: release.id, revision: release.revision, commit: process.env.GITHUB_SHA || '', builtAt: new Date().toISOString() }));
await fs.writeFile(path.join(output, '.nojekyll'), '');
await build({
  configFile: false, root: projectRoot, base: './', plugins: [vue()],
  define: {
    'import.meta.env.VITE_SITE_BACKEND': JSON.stringify('github'),
    'import.meta.env.VITE_GITHUB_OWNER': JSON.stringify(owner),
    'import.meta.env.VITE_GITHUB_REPOSITORY': JSON.stringify(repository),
    'import.meta.env.VITE_GITHUB_BRANCH': JSON.stringify(branch),
  },
  build: { outDir: path.join(output, 'admin'), emptyOutDir: true, assetsDir: 'app-assets' },
});
const adminDir = path.join(output, 'admin');
const adminHtml = await fs.readFile(path.join(adminDir, 'index.html'), 'utf8');
await fs.writeFile(path.join(adminDir, 'index.html'), adminHtml.replace('<head>', '<head><script>window.__STATIC_GITHUB__=true</script>').replace('首次启动可能需要几秒，请保留启动窗口。', '正在加载管理页面，请稍候。'));
await fs.mkdir(path.join(adminDir, 'site-assets'), { recursive: true });
await fs.copyFile(path.join(projectRoot, 'src/site/site.css'), path.join(adminDir, 'site-assets/site.css'));
await fs.copyFile(path.join(projectRoot, 'src/site/runtime.js'), path.join(adminDir, 'site-assets/site.js'));
console.log(`GitHub Pages 官网与在线工作台已生成：${output}`);
