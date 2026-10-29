import { defaultContent } from '../../server/default-content.mjs';
import { validateContent, HttpError, imagePattern } from '../../server/validation.mjs';

export const statePath = 'site-content/state.json';
export const publishedPath = 'site-content/published.json';
export function initialState(content = defaultContent()) {
  const clean = validateContent(content);
  const now = new Date().toISOString();
  const release = { id: `initial-${Date.now()}`, createdAt: now, revision: 1, content: clean };
  return { schemaVersion: 1, revision: 1, updatedAt: now, content: clean, published: release, uploads: [], history: [release] };
}
export function validateState(state) {
  if (!state || state.schemaVersion !== 1 || !Number.isSafeInteger(state.revision) || state.revision < 1 || !Array.isArray(state.uploads) || !Array.isArray(state.history)) throw new Error('仓库内容数据格式不正确，请先恢复 site-content/state.json');
  validateContent(state.content); validateContent(state.published?.content);
  for (const record of state.uploads) {
    if (!record || !/^\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(record.src) || !/^[a-f0-9-]{36}$/.test(record.id)) throw new Error('素材记录格式不正确');
  }
  return state;
}
export function imageRepositoryPath(src) {
  if (!imagePattern.test(src)) throw new Error('不支持的图片路径');
  return src.startsWith('/uploads/') ? `site-content${src}` : `public${src}`;
}
export function assertImages(content, uploads) {
  for (const slide of content.hero.slides) {
    if (slide.src.startsWith('/uploads/') && !uploads.some(record => record.src === slide.src)) throw new HttpError(400, '图片已从素材库移除，请重新选择');
  }
}
export function asDraft(state) {
  return { content: state.content, revision: state.revision, updatedAt: state.updatedAt, publishedAt: state.published.createdAt, publishedRevision: state.published.revision, releaseId: state.published.id, dirty: JSON.stringify(state.content) !== JSON.stringify(state.published.content) };
}
export function changeState(previous, action, body = {}) {
  const state = structuredClone(validateState(previous));
  if (['save', 'publish', 'restore'].includes(action) && body.expectedRevision !== state.revision) throw new HttpError(409, '内容已在其他窗口更新，请重新载入后再操作');
  if (action === 'save' || action === 'restore') {
    const content = action === 'save' ? validateContent(body.content) : state.history.find(item => item.id === body.id)?.content;
    if (!content) throw new HttpError(404, '历史版本不存在');
    assertImages(content, state.uploads);
    state.content = structuredClone(content); state.revision++;
    state.updatedAt = new Date().toISOString();
  } else if (action === 'publish') {
    assertImages(state.content, state.uploads);
    const release = { id: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString(), revision: state.revision, content: validateContent(state.content) };
    state.published = release;
    state.history = [release, ...state.history].slice(0, 30);
  } else if (action === 'upload') {
    state.uploads.unshift(body.record);
  } else if (action === 'remove') {
    const record = state.uploads.find(item => item.id === body.id);
    if (!record) throw new HttpError(404, '图片不存在');
    // 历史版本仍引用的原图留在仓库，确保恢复时不缺图。
    const slides = [state.content, state.published.content, ...state.history.map(item => item.content)].flatMap(content => content.hero.slides);
    if (slides.some(slide => slide.src === record.src)) throw new HttpError(409, '这张图片仍被草稿、官网或历史版本使用，无法删除');
    state.uploads = state.uploads.filter(item => item.id !== body.id);
  } else throw new Error('不支持的内容操作');
  return state;
}
