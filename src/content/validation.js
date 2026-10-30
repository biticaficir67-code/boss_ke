export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function text(value, label, max, { required = true } = {}) {
  if (typeof value !== 'string') throw new HttpError(400, `${label}必须是文字`);
  const result = value.trim();
  if (required && !result) throw new HttpError(400, `请填写${label}`);
  if (result.length > max) throw new HttpError(400, `${label}不能超过 ${max} 个字符`);
  return result;
}
export const imagePattern =
  /^\/(?:sample-art\/(?:island|forest|journey)\.svg|uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp))$/;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export function validateContent(input) {
  if (!isRecord(input)) throw new HttpError(400, '内容格式不正确');
  const { brand = {}, hero = {}, about = {}, download = {} } = input;
  if (![brand, hero, about, download].every(isRecord))
    throw new HttpError(400, '游戏信息、轮播、介绍和下载设置必须是有效对象');
  if (!Array.isArray(hero.slides) || !hero.slides.length || hero.slides.length > 8)
    throw new HttpError(400, '轮播图需要 1 至 8 张');
  if (!Array.isArray(about.features) || about.features.length > 6)
    throw new HttpError(400, '游戏特点最多填写 6 项');
  const interval = Number(hero.interval);
  if (!Number.isInteger(interval) || interval < 3000 || interval > 15000)
    throw new HttpError(400, '轮播间隔需要在 3 至 15 秒之间');
  const slides = hero.slides.map((slide, i) => {
    if (!slide || !imagePattern.test(slide.src))
      throw new HttpError(400, `第 ${i + 1} 张图片地址不受支持，请从素材库选择`);
    if (typeof slide.id !== 'string' || !/^[\w-]{1,60}$/.test(slide.id))
      throw new HttpError(400, '轮播图片标识不正确');
    return {
      id: slide.id,
      src: slide.src,
      alt: text(slide.alt, '图片描述', 150, { required: false }),
      caption: text(slide.caption, '图片角标', 80, { required: false }),
    };
  });
  if (new Set(slides.map((slide) => slide.id)).size !== slides.length)
    throw new HttpError(400, '轮播图片标识不能重复');
  const url = text(download.url, '下载地址', 2000, { required: false });
  if (url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new HttpError(400, '请填写完整的 HTTPS 下载地址');
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || /[\r\n]/.test(url))
      throw new HttpError(400, '下载地址必须使用 HTTPS，且不能包含账号密码');
  }
  if (typeof download.enabled !== 'boolean') throw new HttpError(400, '下载区开关格式不正确');
  return {
    schemaVersion: 1,
    brand: {
      name: text(brand.name, '游戏名称', 30),
      englishName: text(brand.englishName, '英文名称', 80, { required: false }),
      studio: text(brand.studio, '工作室名称', 50),
      contact: text(brand.contact, '联系信息', 100, { required: false }),
    },
    hero: {
      eyebrow: text(hero.eyebrow, '顶部小标题', 60, { required: false }),
      title: text(hero.title, '首页主标题', 100),
      subtitle: text(hero.subtitle, '首页副标题', 400, { required: false }),
      interval,
      slides,
    },
    about: {
      eyebrow: text(about.eyebrow, '介绍区小标题', 40, { required: false }),
      title: text(about.title, '介绍区标题', 100),
      body: text(about.body, '游戏简介', 6000),
      features: about.features
        .map((value) => text(value, '游戏特点', 24, { required: false }))
        .filter(Boolean),
    },
    download: {
      enabled: download.enabled,
      title: text(download.title, '下载区标题', 100),
      description: text(download.description, '下载说明', 2000, { required: false }),
      buttonText: text(download.buttonText, '下载按钮文字', 20),
      url,
      version: text(download.version, '版本号', 40, { required: false }),
      platform: text(download.platform, '支持平台', 80, { required: false }),
      fileSize: text(download.fileSize, '文件大小', 40, { required: false }),
      extractionCode: text(download.extractionCode, '提取码', 40, { required: false }),
    },
  };
}
