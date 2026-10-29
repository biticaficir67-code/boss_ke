import { encodeText } from '../../src/github/repository.js';
import { initialState, statePath, publishedPath } from '../../src/github/state.js';

export function githubFixture() {
  let number = 0;
  let head = 'commit-initial';
  const state = initialState();
  const blobs = new Map();
  const initial = new Map([[statePath, encodeText(JSON.stringify(state))], [publishedPath, encodeText(JSON.stringify(state.published))]]);
  const trees = new Map([['tree-initial', initial]]);
  const commits = new Map([[head, { tree: 'tree-initial', parents: [] }]]);
  const requests = [];
  function files(ref = head) { if (ref === 'main') ref = head; return trees.get(commits.get(ref)?.tree || ref); }
  async function handler(url, options = {}) {
    const target = new URL(url);
    const route = target.pathname.replace('/repos/biticaficir67-code/boss_ke', '');
    const method = options.method || 'GET';
    const body = options.body ? typeof options.body === 'string' ? JSON.parse(options.body) : options.body : {};
    requests.push({ method, route });
    const fail = status => ({ status, body: { message: 'fixture error' } });
    if (route.startsWith('/git/ref/heads/')) return { status: 200, body: { object: { sha: head } } };
    if (route.startsWith('/git/commits/') && method === 'GET') {
      const value = commits.get(route.split('/').pop()); return value ? { status: 200, body: { tree: { sha: value.tree } } } : fail(404);
    }
    if (route.startsWith('/contents/')) {
      const filename = decodeURIComponent(route.slice('/contents/'.length));
      const content = files(target.searchParams.get('ref') || head)?.get(filename);
      return content ? { status: 200, body: { content, encoding: 'base64' } } : fail(404);
    }
    if (route === '/git/blobs' && method === 'POST') { const sha = `blob-${++number}`; blobs.set(sha, body.content); return { status: 201, body: { sha } }; }
    if (route === '/git/trees' && method === 'POST') {
      const tree = new Map(trees.get(body.base_tree));
      for (const entry of body.tree) {
        if (entry.sha === null) tree.delete(entry.path);
        else tree.set(entry.path, entry.content !== undefined ? encodeText(entry.content) : blobs.get(entry.sha));
      }
      const sha = `tree-${++number}`; trees.set(sha, tree); return { status: 201, body: { sha } };
    }
    if (route === '/git/commits' && method === 'POST') {
      const sha = `commit-${++number}`; commits.set(sha, { tree: body.tree, parents: body.parents }); return { status: 201, body: { sha } };
    }
    if (route.startsWith('/git/refs/heads/') && method === 'PATCH') {
      if (body.force !== false || commits.get(body.sha)?.parents[0] !== head) return fail(422);
      head = body.sha; return { status: 200, body: { object: { sha: head } } };
    }
    return fail(404);
  }
  return { state, requests, handler, files, head: () => head, async fetcher(url, options) { const result = await handler(url, options); return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } }); } };
}
