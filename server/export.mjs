import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isWithin, projectRoot } from './config.mjs';

export async function exportPublished(store, directory = path.join(projectRoot, 'site-output')) {
  const output = path.resolve(directory);
  if (path.basename(output) !== 'site-output' || !isWithin(projectRoot, output) || isWithin(store.dir, output)) throw new Error('导出目标必须是项目内独立的 site-output 目录，不能覆盖源码或数据目录');
  const parent = path.dirname(output);
  const key = randomUUID();
  const staging = path.join(parent, `.site-output-stage-${key}`);
  const previous = path.join(parent, `.site-output-previous-${key}`);
  const archive = path.join(parent, 'site-output.zip');
  const temporaryArchive = path.join(parent, `.site-output-archive-${key}.tmp`);
  const removeTemporary = async target => {
    const absolute = path.resolve(target);
    if (path.dirname(absolute) !== parent || !path.basename(absolute).startsWith('.site-output-')) throw new Error('拒绝清理未验证的导出路径');
    await fs.rm(absolute, { recursive: true, force: true });
  };
  let movedOld = false;
  let swapped = false;
  let committed = false;
  try {
    const published = await store.read('published.json');
    await fs.mkdir(parent, { recursive: true });
    await fs.cp(path.join(store.releasePath(published.id), 'site'), staging, { recursive: true });
    await fs.writeFile(temporaryArchive, await store.zip(published.id));
    try { await fs.rename(output, previous); movedOld = true; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await fs.rename(staging, output); swapped = true; }
    catch (error) { if (movedOld) { await fs.rename(previous, output); movedOld = false; } throw error; }
    await fs.rename(temporaryArchive, archive);
    committed = true;
    if (movedOld) await removeTemporary(previous).catch(() => {});
    return { output, archive, releaseId: published.id };
  } catch (error) {
    if (swapped && !committed) {
      await fs.rename(output, staging);
      if (movedOld) await fs.rename(previous, output);
    }
    throw error;
  } finally {
    await removeTemporary(staging);
    await removeTemporary(temporaryArchive);
  }
}
