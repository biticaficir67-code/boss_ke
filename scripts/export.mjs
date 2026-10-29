import { Store } from '../server/store.mjs';
import { readConfig } from '../server/config.mjs';
import { exportPublished } from '../server/export.mjs';
try {
  const store = new Store(readConfig().dataDir);
  await store.init();
  const result = await exportPublished(store);
  console.log(`已导出已发布官网：${result.output}\nZIP：${result.archive}\n可将 ZIP 解压后上传到静态托管平台。`);
} catch (error) { console.error(`导出失败：${error.message}`); process.exitCode = 1; }
