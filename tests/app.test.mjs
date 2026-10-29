import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { createApp } from '../server/app.mjs';
import { projectRoot } from '../server/store.mjs';

test('管理员、草稿、发布、上传和静态导出的完整流程', async (t) => {
  const testRoot = path.join(projectRoot, '.data', 'test-runs');
  await fs.mkdir(testRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(testRoot, 'boss-ke-test-'));
  let app = await createApp({ dataDir: directory });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  let base = `http://127.0.0.1:${app.server.address().port}`;
  let cookie = '';
  let csrf = '';
  async function call(route, { method = 'GET', body, authenticated = true, headers = {} } = {}) {
    const response = await fetch(`${base}${route}`, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(authenticated && cookie ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const type = response.headers.get('content-type') || '';
    const data = type.includes('json') ? await response.json() : type.includes('zip') ? Buffer.from(await response.arrayBuffer()) : await response.text();
    return { response, data };
  }
  try {
    await t.test('首次初始化、后台权限和密码哈希', async () => {
      assert.equal((await call('/api/admin/draft', { authenticated: false })).response.status, 401);
      assert.equal((await call('/api/auth/status')).data.needsSetup, true);
      const setup = await call('/api/auth/setup', { method: 'POST', body: { username: 'admin', password: 'only-for-testing-123' } });
      assert.equal(setup.response.status, 201);
      cookie = setup.response.headers.get('set-cookie').split(';')[0]; csrf = setup.data.csrf;
      const account = await fs.readFile(path.join(directory, 'account.json'), 'utf8');
      assert.ok(!account.includes('only-for-testing-123'));
      assert.equal((await call('/api/auth/setup', { method: 'POST', body: { username: 'other', password: 'only-for-testing-123' } })).response.status, 409);
      assert.equal((await call('/api/admin/draft', { method: 'PUT', body: {}, headers: { 'X-CSRF-Token': '' } })).response.status, 403);
      assert.equal((await call('/api/admin/draft', { method: 'PUT', body: {}, headers: { Origin: 'https://attacker.example' } })).response.status, 403);
    });
    let draft;
    const changedTitle = '新的世界 <script>alert(1)</script>';
    await t.test('草稿隔离、转义、参数检查和冲突保护', async () => {
      draft = (await call('/api/admin/draft')).data;
      draft.content.hero.title = changedTitle;
      const result = await call('/api/admin/draft', { method: 'PUT', body: { content: draft.content, expectedRevision: draft.revision } });
      assert.equal(result.response.status, 200); assert.equal(result.data.dirty, true);
      assert.notEqual((await call('/api/site')).data.content.hero.title, changedTitle);
      assert.equal((await call('/api/admin/draft', { method: 'PUT', body: { content: draft.content, expectedRevision: draft.revision } })).response.status, 409);
      draft = result.data;
      const invalid = structuredClone(draft.content); invalid.download.url = 'javascript:alert(1)';
      assert.equal((await call('/api/admin/draft', { method: 'PUT', body: { content: invalid, expectedRevision: draft.revision } })).response.status, 400);
      const invalidImage = structuredClone(draft.content); invalidImage.hero.slides[0].src = '/uploads/../../account.json';
      assert.equal((await call('/api/admin/draft', { method: 'PUT', body: { content: invalidImage, expectedRevision: draft.revision } })).response.status, 400);
      const source = (await call('/api/admin/source')).data.html;
      assert.ok(source.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
      assert.ok(!source.includes('<script>alert(1)</script>'));
    });
    await t.test('生成真正的静态网页及完整 ZIP', async () => {
      const result = await call('/api/admin/publish', { method: 'POST', body: { expectedRevision: draft.revision } });
      assert.equal(result.response.status, 200); assert.equal(result.data.dirty, false);
      assert.equal((await call('/api/site')).data.content.hero.title, changedTitle);
      const page = (await call('/')).data;
      assert.ok(page.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
      assert.ok(!page.includes('/api/site'));
      const archive = await call('/api/admin/export'); assert.equal(archive.response.status, 200);
      const files = unzipSync(archive.data);
      for (const name of ['index.html', 'site.css', 'site.js', 'favicon.svg', 'assets/island.svg', 'assets/forest.svg', 'assets/journey.svg']) assert.ok(files[name], `ZIP 缺少 ${name}`);
      assert.ok(strFromU8(files['index.html']).includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
      assert.ok(!Object.keys(files).some(name => /account|draft|server|\.env/.test(name)));
    });
    let upload;
    await t.test('图片上传、非法文件拒绝与引用保护', async () => {
      const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=';
      assert.equal((await call('/api/admin/uploads', { method: 'POST', body: { name: 'bad.svg', data: Buffer.from('<svg onload="alert(1)"></svg>').toString('base64') } })).response.status, 400);
      const result = await call('/api/admin/uploads', { method: 'POST', body: { name: 'pixel.png', data: png } });
      assert.equal(result.response.status, 201); upload = result.data;
      assert.equal((await fetch(`${base}${upload.src}`)).status, 200);
      draft = (await call('/api/admin/draft')).data;
      draft.content.hero.slides.push({ id: 'test-image', src: upload.src, alt: '测试图片', caption: '测试角标' });
      draft = (await call('/api/admin/draft', { method: 'PUT', body: { content: draft.content, expectedRevision: draft.revision } })).data;
      assert.equal((await call(`/api/admin/uploads/${upload.id}`, { method: 'DELETE' })).response.status, 409);
      assert.equal((await call('/api/admin/publish', { method: 'POST', body: { expectedRevision: draft.revision } })).response.status, 200);
      const files = unzipSync((await call('/api/admin/export')).data);
      assert.ok(files[`assets/${upload.src.split('/').pop()}`]);
    });
    await t.test('历史恢复只修改草稿，重启不丢失已发布内容', async () => {
      const releases = (await call('/api/admin/history')).data;
      assert.ok(releases.length >= 3);
      draft = (await call('/api/admin/draft')).data;
      const result = await call('/api/admin/restore', { method: 'POST', body: { id: releases.at(-1).id, expectedRevision: draft.revision } });
      assert.equal(result.response.status, 200); assert.equal(result.data.dirty, true);
      assert.notEqual(result.data.content.hero.title, changedTitle);
      assert.equal((await call('/api/site')).data.content.hero.title, changedTitle);
      await new Promise(resolve => app.server.close(resolve));
      app = await createApp({ dataDir: directory });
      await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
      base = `http://127.0.0.1:${app.server.address().port}`;
      assert.equal((await call('/api/auth/status')).data.authenticated, false);
      assert.equal((await call('/api/site')).data.content.hero.title, changedTitle);
      const login = await call('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'only-for-testing-123' } });
      assert.equal(login.response.status, 200); cookie = login.response.headers.get('set-cookie').split(';')[0]; csrf = login.data.csrf;
      assert.equal((await call('/api/admin/draft')).data.dirty, true);
    });
    await t.test('删除旧素材后仍能从历史快照恢复图片', async () => {
      const releaseWithImage = await app.store.read('published.json');
      draft = (await call('/api/admin/draft')).data;
      assert.equal((await call('/api/admin/publish', { method: 'POST', body: { expectedRevision: draft.revision } })).response.status, 200);
      assert.equal((await call(`/api/admin/uploads/${upload.id}`, { method: 'DELETE' })).response.status, 200);
      assert.equal((await fetch(`${base}${upload.src}`)).status, 404);
      const restored = await call('/api/admin/restore', { method: 'POST', body: { id: releaseWithImage.id, expectedRevision: draft.revision } });
      assert.equal(restored.response.status, 200);
      assert.ok(restored.data.content.hero.slides.some(slide => slide.src === upload.src));
      assert.equal((await fetch(`${base}${upload.src}`)).status, 200);
      assert.ok((await call('/api/admin/uploads')).data.some(image => image.src === upload.src));
    });
    await t.test('修改密码和登出会撤销会话', async () => {
      assert.equal((await call('/api/auth/password', { method: 'POST', body: { currentPassword: 'wrong', newPassword: 'new-testing-password' } })).response.status, 400);
      assert.equal((await call('/api/auth/password', { method: 'POST', body: { currentPassword: 'only-for-testing-123', newPassword: 'new-testing-password' } })).response.status, 200);
      assert.equal((await call('/api/admin/draft')).response.status, 401);
      assert.equal((await call('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'only-for-testing-123' } })).response.status, 401);
      const login = await call('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'new-testing-password' } });
      assert.equal(login.response.status, 200); cookie = login.response.headers.get('set-cookie').split(';')[0]; csrf = login.data.csrf;
      assert.equal((await call('/api/auth/logout', { method: 'POST', body: {} })).response.status, 200);
      assert.equal((await call('/api/admin/draft')).response.status, 401);
    });
  } finally {
    await new Promise(resolve => app.server.close(resolve));
    const absolute = path.resolve(directory);
    if (absolute.startsWith(`${path.resolve(testRoot)}${path.sep}boss-ke-test-`)) await fs.rm(absolute, { recursive: true, force: true });
  }
});
