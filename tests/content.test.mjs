import fs from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultContent } from '../src/content/default-content.js';
import { validateContent } from '../src/content/validation.js';
import { validateState, imageRepositoryPath } from '../src/github/state.js';
import { renderDocument, renderSite } from '../src/site/render.js';
import { contentImages } from '../src/content/sections.js';

test('当前正式内容和草稿发布指针一致，正式图片均存在', async () => {
  const state = validateState(
    JSON.parse(await fs.readFile(new URL('../site-content/state.json', import.meta.url), 'utf8')),
  );
  const published = JSON.parse(
    await fs.readFile(new URL('../site-content/published.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(state.published, published);
  for (const src of contentImages(published.content))
    await fs.access(new URL(`../${imageRepositoryPath(src)}`, import.meta.url));
});

test('旧版内容缺少扩展栏目时仍能读取，新栏目能完整保存且普通文字被转义', () => {
  const legacy = defaultContent();
  delete legacy.extra;
  const clean = validateContent(legacy);
  assert.deepEqual(clean.extra.characters, []);
  assert.equal(clean.extra.story.enabled, false);
  const extended = defaultContent();
  extended.extra.characters[0].name = '<img src=x onerror=alert(1)>';
  extended.extra.faq[0].answer = '<script>alert(1)</script>';
  const validated = validateContent(extended);
  assert.equal(validated.extra.updates[0].title, extended.extra.updates[0].title);
  const html = renderSite(validated);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!renderSite(clean).includes('id="characters"'));
});

test('扩展栏目拒绝不安全链接、错误日期、无标识条目和路径穿越', () => {
  const invalid = [
    (content) => {
      content.extra.links = [{ id: 'link', label: '社区', url: 'javascript:alert(1)' }];
    },
    (content) => {
      content.extra.characters[0].image = '/../../.env';
    },
    (content) => {
      content.extra.updates[0].date = '2026-02-30';
    },
    (content) => {
      delete content.extra.faq[0].id;
    },
    (content) => {
      content.extra.characters = Array(7).fill(content.extra.characters[0]);
    },
  ];
  for (const mutate of invalid) {
    const content = defaultContent();
    mutate(content);
    assert.throws(() => validateContent(content));
  }
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
  const versioned = renderDocument(content, { assetVersion: 'new-design' });
  assert.ok(versioned.includes('./site.css?v=new-design'));
  assert.ok(versioned.includes("from './site.js?v=new-design'"));
  const versionedPreview = renderDocument(content, {
    preview: true,
    assetBase: '/repo/admin/site-assets/',
    assetVersion: 'new-design',
  });
  assert.ok(versionedPreview.includes('/repo/admin/site-assets/site.css?v=new-design'));
  // ZIP 自带资源，不依赖线上版本参数。
  assert.ok(!published.includes('?v='));
});
