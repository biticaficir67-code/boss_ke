import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createApp } from '../server/app.mjs';
import { attachDevelopment } from '../server/development.mjs';
import { projectRoot, isWithin, listen } from '../server/config.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.join(projectRoot, 'test-results');
await fs.mkdir(root, { recursive: true });
const dir = await fs.mkdtemp(path.join(root, 'browser-audit-'));
const app = await createApp({ dataDir: path.join(dir, 'data'), development: true });
const vite = await attachDevelopment(app);
await listen(app.server, { host: '127.0.0.1', port: 0 });
const base = `http://127.0.0.1:${app.server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: process.argv.includes('--edge') ? 'msedge' : 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**/src/main.js', route => route.abort());
  const errorReport = page.waitForResponse(response => response.url().endsWith('/api/client-error') && response.ok());
  await page.goto(base);
  await page.getByRole('heading', { name: '页面没有加载成功' }).waitFor();
  assert.ok(await page.getByRole('button', { name: '刷新页面', exact: true }).isVisible());
  await page.getByText('无法加载脚本：/src/main.js', { exact: true }).waitFor();
  // 浏览器真实上报后，本地记录应能定位被阻断的资源。
  await errorReport;
  assert.match(await fs.readFile(path.join(app.store.dir, 'browser-errors.log'), 'utf8'), /main.js/);
  await page.unroute('**/src/main.js');
  await page.reload(); await page.getByRole('heading', { name: /越过雾海/ }).waitFor();

  await page.route('**/src/views/LoginView.vue', route => route.abort());
  await page.reload(); await page.getByRole('heading', { name: /越过雾海/ }).waitFor();
  await page.goto(`${base}/admin`);
  await page.getByRole('heading', { name: '页面没有加载成功' }).waitFor();
  await page.unroute('**/src/views/LoginView.vue');
  await page.reload(); await page.getByRole('heading', { name: '创建你的工作台' }).waitFor();

  await page.route('**/api/site', route => route.abort());
  await page.goto(base); await page.getByRole('heading', { name: '暂时无法加载官网' }).waitFor();
  await page.getByText(/无法连接网站服务/).waitFor();
  await page.unroute('**/api/site');
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await page.getByRole('heading', { name: /越过雾海/ }).waitFor();
  await page.route('**/api/simulate-stalled', () => {});
  const message = await page.evaluate(async () => {
    const { request } = await import('/src/lib/api.js');
    try { await request('/api/simulate-stalled', { timeoutMs: 100 }); } catch (error) { return error.message; }
  });
  assert.match(message, /请求超时/);
  console.log(JSON.stringify({ ok: true, browser: process.argv.includes('--edge') ? 'Edge' : 'Chrome', checks: ['入口脚本失败时显示可恢复提示', '后台模块失败不拖垮官网', '后台模块失败后能重新加载', '接口断连有明确提示并能恢复', '浏览器请求超时会停止等待'] }, null, 2));
} finally {
  await browser?.close(); await vite.close(); await new Promise(resolve => app.server.close(resolve));
  if (isWithin(root, dir) && path.basename(dir).startsWith('browser-audit-')) await fs.rm(dir, { recursive: true, force: true });
}
