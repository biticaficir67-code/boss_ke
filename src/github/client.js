import { GitHubRepository } from './repository.js';
import { asDraft, changeState, publishedPath, imageRepositoryPath } from './state.js';
import { githubConfig, rememberImage, websiteUrl } from '../lib/hosting.js';
import { renderDocument } from '../site/render.js';
import { zipSync, strToU8 } from 'fflate';

const storageKey = `boss-ke-github:${githubConfig.owner}/${githubConfig.repository}`;
let token = '';
try { token = sessionStorage.getItem(storageKey) || ''; } catch { /* 禁用存储时仅在内存保留授权。 */ }
let repository = token ? new GitHubRepository({ ...githubConfig, token }) : null;
let queue = Promise.resolve();
const imageCache = new Map();
async function hydrate(snapshot) {
  await Promise.all(snapshot.state.uploads.map(async image => {
    if (!imageCache.has(image.src)) imageCache.set(image.src, repository.bytes(imageRepositoryPath(image.src), snapshot.sha).then(bytes => rememberImage(image.src, URL.createObjectURL(new Blob([bytes])))).catch(error => { imageCache.delete(image.src); throw error; }));
    await imageCache.get(image.src);
  }));
  return snapshot;
}
async function read() { if (!repository) throw new Error('请先使用发布密钥授权'); return hydrate(await repository.read()); }
async function mutation(action, body, extra = {}) {
  const snapshot = await read();
  const next = changeState(snapshot.state, action, body);
  const files = [...(extra.files || [])];
  if (action === 'publish') files.push({ path: publishedPath, text: `${JSON.stringify(next.published, null, 2)}\n` });
  const sha = await repository.commit(snapshot, next, { files, message: action === 'publish' ? `Publish website: ${next.content.brand.name}` : `Update website ${action}` });
  return { state: next, sha };
}
async function imageRecord(body) {
  if (typeof body.data !== 'string' || !/^[a-zA-Z0-9+/]+={0,2}$/.test(body.data)) throw new Error('图片编码不正确');
  const bytes = Uint8Array.from(atob(body.data), char => char.charCodeAt(0));
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) throw new Error('图片不能超过 3MB');
  let ext;
  if ([137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)) ext = 'png';
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = 'jpg';
  else if (String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') ext = 'webp';
  else throw new Error('仅支持真实的 JPG、PNG、WebP 图片');
  const id = crypto.randomUUID();
  return { id, src: `/uploads/${id}.${ext}`, name: String(body.name || '未命名图片').slice(0,120), bytes: bytes.length, createdAt: new Date().toISOString() };
}
async function handle(url, { method = 'GET', body = {} } = {}) {
  if (url === '/api/auth/status') {
    if (!repository) return { authenticated: false, needsSetup: false, username: '' };
    await repository.read();
    return { authenticated: true, needsSetup: false, username: githubConfig.owner };
  }
  if (url === '/api/auth/login') {
    const candidate = new GitHubRepository({ ...githubConfig, token: String(body.token || '').trim() });
    await candidate.read();
    repository = candidate; token = candidate.token;
    try { sessionStorage.setItem(storageKey, token); } catch { /* 保留本次内存授权。 */ }
    return { authenticated: true, username: githubConfig.owner };
  }
  if (url === '/api/auth/logout') {
    repository = null; token = ''; imageCache.clear();
    try { sessionStorage.removeItem(storageKey); } catch { /* 已清除内存授权。 */ }
    return { ok: true };
  }
  if (!repository) { const error = new Error('请先使用发布密钥授权'); error.status = 401; throw error; }
  if (url === '/api/admin/deployment') {
    try {
      const response = await fetch(new URL(`deploy-info.json?check=${Date.now()}`, websiteUrl), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      return response.ok ? await response.json() : {};
    } catch { return {}; }
  }
  if (url === '/api/admin/draft' && method === 'GET') return asDraft((await read()).state);
  if (url === '/api/admin/draft' && method === 'PUT') return asDraft((await mutation('save', body)).state);
  if (url === '/api/admin/publish' && method === 'POST') {
    const { state, sha } = await mutation('publish', body);
    return { ...asDraft(state), submittedCommit: sha };
  }
  if (url === '/api/admin/uploads' && method === 'GET') return (await read()).state.uploads;
  if (url === '/api/admin/uploads' && method === 'POST') {
    const record = await imageRecord(body);
    await mutation('upload', { record }, { files: [{ path: imageRepositoryPath(record.src), base64: body.data }] });
    rememberImage(record.src, `data:image/${record.src.endsWith('.jpg') ? 'jpeg' : record.src.split('.').pop()};base64,${body.data}`);
    imageCache.set(record.src, Promise.resolve());
    return record;
  }
  if (url.startsWith('/api/admin/uploads/') && method === 'DELETE') {
    const snapshot = await read();
    const id = url.split('/').pop(); const record = snapshot.state.uploads.find(image => image.id === id);
    if (!record) throw new Error('图片不存在');
    const next = changeState(snapshot.state, 'remove', { id });
    await repository.commit(snapshot, next, { message: 'Remove unused website image', files: [{ path: imageRepositoryPath(record.src), remove: true }] });
    imageCache.delete(record.src);
    return { ok: true };
  }
  if (url === '/api/admin/history') return (await read()).state.history.map(release => ({ ...release, name: release.content.brand.name }));
  if (url === '/api/admin/restore') return asDraft((await mutation('restore', body)).state);
  if (url === '/api/admin/export') {
    const snapshot = await read(); const content = snapshot.state.published.content;
    const files = { 'index.html': strToU8(renderDocument(content)) };
    await Promise.all(['site.css','site.js','favicon.svg'].map(async name => {
      const response = await fetch(new URL(`../${name}`, document.baseURI));
      if (!response.ok) throw new Error('静态资源暂时无法导出');
      files[name] = new Uint8Array(await response.arrayBuffer());
    }));
    await Promise.all(content.hero.slides.map(async slide => { files[`assets/${slide.src.split('/').pop()}`] = await repository.bytes(imageRepositoryPath(slide.src), snapshot.sha); }));
    return new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' });
  }
  throw new Error('此操作不适用于 GitHub 托管模式');
}
export function githubRequest(url, options = {}) {
  if (['POST','PUT','DELETE','PATCH'].includes(options.method)) {
    const job = queue.then(() => handle(url, options)); queue = job.catch(() => {}); return job;
  }
  return handle(url, options);
}
