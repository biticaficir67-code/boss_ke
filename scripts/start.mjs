import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { appendFileSync, mkdirSync } from 'node:fs';
import { readConfig, instanceId } from '../server/config.mjs';
import { stopOnSignal } from '../server/lifecycle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const noOpen = args.has('--no-open') || checkOnly;
const development = args.has('--dev');
const mode = development ? 'development' : 'production';
let service;
function log(message) {
  try { mkdirSync(path.join(root, '.data'), { recursive: true }); appendFileSync(path.join(root, '.data/launcher.log'), `${new Date().toISOString()} ${message}\n`); }
  catch { /* 日志失败不阻止启动；终端仍显示错误。 */ }
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const browserArgs = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const child = spawn(command, browserArgs, { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => console.log(`无法自动打开浏览器，请手动访问：${url}`));
  child.unref();
}

async function install() {
  console.log('首次启动，正在安装项目依赖；这一步需要联网，请稍候…');
  const child = process.platform === 'win32'
    ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm install'], { cwd: root, stdio: 'inherit', windowsHide: true })
    : spawn('npm', ['install'], { cwd: root, stdio: 'inherit' });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error('依赖安装失败，请检查网络后重试，或在 IDEA 终端运行 npm install。');
}

async function buildFrontend() {
  console.log('正在生成可直接使用的页面，请稍候…');
  const child = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: root, stdio: 'inherit', windowsHide: true });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error('页面构建失败，请查看上方错误；网站尚未启动。');
}

try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || major === 22 && minor < 12) throw new Error(`当前 Node.js 为 ${process.versions.node}，请安装 22.12 或更高版本。`);
  try { process.loadEnvFile(path.join(root, '.env')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error(`无法读取 .env：${error.message}`); }

  const missing = [];
  for (const dependency of ['vue', 'vue-router', 'vite', '@vitejs/plugin-vue', 'fflate']) {
    try { await fs.access(path.join(root, 'node_modules', dependency, 'package.json')); }
    catch { missing.push(dependency); }
  }
  if (missing.length) {
    if (checkOnly) throw new Error('项目依赖尚未安装，直接双击 start.bat 即可自动安装。');
    await install();
  }

  const config = readConfig();
  const { base } = config;
  if (checkOnly) {
    console.log(`启动环境检查通过：Node.js ${process.versions.node}，项目依赖已就绪。\n官网：${base}\n后台：${base}/admin`);
  } else {
    let running;
    let responding = false;
    try {
      const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1500) });
      responding = true;
      const result = await response.json();
      if (response.ok) running = result;
    } catch { /* 未启动时正常进入启动流程，端口冲突由服务提供明确提示。 */ }
    if (running?.application === 'boss-ke-game-site') {
      if (running.instanceId !== instanceId(config.dataDir)) throw new Error(`端口 ${config.port} 正在运行其他项目或旧版本。请关闭原启动窗口后再试，或修改 PORT。`);
      if (running.mode !== mode) throw new Error(`端口 ${config.port} 上仍是${running.mode === 'development' ? '开发' : '构建'}模式。请关闭原启动窗口后重新双击 start.bat；需要开发模式时运行 start.bat --dev。`);
      if (!running.ready) throw new Error('原服务尚未准备好，请稍候再试；如持续失败，请关闭原窗口重新启动');
      console.log(`网站已在运行，直接打开即可。\n官网：${base}\n后台：${base}/admin`);
      log(`reuse ${base} mode=${mode}`);
    } else {
      if (responding) throw new Error(`端口 ${config.port} 已被其他程序占用。请关闭原启动窗口，或在 .env 中修改 PORT。`);
      console.log('\n正在启动游戏官网和内容工作台…');
      log(`start node=${process.versions.node} ${base} mode=${mode}`);
      if (development) {
        const { startDevelopment } = await import('./dev.mjs');
        service = await startDevelopment(config);
      } else {
        await buildFrontend();
        const { startProduction } = await import('../server/production.mjs');
        service = await startProduction(config);
      }
      const health = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (!health.ok || !(await health.json()).ready) throw new Error('服务已监听端口，但健康检查未通过，请查看启动窗口错误');
      stopOnSignal(service);
      console.log('启动成功。请保留此窗口，按 Ctrl+C 可停止服务。\n');
      log(`ready ${base} mode=${mode}`);
    }
    if (!noOpen) openBrowser(`${base}/admin?launch=${Date.now()}`);
  }
} catch (error) {
  await service?.close().catch(() => {});
  log(`failed ${error.message}`);
  console.error(`\n启动失败：${error.message}\n`);
  console.error('错误记录：.data/launcher.log');
  process.exitCode = 1;
}
