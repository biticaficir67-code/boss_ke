import { statePath, validateState } from './state.js';

export function encodeText(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export function decodeText(value) { return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), char => char.charCodeAt(0))); }

export class GitHubRepository {
  constructor({ owner, repository, branch = 'main', token, fetcher = (...args) => globalThis.fetch(...args) }) {
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repository) || !branch || /[\s?#]/.test(branch)) throw new Error('GitHub 仓库配置不正确');
    this.root = `https://api.github.com/repos/${owner}/${repository}`;
    this.branch = branch; this.token = token; this.fetcher = fetcher;
  }
  async api(route, { method = 'GET', body, timeoutMs = 45000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetcher(`${this.root}${route}`, { method, signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
      let data;
      try { data = await response.json(); } catch { throw new Error('GitHub 返回了无法识别的内容，请检查网络'); }
      if (!response.ok) {
        const messages = { 401: '发布密钥无效或已过期，请重新授权', 403: '没有操作权限或请求额度已用完。请检查密钥是否获准写入此仓库', 404: '找不到仓库或内容文件，请检查仓库地址与授权范围', 409: '仓库已有新修改，请重新载入内容后再试', 422: '提交未被接受，可能有其他窗口刚刚保存，或分支受到保护。请重新载入后再试' };
        const error = new Error(messages[response.status] || `GitHub 暂时无法完成操作（${response.status}），请稍后重试`);
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('连接 GitHub 超时，请检查网络后重试；若刚刚保存，请先重新载入确认结果');
      if (error instanceof TypeError) throw new Error('无法连接 GitHub，请检查网络后重试');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async read() {
    const ref = await this.api(`/git/ref/heads/${this.branch.split('/').map(encodeURIComponent).join('/')}`);
    const sha = ref.object.sha;
    const commit = await this.api(`/git/commits/${sha}`);
    const file = await this.api(`/contents/${statePath}?ref=${sha}`);
    let content = file.content;
    if (!content) content = (await this.api(`/git/blobs/${file.sha}`)).content;
    return { sha, tree: commit.tree.sha, state: validateState(JSON.parse(decodeText(content))) };
  }
  async bytes(filename, ref) {
    const file = await this.api(`/contents/${filename.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref || this.branch)}`);
    const data = file.content ? file : await this.api(`/git/blobs/${file.sha}`);
    return Uint8Array.from(atob(data.content.replace(/\s/g, '')), char => char.charCodeAt(0));
  }
  async commit(snapshot, state, { message, files = [] } = {}) {
    const entries = [{ path: statePath, mode: '100644', type: 'blob', content: `${JSON.stringify(state, null, 2)}\n` }];
    // 先上传不可变对象，最后以非强制更新切换分支；并发冲突不能覆盖其他人的提交。
    for (const file of files) {
      if (file.remove) entries.push({ path: file.path, mode: '100644', type: 'blob', sha: null });
      else {
        const blob = await this.api('/git/blobs', { method: 'POST', body: { content: file.base64 || encodeText(file.text), encoding: 'base64' } });
        entries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
    }
    const tree = await this.api('/git/trees', { method: 'POST', body: { base_tree: snapshot.tree, tree: entries } });
    const commit = await this.api('/git/commits', { method: 'POST', body: { message: message || 'Update game website content', tree: tree.sha, parents: [snapshot.sha] } });
    await this.api(`/git/refs/heads/${this.branch.split('/').map(encodeURIComponent).join('/')}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
    return commit.sha;
  }
}
