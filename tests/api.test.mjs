import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../src/lib/api.js';

test('前端请求在断网、超时和无效响应时返回可读错误', async t => {
  const original = globalThis.fetch;
  try {
    await t.test('连接失败不会暴露难懂的浏览器错误', async () => {
      globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
      await assert.rejects(request('/api/site'), /无法连接网站服务/);
    });
    await t.test('超时会结束等待，不会一直加载', async () => {
      globalThis.fetch = (_, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
      await assert.rejects(request('/api/site', { timeoutMs: 25 }), /请求超时/);
    });
    await t.test('无效 JSON 会给出明确说明', async () => {
      globalThis.fetch = async () => new Response('<html>wrong response</html>');
      await assert.rejects(request('/api/site'), /内容格式不正确/);
    });
    await t.test('服务端校验错误保留状态和信息', async () => {
      globalThis.fetch = async () => new Response(JSON.stringify({ error: '请填写游戏名称' }), { status: 400 });
      await assert.rejects(request('/api/admin/draft'), error => error.status === 400 && error.message === '请填写游戏名称');
    });
  } finally { globalThis.fetch = original; }
});
