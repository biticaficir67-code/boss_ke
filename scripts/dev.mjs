import { createApp } from '../server/app.mjs';
import { attachDevelopment } from '../server/development.mjs';
import { readConfig, listen, startupError } from '../server/config.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stopOnSignal } from '../server/lifecycle.mjs';
export { stopOnSignal } from '../server/lifecycle.mjs';

export async function startDevelopment(config = readConfig()) {
  const app = await createApp({ ...config, development: true });
  let vite;
  try {
    vite = await attachDevelopment(app);
    await listen(app.server, config);
  } catch (error) {
    await vite?.close();
    if (app.server.listening) await new Promise(resolve => app.server.close(resolve));
    throw new Error(startupError(error, config));
  }
  console.log(`\n  游戏官网  ${config.base}\n  内容后台  ${config.base}/admin\n  首次访问后台时创建管理员账号。\n`);
  const close = async () => { await vite.close(); await new Promise(resolve => app.server.close(resolve)); };
  return { app, vite, close };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { stopOnSignal(await startDevelopment()); }
  catch (error) { console.error(`启动失败：${error.message}`); process.exitCode = 1; }
}
