import fs from 'node:fs/promises';
import path from 'node:path';

// 只由本机浏览器写入，不记录表单、密码、Cookie 或网址参数。
export function clientDiagnostics(dataDir) {
  let started = Date.now();
  let count = 0;
  let pending = Promise.resolve();
  const filename = path.join(dataDir, 'browser-errors.log');
  const clean = value => String(value || '').replace(/https?:\/\/[^\s)]+/g, value => {
    try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return '[url]'; }
  }).slice(0, 500);
  return async (req, body) => {
    const hostname = new URL(`http://${req.headers.host}`).hostname;
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) || !['127.0.0.1', 'localhost', '[::1]'].includes(hostname)) return;
    if (Date.now() - started > 60000) { started = Date.now(); count = 0; }
    if (++count > 30) return;
    const entry = JSON.stringify({ at: new Date().toISOString(), kind: clean(body.kind), page: clean(body.page).split(/[?#]/)[0], message: clean(body.message) });
    pending = pending.catch(() => {}).then(async () => {
      const stat = await fs.stat(filename).catch(() => null);
      if (stat?.size > 256 * 1024) await fs.writeFile(filename, '');
      await fs.appendFile(filename, `${entry}\n`);
    });
    await pending;
  };
}
