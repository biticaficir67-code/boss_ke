import { startProduction } from './production.mjs';
import { stopOnSignal } from './lifecycle.mjs';

try { stopOnSignal(await startProduction()); }
catch (error) { console.error(`启动失败：${error.message}`); process.exitCode = 1; }
