import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { zipSync } from 'fflate';
import { defaultContent } from './default-content.mjs';
import { HttpError, imagePattern, validateContent } from './validation.mjs';
import { renderDocument } from '../src/site/render.js';
import { projectRoot } from './config.mjs';

export { projectRoot };
export class Store {
  constructor(dataDir = path.join(projectRoot, '.data')) {
    this.dir = path.resolve(dataDir);
    this.uploadsDir = path.join(this.dir, 'uploads');
    this.releasesDir = path.join(this.dir, 'releases');
    this.queue = Promise.resolve();
  }
  async init() {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    await fs.mkdir(this.releasesDir, { recursive: true });
    if (!await this.read('draft.json')) await this.write('draft.json', { content: defaultContent(), revision: 1, updatedAt: new Date().toISOString() });
    if (!await this.read('published.json')) {
      const draft = await this.read('draft.json');
      await this.publish(draft);
    }
  }
  transaction(fn) {
    const task = this.queue.then(fn);
    this.queue = task.catch(() => {});
    return task;
  }
  async read(name) {
    try { return JSON.parse(await fs.readFile(path.join(this.dir, name), 'utf8')); }
    catch (error) {
      if (error.code === 'ENOENT') return null;
      if (error instanceof SyntaxError) throw new HttpError(500, `本地数据文件 ${name} 格式损坏，请先备份数据目录，再从备份恢复；原文件没有被覆盖。`);
      throw error;
    }
  }
  async write(name, value) {
    const target = path.join(this.dir, name);
    const temporary = `${target}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, target);
  }
  async draft() {
    const draft = await this.read('draft.json');
    const published = await this.read('published.json');
    return { ...draft, publishedAt: published.createdAt, publishedRevision: published.revision, dirty: JSON.stringify(draft.content) !== JSON.stringify(published.content) };
  }
  async assertRevision(expected) {
    const draft = await this.read('draft.json');
    if (!Number.isInteger(expected) || expected !== draft.revision) throw new HttpError(409, '内容已在其他窗口更新，请重新载入后再操作');
    return draft;
  }
  async save(input, expected) {
    const previous = await this.assertRevision(expected);
    const content = validateContent(input);
    for (const slide of content.hero.slides) await fs.access(this.imagePath(slide.src)).catch(() => { throw new HttpError(400, '有图片不存在，请重新选择图片'); });
    await this.write('draft.json', { content, revision: previous.revision + 1, updatedAt: new Date().toISOString() });
    return this.draft();
  }
  imagePath(src) {
    if (!imagePattern.test(src)) throw new HttpError(400, '不支持的图片路径');
    return src.startsWith('/uploads/') ? path.join(this.uploadsDir, path.basename(src)) : path.join(projectRoot, 'public', src.slice(1));
  }
  releasePath(id) {
    if (!/^\d{13}-[a-f0-9]{8}$/.test(id)) throw new HttpError(400, '版本标识不正确');
    return path.join(this.releasesDir, id);
  }
  async publish(draft) {
    const content = validateContent(draft.content);
    const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    const dir = path.join(this.releasePath(id), 'site');
    await fs.mkdir(path.join(dir, 'assets'), { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), renderDocument(content));
    await fs.copyFile(path.join(projectRoot, 'src/site/site.css'), path.join(dir, 'site.css'));
    await fs.copyFile(path.join(projectRoot, 'src/site/runtime.js'), path.join(dir, 'site.js'));
    await fs.copyFile(path.join(projectRoot, 'public/favicon.svg'), path.join(dir, 'favicon.svg'));
    for (const slide of content.hero.slides) await fs.copyFile(this.imagePath(slide.src), path.join(dir, 'assets', path.basename(slide.src)));
    const release = { id, createdAt: new Date().toISOString(), revision: draft.revision, content };
    await fs.writeFile(path.join(this.releasePath(id), 'release.json'), JSON.stringify(release, null, 2));
    // 最后切换指针；生成失败时访客仍访问旧版本。
    await this.write('published.json', release);
    return release;
  }
  async history() {
    const ids = (await fs.readdir(this.releasesDir)).filter(id => /^\d{13}-[a-f0-9]{8}$/.test(id)).sort().reverse();
    const result = [];
    for (const id of ids) {
      try { const release = JSON.parse(await fs.readFile(path.join(this.releasePath(id), 'release.json'), 'utf8')); result.push({ id, createdAt: release.createdAt, revision: release.revision, name: release.content.brand.name }); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const published = await this.read('published.json');
    return result.sort((a, b) => a.id === published.id ? -1 : b.id === published.id ? 1 : b.createdAt.localeCompare(a.createdAt));
  }
  async restore(id, expected) {
    await this.assertRevision(expected);
    let release;
    try { release = JSON.parse(await fs.readFile(path.join(this.releasePath(id), 'release.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') throw new HttpError(404, '该版本不存在'); throw error; }
    // 历史快照保存了资源；即使素材库删除旧图，也能完整恢复。
    const content = validateContent(release.content);
    const records = await this.read('uploads.json') || [];
    let changed = false;
    for (const slide of content.hero.slides) {
      if (!slide.src.startsWith('/uploads/')) continue;
      try { await fs.access(this.imagePath(slide.src)); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        await fs.copyFile(path.join(this.releasePath(id), 'site', 'assets', path.basename(slide.src)), this.imagePath(slide.src));
        if (!records.some(record => record.src === slide.src)) {
          const info = await fs.stat(this.imagePath(slide.src));
          records.unshift({ id: path.basename(slide.src).split('.')[0], name: slide.alt || '历史版本恢复图片', src: slide.src, bytes: info.size, createdAt: new Date().toISOString() });
          changed = true;
        }
      }
    }
    if (changed) await this.write('uploads.json', records);
    return this.save(content, expected);
  }
  async zip(releaseId) {
    const id = releaseId || (await this.read('published.json')).id;
    const dir = path.join(this.releasePath(id), 'site');
    const files = {};
    async function collect(current, prefix = '') {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        if (entry.isDirectory()) await collect(path.join(current, entry.name), `${prefix}${entry.name}/`);
        else files[`${prefix}${entry.name}`] = new Uint8Array(await fs.readFile(path.join(current, entry.name)));
      }
    }
    await collect(dir);
    return Buffer.from(zipSync(files, { level: 6 }));
  }
  async upload({ name, data }) {
    if (typeof data !== 'string' || !/^[a-zA-Z0-9+/]+={0,2}$/.test(data)) throw new HttpError(400, '图片编码不正确');
    const buffer = Buffer.from(data, 'base64');
    if (!buffer.length || buffer.length > 3 * 1024 * 1024) throw new HttpError(413, '图片不能超过 3MB，请压缩后上传');
    let ext;
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ext = 'png';
    else if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) ext = 'jpg';
    else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') ext = 'webp';
    else throw new HttpError(400, '仅支持真实的 JPG、PNG、WebP 图片，不支持 SVG 或其他文件');
    const id = randomUUID();
    const filename = `${id}.${ext}`;
    await fs.writeFile(path.join(this.uploadsDir, filename), buffer);
    const record = { id, name: String(name || '未命名图片').slice(0, 120), src: `/uploads/${filename}`, bytes: buffer.length, createdAt: new Date().toISOString() };
    const records = await this.read('uploads.json') || [];
    await this.write('uploads.json', [record, ...records]);
    return record;
  }
  async removeUpload(id) {
    const records = await this.read('uploads.json') || [];
    const record = records.find(item => item.id === id);
    if (!record) throw new HttpError(404, '图片不存在');
    const draft = await this.read('draft.json');
    const published = await this.read('published.json');
    if ([...draft.content.hero.slides, ...published.content.hero.slides].some(slide => slide.src === record.src)) throw new HttpError(409, '这张图片仍被草稿或已发布官网使用，请先替换并发布后再删除');
    await fs.unlink(this.imagePath(record.src)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await this.write('uploads.json', records.filter(item => item.id !== id));
  }
}
