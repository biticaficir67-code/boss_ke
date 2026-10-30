import fs from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultContent } from '../src/content/default-content.js';
import { validateContent } from '../src/content/validation.js';
import { validateState, imageRepositoryPath } from '../src/github/state.js';
import { renderDocument, renderSite } from '../src/site/render.js';

test('当前正式内容和草稿发布指针一致，正式图片均存在', async () => {
  const state = validateState(
    JSON.parse(await fs.readFile(new URL('../site-content/state.json', import.meta.url), 'utf8')),
  );
  const published = JSON.parse(
    await fs.readFile(new URL('../site-content/published.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(state.published, published);
  for (const slide of published.content.hero.slides)
    await fs.access(new URL(`../${imageRepositoryPath(slide.src)}`, import.meta.url));
});

test('内容验证拒绝不合法的下载地址、图片路径和轮播数量', () => {
  for (const url of [
    'http://example.com/game.zip',
    'javascript:alert(1)',
    'https://user:password@example.com/game.zip',
  ]) {
    const content = defaultContent();
    content.download.url = url;
    assert.throws(() => validateContent(content));
  }
  const content = defaultContent();
  content.hero.slides[0].src = '/../../.env';
  assert.throws(() => validateContent(content), /图片地址/);
  content.hero.slides = [];
  assert.throws(() => validateContent(content), /1 至 8/);
});

test('官网保留文字转义，下载按钮由开关和地址决定', () => {
  const content = defaultContent();
  content.hero.title = '<script>unsafe</script>';
  let html = renderSite(content);
  assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  assert.ok(!html.includes('<script>unsafe</script>'));
  assert.ok(html.includes('下载即将开放'));
  content.download.url = 'https://example.com/game.zip';
  content.download.buttonText = '开始冒险';
  html = renderSite(content);
  assert.ok(html.includes('href="https://example.com/game.zip"'));
  assert.ok(html.includes('开始冒险'));
  content.download.enabled = false;
  assert.ok(!renderSite(content).includes('id="download"'));
});

test('公开 HTML 与预览 HTML 使用各自正确的资源地址', () => {
  const content = defaultContent();
  const published = renderDocument(content, { editorHref: './admin/' });
  assert.ok(published.includes('./assets/island.svg'));
  assert.ok(published.includes('href="./admin/"'));
  const preview = renderDocument(content, { preview: true, assetBase: '/preview-assets/' });
  assert.ok(preview.includes('/preview-assets/site.css'));
  assert.ok(preview.includes('noindex,nofollow'));
});
