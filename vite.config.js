import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite 只构建管理后台；公开官网由 build-pages.mjs 生成。
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'pages-output/admin',
    assetsDir: 'app-assets',
    emptyOutDir: true,
  },
});
