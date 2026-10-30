import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
process.chdir(root);

async function installDependencies() {
  console.log('首次运行，正在安装项目依赖…');
  const child =
    process.platform === 'win32'
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm install'], {
          cwd: root,
          stdio: 'inherit',
          windowsHide: true,
        })
      : spawn('npm', ['install'], { cwd: root, stdio: 'inherit' });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (code !== 0) throw new Error('依赖安装失败，请检查网络后重试');
}

try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error('请安装 Node.js 22.12 或更高版本');
  const dependencies = ['vue', 'vue-router', 'vite', '@vitejs/plugin-vue', 'fflate'];
  const available = await Promise.all(
    dependencies.map((name) =>
      fs.access(path.join(root, 'node_modules', name, 'package.json')).then(
        () => true,
        () => false,
      ),
    ),
  );
  if (available.includes(false)) await installDependencies();

  console.log('正在生成官网和管理后台…');
  await import('./build-pages.mjs');
  const { preview } = await import('vite');
  const port = Number(process.env.PORT || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT 需要是 1–65535 之间的整数');
  const server = await preview({
    configFile: false,
    root,
    appType: 'mpa',
    build: { outDir: 'pages-output' },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      open: process.argv.includes('--no-open') ? false : '/admin/',
    },
  });
  console.log(`官网预览：http://127.0.0.1:${port}/\n管理后台：http://127.0.0.1:${port}/admin/`);
  console.log('本地只提供静态预览。使用真实密钥登录后，保存与发布仍会修改 GitHub 仓库。');
  console.log('保留此窗口，按 Ctrl+C 停止预览。');
  let closing = false;
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, async () => {
      if (closing) return;
      closing = true;
      await server.close();
      process.exit(0);
    });
} catch (error) {
  console.error(`启动失败：${error.message}`);
  process.exitCode = 1;
}
