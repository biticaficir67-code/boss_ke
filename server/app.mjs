import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Store, projectRoot } from './store.mjs';
import { Sessions, passwordHash, verifyPassword } from './auth.mjs';
import { HttpError, validateCredentials } from './validation.mjs';
import { renderDocument } from '../src/site/render.js';
import { instanceId, isWithin, normalizeOrigin } from './config.mjs';
import { clientDiagnostics } from './client-diagnostics.mjs';

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const mutations = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
async function readBody(req, limit = 5 * 1024 * 1024) {
  if (Number(req.headers['content-length']) > limit) { req.resume(); throw new HttpError(413, '请求内容过大'); }
  if (!String(req.headers['content-type']).startsWith('application/json')) throw new HttpError(415, '请求需要使用 JSON 格式');
  const chunks = [];
  let size = 0;
  await new Promise((resolve, reject) => {
    req.on('data', chunk => { size += chunk.length; if (size > limit) { reject(new HttpError(413, '请求内容过大')); } else chunks.push(chunk); });
    req.on('end', resolve);
    req.on('error', reject);
  });
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'JSON 格式不正确'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, '请求内容必须是 JSON 对象');
  return body;
}
async function serveFile(req, res, filename, { cache = false } = {}) {
  let buffer;
  try { buffer = await fs.readFile(filename); }
  catch (error) { if (error.code === 'ENOENT' || error.code === 'EISDIR') throw new HttpError(404, '文件不存在'); throw error; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Content-Length': buffer.length, 'Cache-Control': cache ? 'public, max-age=3600' : 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : buffer);
}
function safeFile(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new HttpError(404, '文件不存在');
  return target;
}

export async function createApp({ dataDir, development = false, clientDir = path.join(projectRoot, 'dist'), publicOrigin = '', allowSetup = true } = {}) {
  publicOrigin = normalizeOrigin(publicOrigin);
  const store = new Store(dataDir);
  await store.init();
  const sessions = new Sessions();
  const failures = new Map();
  const recordClientError = clientDiagnostics(store.dir);
  let frontendMiddleware = null;
  const cookieName = 'boss_ke_session';
  function token(req) { return (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1); }
  function setCookie(res, value, clear = false) { res.setHeader('Set-Cookie', `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 43200}${publicOrigin.startsWith('https://') ? '; Secure' : ''}`); }
  function checkSession(req, { csrf = false } = {}) {
    const session = sessions.get(token(req));
    if (!session) throw new HttpError(401, '登录已过期，请重新登录');
    if (csrf && req.headers['x-csrf-token'] !== session.csrf) throw new HttpError(403, '操作验证失效，请刷新页面后重试');
    return session;
  }
  function checkOrigin(req) {
    const origin = req.headers.origin;
    const allowed = publicOrigin || `http://${req.headers.host}`;
    if (origin && origin !== allowed) throw new HttpError(403, '不允许从其他网站提交操作');
    if (req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, '不允许跨站操作');
  }
  function checkLoginLimit(req) {
    const key = req.socket.remoteAddress;
    const failure = failures.get(key);
    if (failure?.until > Date.now() && failure.count >= 5) throw new HttpError(429, '登录失败次数过多，请 15 分钟后重试');
    if (failure && failure.until <= Date.now()) failures.delete(key);
    return key;
  }
  async function api(req, res, pathname) {
    const method = req.method;
    if (mutations.has(method)) checkOrigin(req);
    if (pathname === '/api/health' && method === 'GET') return json(res, 200, { ok: true, application: 'boss-ke-game-site', instanceId: instanceId(store.dir), mode: development ? 'development' : 'production', ready: !development || !!frontendMiddleware });
    if (pathname === '/api/client-error' && method === 'POST') {
      await recordClientError(req, await readBody(req, 4096));
      return json(res, 200, { ok: true });
    }
    if (pathname === '/api/site' && method === 'GET') {
      const published = await store.read('published.json');
      return json(res, 200, { content: published.content, publishedAt: published.createdAt });
    }
    if (pathname === '/api/auth/status' && method === 'GET') {
      const session = sessions.get(token(req));
      return json(res, 200, { needsSetup: !await store.read('account.json'), setupAllowed: allowSetup, authenticated: !!session, username: session?.username, csrf: session?.csrf });
    }
    if (pathname === '/api/auth/setup' && method === 'POST') {
      if (!allowSetup || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) throw new HttpError(403, '首次创建账号需要在本机使用默认 HOST=127.0.0.1 启动服务');
      // 同时校验 Host，防止本地服务被 DNS rebinding 冒用。
      const hostname = new URL(`http://${req.headers.host}`).hostname;
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(hostname)) throw new HttpError(403, '请通过 localhost 或 127.0.0.1 创建账号');
      const body = await readBody(req);
      validateCredentials(body.username, body.password);
      return store.transaction(async () => {
        if (await store.read('account.json')) throw new HttpError(409, '管理员已创建，请直接登录');
        await store.write('account.json', { username: body.username, ...await passwordHash(body.password), createdAt: new Date().toISOString() });
        const session = sessions.create(body.username);
        setCookie(res, session.token);
        json(res, 201, { username: session.username, csrf: session.csrf });
      });
    }
    if (pathname === '/api/auth/login' && method === 'POST') {
      const key = checkLoginLimit(req);
      const body = await readBody(req);
      const account = await store.read('account.json');
      const validPassword = await verifyPassword(body.password, account);
      if (!account || body.username !== account.username || !validPassword) {
        if (failures.size > 10000) failures.clear();
        const failure = failures.get(key) || { count: 0, until: Date.now() + 900000 };
        failure.count++;
        failures.set(key, failure);
        throw new HttpError(401, '账号或密码不正确');
      }
      failures.delete(key);
      sessions.remove(token(req));
      const session = sessions.create(account.username);
      setCookie(res, session.token);
      return json(res, 200, { username: session.username, csrf: session.csrf });
    }
    if (pathname === '/api/auth/logout' && method === 'POST') {
      checkSession(req, { csrf: true }); sessions.remove(token(req)); setCookie(res, '', true); return json(res, 200, { ok: true });
    }
    if (pathname === '/api/auth/password' && method === 'POST') {
      checkSession(req, { csrf: true });
      const body = await readBody(req);
      return store.transaction(async () => {
        const account = await store.read('account.json');
        if (!await verifyPassword(body.currentPassword, account)) throw new HttpError(400, '当前密码不正确');
        validateCredentials(account.username, body.newPassword);
        await store.write('account.json', { ...account, ...await passwordHash(body.newPassword) });
        sessions.clear(); setCookie(res, '', true); json(res, 200, { ok: true });
      });
    }
    if (pathname.startsWith('/api/admin/')) {
      checkSession(req, { csrf: mutations.has(method) });
      if (pathname === '/api/admin/draft' && method === 'GET') return json(res, 200, await store.draft());
      if (pathname === '/api/admin/draft' && method === 'PUT') { const body = await readBody(req); return store.transaction(async () => json(res, 200, await store.save(body.content, body.expectedRevision))); }
      if (pathname === '/api/admin/publish' && method === 'POST') {
        const body = await readBody(req);
        return store.transaction(async () => {
          const draft = await store.assertRevision(body.expectedRevision);
          await store.publish(draft);
          json(res, 200, await store.draft());
        });
      }
      if (pathname === '/api/admin/uploads' && method === 'GET') return json(res, 200, await store.read('uploads.json') || []);
      if (pathname === '/api/admin/uploads' && method === 'POST') { const body = await readBody(req); return store.transaction(async () => json(res, 201, await store.upload(body))); }
      if (pathname.startsWith('/api/admin/uploads/') && method === 'DELETE') { const id = pathname.split('/').pop(); return store.transaction(async () => { await store.removeUpload(id); json(res, 200, { ok: true }); }); }
      if (pathname === '/api/admin/history' && method === 'GET') return json(res, 200, await store.history());
      if (pathname === '/api/admin/restore' && method === 'POST') { const body = await readBody(req); return store.transaction(async () => json(res, 200, await store.restore(body.id, body.expectedRevision))); }
      if (pathname === '/api/admin/source' && method === 'GET') { const draft = await store.read('draft.json'); return json(res, 200, { html: renderDocument(draft.content) }); }
      if (pathname === '/api/admin/export' && method === 'GET') {
        const archive = await store.zip();
        res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="game-website.zip"', 'Content-Length': archive.length, 'Cache-Control': 'no-store' });
        return res.end(archive);
      }
    }
    throw new HttpError(404, '接口不存在');
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    try {
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
      catch { throw new HttpError(400, '网址包含无效的编码，请检查访问地址'); }
      if (pathname.includes('\0')) throw new HttpError(400, '网址格式不正确');
      if (pathname.startsWith('/api/')) return await api(req, res, pathname);
      if (!['GET', 'HEAD'].includes(req.method)) throw new HttpError(405, '不支持该请求方式');
      if (pathname.startsWith('/site-assets/')) {
        const assets = { '/site-assets/site.css': 'site.css', '/site-assets/site.js': 'runtime.js' };
        if (!assets[pathname]) throw new HttpError(404, '文件不存在');
        return await serveFile(req, res, path.join(projectRoot, 'src/site', assets[pathname]));
      }
      if (pathname.startsWith('/uploads/')) {
        if (!/^\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(pathname)) throw new HttpError(404, '文件不存在');
        return await serveFile(req, res, store.imagePath(pathname), { cache: true });
      }
      // 开发模式下 ?import 图片请求需要由 Vite 转成 JS 模块，不能直接返回图片。
      if (pathname.startsWith('/sample-art/') && !development) return await serveFile(req, res, store.imagePath(pathname), { cache: true });
      if (development && frontendMiddleware) {
        const candidates = [path.resolve(projectRoot, `.${pathname}`), path.resolve(projectRoot, 'public', `.${pathname}`)];
        if (pathname.startsWith('/@fs/')) candidates.push(path.resolve(pathname.slice(5)));
        if (candidates.some(candidate => isWithin(store.dir, candidate))) throw new HttpError(403, '私有数据不能通过网页访问');
        return frontendMiddleware(req, res, () => { if (!res.writableEnded) json(res, 404, { error: '页面不存在' }); });
      }
      if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/preview') {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        await fs.access(path.join(clientDir, 'index.html')).catch(() => { throw new HttpError(503, '管理后台尚未构建，请在项目目录执行 npm run build，然后重新启动'); });
        return await serveFile(req, res, path.join(clientDir, 'index.html'));
      }
      if (pathname.startsWith('/app-assets/')) return await serveFile(req, res, safeFile(clientDir, pathname.slice(1)), { cache: true });
      const published = await store.read('published.json');
      const publicDir = path.join(store.releasePath(published.id), 'site');
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!['index.html', 'site.css', 'site.js', 'favicon.svg'].includes(relative) && !/^assets\/[\w.-]+$/.test(relative)) throw new HttpError(404, '页面不存在');
      return await serveFile(req, res, safeFile(publicDir, relative));
    } catch (error) {
      if (res.writableEnded) return;
      if (!error.status) console.error('[server]', error.message);
      json(res, error.status || 500, { error: error.status ? error.message : '服务暂时无法完成操作，请稍后重试' });
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  return { server, store, setFrontendMiddleware(value) { frontendMiddleware = value; } };
}
