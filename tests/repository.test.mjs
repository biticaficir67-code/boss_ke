import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubRepository, encodeText, decodeText } from '../src/github/repository.js';

function repository(fetcher) {
  return new GitHubRepository({
    owner: 'example',
    repository: 'game',
    token: 'fixture-only',
    fetcher,
  });
}

test('中文内容能经过 GitHub Base64 编码还原', () => {
  const text = '你好，游戏世界！\nA new adventure 🎮';
  assert.equal(decodeText(encodeText(text)), text);
});

test('连接失败、超时和无效响应返回可读错误', async (t) => {
  await t.test('网络断开', async () => {
    const repo = repository(async () => {
      throw new TypeError('Failed to fetch');
    });
    await assert.rejects(repo.api('/git/ref/heads/main'), /无法连接 GitHub/);
  });
  await t.test('超时结束等待', async () => {
    const repo = repository(
      (_, options) =>
        new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    await assert.rejects(repo.api('/git/ref/heads/main', { timeoutMs: 25 }), /连接 GitHub 超时/);
  });
  await t.test('不是 JSON 的响应', async () => {
    const repo = repository(async () => new Response('<html>bad gateway</html>', { status: 502 }));
    await assert.rejects(repo.api('/git/ref/heads/main'), /无法识别的内容/);
  });
});

test('GitHub 拒绝授权或提交时保留错误状态', async () => {
  for (const status of [401, 403, 404, 409, 422]) {
    const repo = repository(async () => Response.json({ message: 'fixture error' }, { status }));
    await assert.rejects(repo.api('/git/ref/heads/main'), (error) => error.status === status);
  }
});
