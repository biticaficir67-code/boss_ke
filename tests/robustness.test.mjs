import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createApp } from '../server/app.mjs';
import { Store } from '../server/store.mjs';
import { projectRoot, readConfig, listen, isWithin } from '../server/config.mjs';
import { attachDevelopment } from '../server/development.mjs';
import { exportPublished } from '../server/export.mjs';
import { unzipSync, strFromU8 } from 'fflate';

const testRoot = path.join(projectRoot, 'test-results');
async function temporary() { await fs.mkdir(testRoot, { recursive: true }); return fs.mkdtemp(path.join(testRoot, 'audit-')); }
async function cleanup(dir) { if (isWithin(testRoot, dir) && path.basename(dir).startsWith('audit-')) await fs.rm(dir, { recursive: true, force: true }); }
async function command(args, env = {}, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env: { ...process.env, HOST: '127.0.0.1', PUBLIC_ORIGIN: '', ...env }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => output += chunk); child.stderr.on('data', chunk => output += chunk);
    const timer = setTimeout(() => { child.kill(); reject(new Error(`启动命令未正常退出：${output}`)); }, 15000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve({ code, output }); });
  });
}

test('异常输入、损坏数据和缺失构建不会被误判为普通白屏', async t => {
  const dir = await temporary();
  const app = await createApp({ dataDir: path.join(dir, 'data'), clientDir: path.join(dir, 'missing-build') });
  await listen(app.server, { host: '127.0.0.1', port: 0 });
  const base = `http://127.0.0.1:${app.server.address().port}`;
  let session;
  try {
    await t.test('空对象之外的 JSON 和畸形网址返回 400', async () => {
      for (const body of ['null', '[]', '"text"', 'false', '{broken']) {
        const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        assert.equal(response.status, 400, body);
      }
      assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
      assert.equal((await fetch(`${base}/bad%00path`)).status, 400);
    });
    await t.test('后台未构建时明确提示构建命令', async () => {
      const response = await fetch(`${base}/admin`);
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /npm run build/);
    });
    await t.test('本机加载错误可定位，日志不公开且移除网址参数', async () => {
      const body = JSON.stringify({ kind: 'load-error', page: '/admin?launch=private-value', message: 'Failed to fetch http://127.0.0.1/app-assets/chunk.js?token=private-value' });
      const response = await fetch(`${base}/api/client-error`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body });
      assert.equal(response.status, 200);
      const log = await fs.readFile(path.join(app.store.dir, 'browser-errors.log'), 'utf8');
      assert.match(log, /chunk.js/); assert.ok(!log.includes('private-value'));
      assert.equal((await fetch(`${base}/.data/browser-errors.log`)).status, 404);
      assert.equal((await fetch(`${base}/api/client-error`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://another-site.example' }, body })).status, 403);
      assert.equal((await fetch(`${base}/api/client-error`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'a'.repeat(5000) }) })).status, 413);
    });
    await t.test('内容内部的 null、数组和字段错误不再触发 500', async () => {
      const setup = await fetch(`${base}/api/auth/setup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tester', password: 'only-for-test-1234' }) });
      session = { Cookie: setup.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': (await setup.json()).csrf, 'Content-Type': 'application/json' };
      const draft = await app.store.draft();
      for (const key of ['brand', 'hero', 'about', 'download']) {
        const content = structuredClone(draft.content); content[key] = null;
        const response = await fetch(`${base}/api/admin/draft`, { method: 'PUT', headers: session, body: JSON.stringify({ content, expectedRevision: draft.revision }) });
        assert.equal(response.status, 400, key);
      }
    });
    await t.test('损坏数据有明确提示，原文件不会被覆盖', async () => {
      const filename = path.join(app.store.dir, 'draft.json');
      const previous = await fs.readFile(filename);
      await fs.writeFile(filename, '{invalid');
      const response = await fetch(`${base}/api/admin/draft`, { headers: session });
      assert.equal(response.status, 500); assert.match((await response.json()).error, /draft.json.*损坏/);
      assert.equal(await fs.readFile(filename, 'utf8'), '{invalid');
      await fs.writeFile(filename, previous);
    });
  } finally { await new Promise(resolve => app.server.close(resolve)); await cleanup(dir); }
});

test('开发模式返回正确的图片模块并保护自定义私有目录', async () => {
  const dir = await temporary();
  const app = await createApp({ dataDir: path.join(dir, 'custom-private-data'), development: true });
  let vite;
  try {
    vite = await attachDevelopment(app);
    await listen(app.server, { host: '127.0.0.1', port: 0 });
    const base = `http://127.0.0.1:${app.server.address().port}`;
    // 先由 Vue 模块声明图片依赖，再按浏览器的 script 请求加载。
    await fetch(`${base}/src/views/LoginView.vue`);
    const moduleResponse = await fetch(`${base}/sample-art/island.svg?import`, { headers: { 'Sec-Fetch-Dest': 'script' } });
    assert.equal(moduleResponse.status, 200); assert.match(moduleResponse.headers.get('content-type'), /javascript/); assert.match(await moduleResponse.text(), /export default/);
    const image = await fetch(`${base}/sample-art/island.svg`);
    assert.equal(image.status, 200); assert.match(image.headers.get('content-type'), /image\/svg/);
    const relative = path.relative(projectRoot, path.join(app.store.dir, 'draft.json')).split(path.sep).join('/');
    const absolute = path.join(app.store.dir, 'draft.json').split(path.sep).join('/');
    for (const route of [`/${relative}`, `/@fs/${absolute}?raw`]) {
      const response = await fetch(`${base}${route}`);
      assert.equal(response.status, 403, route); assert.ok(!(await response.text()).includes('schemaVersion'));
    }
  } finally { await vite?.close(); if (app.server.listening) await new Promise(resolve => app.server.close(resolve)); await cleanup(dir); }
});

test('重新导出不残留旧文件，目录和 ZIP 对应同一版本', async () => {
  const dir = await temporary();
  try {
    const store = new Store(path.join(dir, 'data')); await store.init();
    const output = path.join(dir, 'site-output');
    await exportPublished(store, output);
    await fs.writeFile(path.join(output, 'assets/old-file.png'), 'old');
    await fs.writeFile(path.join(output, 'removed-page.html'), 'old page');
    const draft = await store.draft(); draft.content.brand.name = '导出测试';
    await store.publish(draft);
    const result = await exportPublished(store, output);
    await assert.rejects(fs.access(path.join(output, 'assets/old-file.png')));
    await assert.rejects(fs.access(path.join(output, 'removed-page.html')));
    const html = await fs.readFile(path.join(output, 'index.html'), 'utf8');
    const zip = unzipSync(await fs.readFile(result.archive));
    assert.match(html, /导出测试/); assert.equal(strFromU8(zip['index.html']), html);
    // 模拟 ZIP 目标无法被替换：目录应回退到上一份，不能留下混合产物。
    await fs.rename(result.archive, `${result.archive}.backup`);
    await fs.mkdir(result.archive);
    const next = await store.draft(); next.content.brand.name = '不应替换成功的版本'; await store.publish(next);
    await assert.rejects(exportPublished(store, output));
    assert.equal(await fs.readFile(path.join(output, 'index.html'), 'utf8'), html);
    await assert.rejects(exportPublished(store, projectRoot), /不能覆盖|必须是/);
  } finally { await cleanup(dir); }
});

test('启动配置、不同工作目录、重复启动和端口冲突', async t => {
  const dir = await temporary();
  let occupied;
  let app;
  try {
    await t.test('端口和来源配置统一校验并规范化', () => {
      assert.throws(() => readConfig(5173, { PORT: 'abc' }), /PORT/);
      assert.throws(() => readConfig(5173, { PORT: '0' }), /PORT/);
      assert.throws(() => readConfig(5173, { DATA_DIR: 'public/private' }), /DATA_DIR/);
      assert.equal(readConfig(5173, { HOST: '[::1]', PUBLIC_ORIGIN: 'https://example.com/' }).publicOrigin, 'https://example.com');
      assert.equal(readConfig(5173, { HOST: '[::1]' }).base, 'http://[::1]:5173');
      assert.throws(() => readConfig(5173, { PUBLIC_ORIGIN: 'https://example.com/path' }), /PUBLIC_ORIGIN/);
    });
    await t.test('从包含空格的其他目录启动仍能找到项目', async () => {
      const cwd = path.join(dir, 'folder with spaces'); await fs.mkdir(cwd);
      const result = await command([path.join(projectRoot, 'scripts/start.mjs'), '--check'], { DATA_DIR: path.join(dir, 'data'), PORT: '5189' }, cwd);
      assert.equal(result.code, 0, result.output); assert.match(result.output, /检查通过/);
    });
    app = await createApp({ dataDir: path.join(dir, 'data') }); await listen(app.server, { host: '127.0.0.1', port: 0 });
    await t.test('重复启动只复用同一份项目数据', async () => {
      const env = { DATA_DIR: app.store.dir, PORT: String(app.server.address().port) };
      const same = await command([path.join(projectRoot, 'scripts/start.mjs'), '--no-open'], env);
      assert.equal(same.code, 0, same.output); assert.match(same.output, /已在运行/);
      const other = await command([path.join(projectRoot, 'scripts/start.mjs'), '--no-open'], { ...env, DATA_DIR: path.join(dir, 'other-data') });
      assert.equal(other.code, 1, other.output); assert.match(other.output, /其他项目或旧版本/);
      const wrongMode = await command([path.join(projectRoot, 'scripts/start.mjs'), '--no-open', '--dev'], env);
      assert.equal(wrongMode.code, 1, wrongMode.output); assert.match(wrongMode.output, /关闭原启动窗口/);
    });
    occupied = http.createServer((req, res) => res.end('another application'));
    await listen(occupied, { host: '127.0.0.1', port: 0 });
    await t.test('其他程序占用端口时明确报错并正常退出', async () => {
      const result = await command([path.join(projectRoot, 'scripts/start.mjs'), '--no-open'], { DATA_DIR: path.join(dir, 'occupied-data'), PORT: String(occupied.address().port) });
      assert.equal(result.code, 1, result.output); assert.match(result.output, /端口.*占用/);
    });
  } finally {
    if (occupied) await new Promise(resolve => occupied.close(resolve));
    if (app) await new Promise(resolve => app.server.close(resolve));
    await cleanup(dir);
  }
});
