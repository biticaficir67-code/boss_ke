import fs from 'node:fs/promises';
import path from 'node:path';
import { createApp } from './app.mjs';
import { projectRoot, readConfig, listen, startupError } from './config.mjs';

export async function startProduction(config = readConfig(3000)) {
  await fs.access(path.join(projectRoot, 'dist/index.html')).catch(() => {
    throw new Error('管理后台尚未构建，请先在项目目录运行 npm run build，再执行 npm start');
  });
  const app = await createApp(config);
  try { await listen(app.server, config); }
  catch (error) { throw new Error(startupError(error, config)); }
  console.log(`\n游戏官网：${config.base}\n管理后台：${config.base}/admin\n`);
  return { app, close: () => new Promise((resolve, reject) => app.server.close(error => error ? reject(error) : resolve())) };
}
