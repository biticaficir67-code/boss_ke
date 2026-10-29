import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function isWithin(directory, target) {
  const relative = path.relative(path.resolve(directory), path.resolve(target));
  return relative === '' || !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}
export function normalizeOrigin(value = '') {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('PUBLIC_ORIGIN 需要填写完整的 http:// 或 https:// 地址'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('PUBLIC_ORIGIN 只填写网站来源，例如 https://game.example，不要包含路径、参数或账号密码');
  return url.origin;
}
export function readConfig(defaultPort = 5173, env = process.env) {
  const rawHost = String(env.HOST || '127.0.0.1').trim();
  const host = rawHost.replace(/^\[([^\]]+)\]$/, '$1');
  if (!net.isIP(host) && !/^(?=.{1,253}$)[a-z\d](?:[a-z\d.-]*[a-z\d])?$/i.test(host)) throw new Error('HOST 格式不正确，本地使用请填写 127.0.0.1 或 localhost');
  const port = Number(env.PORT || defaultPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是 1 至 65535 之间的整数');
  const dataDir = path.resolve(projectRoot, env.DATA_DIR || '.data');
  if (isWithin(dataDir, projectRoot) || ['public', 'dist', 'pages-output', 'site-content', 'site-output', 'src'].some(name => isWithin(path.join(projectRoot, name), dataDir))) throw new Error('DATA_DIR 不能是项目根目录、其上级目录或网页公开目录，请使用 .data 或独立的私有目录');
  const browserHost = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '[::1]' : host.includes(':') ? `[${host}]` : host;
  return { host, port, dataDir, publicOrigin: normalizeOrigin(env.PUBLIC_ORIGIN), allowSetup: ['127.0.0.1', 'localhost', '::1'].includes(host), base: `http://${browserHost}:${port}` };
}
export const instanceId = dataDir => createHash('sha256').update(`${projectRoot}\n${path.resolve(dataDir)}`).digest('hex').slice(0, 20);
export function listen(server, { host, port }) {
  return new Promise((resolve, reject) => {
    const fail = error => { server.off('listening', ready); reject(error); };
    const ready = () => { server.off('error', fail); resolve(); };
    server.once('error', fail); server.once('listening', ready); server.listen(port, host);
  });
}
export function startupError(error, config) {
  if (error.code === 'EADDRINUSE') return `端口 ${config.port} 已被占用。请关闭原启动窗口，或在 .env 中修改 PORT；不会自动结束其他程序。`;
  if (error.code === 'EACCES') return `无法监听 ${config.host}:${config.port}，请检查端口是否被系统保留，或修改 PORT。`;
  if (error.code === 'ENOTFOUND' || error.code === 'EADDRNOTAVAIL') return `HOST=${config.host} 无法在本机使用，请改成 127.0.0.1。`;
  return error.message;
}
