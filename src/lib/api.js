let csrf = '';
export const setCsrf = (value) => { csrf = value || ''; };
export async function request(url, { method = 'GET', body, blob = false, timeoutMs = 15000 } = {}) {
  if (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SITE_BACKEND === 'github') {
    const { githubRequest } = await import('../github/client.js');
    try { return await githubRequest(url, { method, body, blob, timeoutMs }); }
    catch (error) {
      if (error.status === 401 && url.startsWith('/api/admin/')) window.dispatchEvent(new Event('session-expired'));
      throw error;
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method, credentials: 'same-origin', signal: controller.signal, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) {
      let message = '暂时无法完成操作，请稍后重试';
      try { message = (await response.json()).error || message; } catch { /* 保留适合用户阅读的错误信息。 */ }
      const error = new Error(message); error.status = response.status;
      if (response.status === 401 && url.startsWith('/api/admin/') && typeof window !== 'undefined') window.dispatchEvent(new Event('session-expired'));
      throw error;
    }
    return blob ? await response.blob() : await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('请求超时，请确认启动窗口仍在运行，再重新载入内容');
    if (error instanceof TypeError && !error.status) throw new Error('无法连接网站服务，请检查启动窗口是否已关闭，或重新运行 start.bat');
    if (error instanceof SyntaxError) throw new Error('服务返回的内容格式不正确，请重新启动服务后再试');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
