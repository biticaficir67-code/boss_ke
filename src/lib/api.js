// 页面只需要知道“执行什么操作”，不必在每个按钮里编写 GitHub 请求。
export async function request(url, options = {}) {
  const { githubRequest } = await import('../github/client.js');
  try {
    return await githubRequest(url, options);
  } catch (error) {
    if (error.status === 401 && url.startsWith('/api/admin/')) {
      window.dispatchEvent(new Event('session-expired'));
    }
    throw error;
  }
}
