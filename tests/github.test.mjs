import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubRepository, decodeText } from '../src/github/repository.js';
import {
  changeState,
  asDraft,
  imageRepositoryPath,
  statePath,
  publishedPath,
} from '../src/github/state.js';
import { githubFixture } from './helpers/github-fixture.mjs';

test('GitHub 草稿与正式发布隔离，并发提交不能覆盖其他修改', async () => {
  const fixture = githubFixture();
  const repo = new GitHubRepository({
    owner: 'biticaficir67-code',
    repository: 'boss_ke',
    token: 'fixture-only',
    fetcher: fixture.fetcher,
  });
  const first = await repo.read();
  const concurrent = await repo.read();
  const content = structuredClone(first.state.content);
  content.brand.name = '测试新游戏';
  const draft = changeState(first.state, 'save', { content, expectedRevision: 1 });
  await repo.commit(first, draft);
  assert.equal((await repo.read()).state.content.brand.name, '测试新游戏');
  assert.equal(
    JSON.parse(decodeText(fixture.files().get(publishedPath))).content.brand.name,
    '雾海来信',
  );
  await assert.rejects(repo.commit(concurrent, concurrent.state), (error) => error.status === 422);
  assert.equal((await repo.read()).state.content.brand.name, '测试新游戏');
  const current = await repo.read();
  assert.throws(
    () => changeState(current.state, 'publish', { expectedRevision: 1 }),
    (error) => error.status === 409,
  );
  const published = changeState(current.state, 'publish', { expectedRevision: 2 });
  await repo.commit(current, published, {
    files: [{ path: publishedPath, text: JSON.stringify(published.published) }],
  });
  assert.equal(asDraft((await repo.read()).state).dirty, false);
  assert.equal(
    JSON.parse(decodeText(fixture.files().get(publishedPath))).content.brand.name,
    '测试新游戏',
  );
  assert.equal(
    JSON.parse(decodeText(fixture.files().get(statePath))).published.id,
    published.published.id,
  );
});

test('GitHub 素材与内容原子提交、路径校验和历史恢复', async () => {
  const fixture = githubFixture();
  const repo = new GitHubRepository({
    owner: 'biticaficir67-code',
    repository: 'boss_ke',
    token: 'fixture-only',
    fetcher: fixture.fetcher,
  });
  const first = await repo.read();
  const record = {
    id: '12345678-1234-1234-1234-123456789abc',
    src: '/uploads/12345678-1234-1234-1234-123456789abc.png',
    name: 'test.png',
  };
  const state = changeState(first.state, 'upload', { record });
  await repo.commit(first, state, {
    files: [{ path: imageRepositoryPath(record.src), base64: 'aW1hZ2U=' }],
  });
  assert.equal(
    new TextDecoder().decode(await repo.bytes(imageRepositoryPath(record.src))),
    'image',
  );
  const content = structuredClone(state.content);
  content.hero.slides[0].src = record.src;
  const saved = changeState(state, 'save', { content, expectedRevision: 1 });
  const published = changeState(saved, 'publish', { expectedRevision: 2 });
  assert.throws(() => changeState(published, 'remove', { id: record.id }), /使用/);
  const restored = changeState(published, 'restore', {
    id: published.history[1].id,
    expectedRevision: 2,
  });
  assert.equal(restored.content.hero.slides[0].src, '/sample-art/island.svg');
  assert.equal(restored.published.content.hero.slides[0].src, record.src);
  assert.throws(() => imageRepositoryPath('/../../.env'), /不支持/);
});
