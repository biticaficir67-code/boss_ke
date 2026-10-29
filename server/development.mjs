import { createServer, normalizePath } from 'vite';
import { projectRoot } from './config.mjs';

export async function attachDevelopment(app) {
  const privateDirectory = normalizePath(app.store.dir);
  const escapedDirectory = privateDirectory.replace(/([*?\[\]{}()!+])/g, '\\$1');
  const vite = await createServer({
    root: projectRoot,
    server: {
      middlewareMode: true,
      hmr: { server: app.server },
      watch: { ignored: [`${escapedDirectory}/**`] },
      fs: { deny: [`${escapedDirectory}/**`] },
    },
    appType: 'spa',
  });
  app.setFrontendMiddleware(vite.middlewares);
  return vite;
}
