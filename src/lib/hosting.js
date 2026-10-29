export const githubMode = import.meta.env.VITE_SITE_BACKEND === 'github';
export const githubConfig = {
  owner: import.meta.env.VITE_GITHUB_OWNER || 'biticaficir67-code',
  repository: import.meta.env.VITE_GITHUB_REPOSITORY || 'boss_ke',
  branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
};
export const websiteUrl = githubMode ? new URL('../', document.baseURI).href : '/';
const images = new Map();
export function rememberImage(src, url) { if (images.get(src)?.startsWith('blob:')) URL.revokeObjectURL(images.get(src)); images.set(src, url); }
export function imageUrl(src) { return githubMode ? images.get(src) || new URL(`.${src}`, document.baseURI).href : src; }
export function previewOptions() { return githubMode ? { preview: true, assetBase: new URL('site-assets/', document.baseURI).href, imageResolver: imageUrl } : { preview: true }; }
