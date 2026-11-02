import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { githubFixture } from './helpers/github-fixture.mjs';
import { fileURLToPath } from 'node:url';
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
import { decodeText } from '../src/github/repository.js';
import { publishedPath } from '../src/github/state.js';
import { artwork } from '../src/content/artwork.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = githubFixture(
  await Promise.all(
    artwork.map(async (image) => [
      `public${image.src}`,
      (await fs.readFile(path.join(projectRoot, 'public', image.src.slice(1)))).toString('base64'),
    ]),
  ),
);
const output = path.join(projectRoot, 'pages-output');
const initialSlideCount = JSON.parse(decodeText(fixture.files().get(publishedPath))).content.hero
  .slides.length;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webp': 'image/webp',
};
let deployed;
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith('/boss_ke/')) {
    res.writeHead(404);
    res.end();
    return;
  }
  let name = pathname.slice('/boss_ke/'.length);
  if (deployed && name === 'deploy-info.json') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ releaseId: deployed.id }));
    return;
  }
  if (name.endsWith('/') || !name) name += 'index.html';
  const target = path.resolve(output, name);
  if (!target.startsWith(output + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const data = await fs.readFile(target);
    res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/boss_ke/`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext();
  // 模拟浏览器仍缓存着不带版本号的旧样式，新官网和预览必须避开该地址。
  let staleStyleRequests = 0;
  await context.route(
    (url) => url.pathname.endsWith('/site.css'),
    async (route) => {
      if (!new URL(route.request().url()).searchParams.has('v')) {
        staleStyleRequests++;
        return route.fulfill({ contentType: 'text/css', body: '.gs-slides { position: static; }' });
      }
      return route.continue();
    },
  );
  await context.route('https://api.github.com/**', async (route) => {
    const request = route.request();
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization,content-type,accept',
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
      'content-type': 'application/json',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const result = await fixture.handler(request.url(), {
      method: request.method(),
      body: request.postData(),
    });
    return route.fulfill({
      status: result.status,
      headers: cors,
      body: JSON.stringify(result.body),
    });
  });
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(15000);
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.getByRole('heading', { name: /这封邮件/ }).waitFor();
  assert.equal(
    await page.locator('.gs-slides').evaluate((node) => getComputedStyle(node).position),
    'absolute',
  );
  const stylesheetVersion = await page.locator('link[rel=stylesheet]').getAttribute('href');
  assert.match(stylesheetVersion, /site\.css\?v=[a-f0-9]{12}$/);
  await fs.mkdir(path.join(projectRoot, 'test-results'), { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: path.join(projectRoot, 'test-results/furry-desktop.png'),
    fullPage: true,
  });
  await page.locator('.gs-letter > summary').click();
  assert.ok(await page.locator('.gs-letter').evaluate((node) => node.open));
  await page.locator('.gs-letter > summary').click();
  await page.getByRole('tab', { name: /夜班投递员/ }).click();
  assert.equal(
    await page.getByRole('tab', { name: /夜班投递员/ }).getAttribute('aria-selected'),
    'true',
  );
  await page.keyboard.press('Home');
  assert.equal(
    await page.getByRole('tab', { name: /收件人/ }).getAttribute('aria-selected'),
    'true',
  );
  await page.locator('.gs-update > summary').first().click();
  assert.ok(
    await page
      .locator('.gs-update')
      .first()
      .evaluate((node) => node.open),
  );
  await page.locator('.gs-faq summary').first().click();
  assert.ok(
    await page
      .locator('.gs-faq details')
      .first()
      .evaluate((node) => node.open),
  );
  await page.locator('.gs-system summary').click();
  assert.ok(await page.locator('.gs-system').evaluate((node) => node.open));
  await page.locator('[data-effects-toggle]').click();
  assert.equal(await page.evaluate(() => localStorage.getItem('unknown-mail-effects')), 'off');
  const gallery = page.locator('[data-gallery]');
  const galleryCount = String(await gallery.count()).padStart(2, '0');
  await gallery.first().click();
  const viewer = page.getByRole('dialog', { name: '画面浏览' });
  await viewer.waitFor();
  assert.equal(await viewer.locator('[data-lightbox-count]').innerText(), `01 / ${galleryCount}`);
  await page.keyboard.press('ArrowRight');
  assert.equal(await viewer.locator('[data-lightbox-count]').innerText(), `02 / ${galleryCount}`);
  await viewer.getByRole('button', { name: '上一张大图' }).click();
  assert.equal(await viewer.locator('[data-lightbox-count]').innerText(), `01 / ${galleryCount}`);
  await page.keyboard.press('Escape');
  await viewer.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.body.style.overflow === '');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.ok(await gallery.first().evaluate((button) => document.activeElement === button));
  await page.locator('[data-goto="2"]').click();
  assert.equal(await page.locator('[data-current]').innerText(), '03');
  await page.locator('[data-pause]').click();
  assert.equal(await page.locator('[data-pause]').getAttribute('aria-pressed'), 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-menu]').click();
  assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'), 'true');
  await page.locator('#site-navigation').getByRole('link', { name: '角色', exact: true }).click();
  assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'), 'false');
  await page.locator('[data-goto="0"]').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({
    path: path.join(projectRoot, 'test-results/furry-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await gallery.first().click();
  await viewer.waitFor();
  await viewer.getByRole('button', { name: '下一张大图' }).click();
  assert.equal(await viewer.locator('[data-lightbox-count]').innerText(), `02 / ${galleryCount}`);
  await viewer.getByRole('button', { name: '关闭大图' }).click();
  await viewer.waitFor({ state: 'hidden' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: /内容管理/ }).click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('heading', { name: '授权你的工作台' }).waitFor();
  await page.getByLabel('发布密钥', { exact: true }).fill('fixture-token-not-a-real-key');
  await page.getByRole('button', { name: '进入工作台' }).click();
  await page.waitForFunction(() => !document.querySelector('.login-submit')?.disabled);
  await page.getByRole('heading', { name: '内容概览', exact: true }).waitFor();
  await page.locator('.welcome-art img').evaluate((image) => image.decode());
  await page.screenshot({
    path: path.join(projectRoot, 'test-results/furry-admin.png'),
    fullPage: true,
  });
  assert.ok(
    await page
      .locator('.welcome-art img')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  );
  await page.getByRole('button', { name: '剧情与角色', exact: true }).click();
  await page.getByLabel('来信标题', { exact: true }).fill('请确认你的测试邮件');
  await page.getByLabel('角色名称', { exact: true }).first().fill('测试收件人');
  await page.getByLabel('角色图片', { exact: true }).nth(1).selectOption('/artwork/receiver.webp');
  await page.getByRole('button', { name: '添加玩法介绍', exact: true }).click();
  await page.getByLabel('玩法标题', { exact: true }).last().fill('记忆回溯');
  await page.getByLabel('玩法介绍', { exact: true }).last().fill('新增玩法说明测试');
  await page.getByRole('button', { name: '动态与问答', exact: true }).click();
  await page.getByRole('button', { name: '添加官网动态', exact: true }).click();
  await page.getByLabel('动态日期', { exact: true }).last().fill('2026-11-02');
  await page.getByLabel('动态标题', { exact: true }).last().fill('新版本动态测试');
  await page.getByLabel('动态正文', { exact: true }).last().fill('更新内容测试');
  await page.getByRole('button', { name: '添加常见问题', exact: true }).click();
  await page.getByLabel('问题', { exact: true }).last().fill('测试提问');
  await page.getByLabel('回答', { exact: true }).last().fill('测试回答');
  await page.getByRole('button', { name: '游戏介绍', exact: true }).click();
  await page.getByLabel('游戏名称', { exact: true }).fill('GitHub 在线编辑测试');
  await page.getByLabel('首页主标题', { exact: true }).fill('网页修改，自动发布');
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await page.getByText('草稿已保存，正式官网尚未改变', { exact: true }).waitFor();
  assert.equal(
    JSON.parse(decodeText(fixture.files().get(publishedPath))).content.brand.name,
    '未知的邮件',
  );
  const preview = page.frameLocator('.preview-panel iframe');
  await preview.getByRole('heading', { name: '网页修改，自动发布' }).waitFor();
  await preview.getByRole('heading', { name: '记忆回溯', exact: true }).waitFor();
  await preview.getByRole('tab', { name: /测试收件人/ }).waitFor();
  assert.equal(
    await preview.locator('.gs-slides').evaluate((node) => getComputedStyle(node).position),
    'absolute',
  );
  await page.getByRole('link', { name: '打开已保存草稿预览' }).click();
  await page.frameLocator('iframe').getByRole('heading', { name: '网页修改，自动发布' }).waitFor();
  await page.getByRole('link', { name: '← 返回工作台' }).click();
  await page.getByRole('button', { name: '下载设置', exact: true }).click();
  await page.getByLabel('下载地址').fill('https://example.com/game.zip');
  await page.getByRole('button', { name: '发布官网', exact: true }).click();
  await page.getByText('已提交发布，GitHub 部署完成后官网生效', { exact: true }).waitFor();
  deployed = JSON.parse(decodeText(fixture.files().get(publishedPath)));
  assert.equal(deployed.content.brand.name, 'GitHub 在线编辑测试');
  assert.equal(deployed.content.download.url, 'https://example.com/game.zip');
  assert.equal(deployed.content.extra.characters[0].name, '测试收件人');
  assert.equal(deployed.content.extra.updates.at(-1).title, '新版本动态测试');
  assert.equal(deployed.content.extra.faq.at(-1).answer, '测试回答');
  await page.getByRole('button', { name: '内容概览', exact: true }).click();
  await page.getByText('正式官网已上线', { exact: true }).waitFor({ timeout: 20000 });
  const [zip] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.getByRole('button', { name: /导出静态网站 ZIP/ }).click(),
  ]);
  const { unzipSync } = require('fflate');
  const files = unzipSync(await fs.readFile(await zip.path()));
  assert.ok(files['assets/receiver.webp'], '只用于角色的图片也必须进入 ZIP');
  assert.equal(deployed.content.extra.characters[1].image, '/artwork/receiver.webp');
  assert.ok(new TextDecoder().decode(files['site.css']).includes('.gs-slides'));
  assert.ok(new TextDecoder().decode(files['index.html']).includes('新版本动态测试'));
  await page.getByRole('button', { name: '图片素材', exact: true }).click();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    canvas.getContext('2d').fillRect(0, 0, 50, 50);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({
    name: 'github-test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await page.getByText('图片已添加到素材库', { exact: true }).waitFor();
  await page.getByText('github-test.png', { exact: true }).waitFor();
  await page.getByRole('button', { name: '首页轮播', exact: false }).first().click();
  await page.getByRole('button', { name: '从素材库添加', exact: true }).click();
  await page.getByRole('button', { name: /github-test\.png/ }).click();
  assert.equal(await page.locator('.slide-editor').count(), initialSlideCount + 1);
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await page.getByText('草稿已保存，正式官网尚未改变', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: '内容概览', exact: true }).waitFor();
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('heading', { name: '授权你的工作台' }).waitFor();
  assert.equal(
    await page.evaluate(
      () => Object.keys(sessionStorage).filter((key) => key.startsWith('boss-ke-github:')).length,
    ),
    0,
  );
  assert.deepEqual(errors, []);
  assert.equal(staleStyleRequests, 0, '官网和预览不应请求可能被缓存的无版本样式');
  await fs.mkdir(path.join(projectRoot, 'test-results'), { recursive: true });
  await page.screenshot({
    path: path.join(projectRoot, 'test-results/github-login.png'),
    fullPage: true,
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          '仓库子路径与图片',
          '旧样式缓存隔离与预览资源版本',
          '画廊放大、键盘切换和焦点恢复',
          '缩略图切换与暂停',
          '手机布局和大图浏览',
          '网页授权',
          '剧情来信、角色切换、动态、问答和氛围开关',
          '手机导航展开和关闭',
          '新栏目编辑保存发布',
          '导出包含角色专用图片',
          '草稿隔离',
          '自动发布提交',
          '确认部署已上线',
          '图片上传和轮播编辑',
          '刷新会话保留',
          '退出清除密钥',
        ],
        realRepositoryChanged: false,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
