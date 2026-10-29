import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    watch: { ignored: ['**/.data/**', '**/site-output/**', '**/site-output.zip'] },
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.data/**', '**/*.{crt,pem}'] },
  },
  build: { outDir: 'dist', assetsDir: 'app-assets' },
});
