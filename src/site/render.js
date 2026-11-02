import { emptySections } from '../content/sections.js';

// 官网、完整预览、导出共用模板；可编辑内容始终按普通文字处理。
export const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const lines = (value) => escapeHtml(value).replace(/\n/g, '<br>');
const paragraphs = (value) =>
  value
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((part) => `<p>${lines(part)}</p>`)
    .join('');
const number = (index) => String(index + 1).padStart(2, '0');
const arrow =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const seal =
  '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M4 11h32v22H4zM4 11l16 13 16-13M4 33l11-13m21 13L25 20" stroke="currentColor" stroke-width="1.5"/><path d="m13 11-2-7 9 5 9-5-2 7" stroke="currentColor" stroke-width="1.5"/></svg>';
const heading = (index, label, title) =>
  `<div class="gs-section-heading"><p class="gs-eyebrow"><span>${index}</span>${label}</p><h2>${lines(title)}</h2></div>`;

function renderCharacters(characters, imagePath) {
  if (!characters.length) return '';
  return `<section class="gs-characters gs-section" id="characters" aria-labelledby="characters-title">
    ${heading('02', '人物卷宗 / 概念档案', '他们似乎，\n都在等你。').replace('<h2>', '<h2 id="characters-title">')}
    <div class="gs-character-layout"><div class="gs-character-tabs" role="tablist" aria-label="角色档案">${characters
      .map(
        (item, i) => `
      <button type="button" role="tab" id="character-tab-${escapeHtml(item.id)}" aria-controls="character-${escapeHtml(item.id)}" aria-selected="${i === 0}" tabindex="${i ? '-1' : '0'}" data-character="${i}" class="${i ? '' : 'is-active'}"><span>${number(i)} /</span>${escapeHtml(item.name)}<span aria-hidden="true">↗</span></button>`,
      )
      .join('')}</div>
      <div class="gs-character-panels">${characters
        .map(
          (
            item,
            i,
          ) => `<article role="tabpanel" tabindex="0" aria-labelledby="character-tab-${escapeHtml(item.id)}" id="character-${escapeHtml(item.id)}" data-character-panel="${i}" ${i ? 'hidden' : ''}>
        <div class="gs-character-portrait">${item.image ? `<img src="${escapeHtml(imagePath(item.image))}" alt="${escapeHtml(item.name)}的概念画面" loading="lazy">` : seal}<span>FILE ${number(i)} / 概念设定</span></div>
        <div class="gs-character-copy"><p class="gs-eyebrow">${escapeHtml(item.role)}</p><h3>${escapeHtml(item.name)}</h3>${item.quote ? `<blockquote>“${escapeHtml(item.quote)}”</blockquote>` : ''}<p>${lines(item.body)}</p><span class="gs-file-mark" aria-hidden="true">未归档</span></div>
      </article>`,
        )
        .join('')}</div></div></section>`;
}

function renderGallery(slides, imagePath) {
  if (slides.length < 2) return '';
  return `<section class="gs-gallery gs-section" id="gallery" aria-labelledby="gallery-title">
    ${heading('03', '影像档案', '有些画面，\n比记忆更清晰。').replace('<h2>', '<h2 id="gallery-title">')}
    <div class="gs-gallery-grid">${slides.map((slide, i) => `<button class="gs-gallery-item" data-gallery="${i}" aria-label="放大查看：${escapeHtml(slide.alt || `画面 ${i + 1}`)}"><span class="gs-gallery-image"><img src="${escapeHtml(imagePath(slide.src))}" alt="${escapeHtml(slide.alt)}" loading="lazy"><span class="gs-gallery-zoom" aria-hidden="true">↗</span></span><span class="gs-gallery-caption"><span>${escapeHtml(slide.caption || slide.alt || `画面 ${number(i)}`)}</span><i>${number(i)}</i></span></button>`).join('')}</div>
    <dialog class="gs-lightbox" aria-label="画面浏览" data-lightbox><div class="gs-lightbox-toolbar"><span data-lightbox-count></span><button type="button" data-lightbox-close aria-label="关闭大图" autofocus>关闭 ×</button></div><div class="gs-lightbox-stage"><button type="button" data-lightbox-prev aria-label="上一张大图">←</button><figure><img data-lightbox-image alt=""><figcaption data-lightbox-caption></figcaption></figure><button type="button" data-lightbox-next aria-label="下一张大图">→</button></div></dialog>
  </section>`;
}

function renderUpdates(items) {
  if (!items.length) return '';
  // 同日动态保留编辑顺序，不改变仓库中的原始数据。
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  return `<section class="gs-updates gs-section" id="updates" aria-labelledby="updates-title">${heading('04', '邮局公告', '最近，\n又有新的消息。').replace('<h2>', '<h2 id="updates-title">')}<div class="gs-update-list">${sorted.map((item) => `<details class="gs-update"><summary><time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date.replaceAll('-', '.'))}</time><span class="gs-update-kind">${escapeHtml(item.kind)}</span><h3>${escapeHtml(item.title)}</h3><span class="gs-plus" aria-hidden="true">+</span></summary><div class="gs-update-body">${paragraphs(item.body)}</div></details>`).join('')}</div></section>`;
}

function renderDownload({ brand, download, extra }) {
  if (!download.enabled) return '';
  const url = /^https:\/\//i.test(download.url) ? download.url : '';
  const metadata = [
    ['当前版本', download.version],
    ['支持平台', download.platform],
    ['文件大小', download.fileSize],
  ].filter(([, value]) => value);
  return `<section class="gs-download gs-section" id="download" aria-labelledby="download-title">
    <div class="gs-download-copy">${heading('05', '领取你的邮件', download.title).replace('<h2>', '<h2 id="download-title">')}${download.description ? `<p>${lines(download.description)}</p>` : ''}<span class="gs-download-stamp" aria-hidden="true">${seal} UNKNOWN MAIL</span></div>
    <div class="gs-download-card"><div class="gs-version"><span></span>${url ? '投递通道已开放' : '投递通道待开放'}</div><h3>${escapeHtml(brand.name)}</h3><dl>${metadata.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
    ${url ? `<a class="gs-button gs-button-warm" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(download.buttonText)}${arrow}</a>` : '<button class="gs-button gs-button-warm" disabled>下载即将开放 <span aria-hidden="true">↗</span></button>'}
    ${download.extractionCode && url ? `<button class="gs-extraction" data-copy="${escapeHtml(download.extractionCode)}">提取码：${escapeHtml(download.extractionCode)} <span>复制</span></button>` : ''}
    ${extra.system.length ? `<details class="gs-system"><summary>配置与运行说明<span aria-hidden="true">+</span></summary><dl>${extra.system.map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`).join('')}</dl></details>` : ''}</div>
  </section>`;
}

export function renderSite(
  content,
  { staticAssets = false, editorLink = true, editorHref = '/admin/', imageResolver } = {},
) {
  const { brand, hero, about, download } = content;
  const extra = content.extra || emptySections();
  const imagePath = (src) =>
    imageResolver ? imageResolver(src) : staticAssets ? `./assets/${src.split('/').pop()}` : src;
  const navigation = [
    ['about', '故事'],
    ...(extra.characters.length ? [['characters', '角色']] : []),
    ...(hero.slides.length > 1 ? [['gallery', '影像']] : []),
    ...(extra.updates.length ? [['updates', '动态']] : []),
    ...(download.enabled ? [['download', '下载游戏']] : []),
  ];
  return `<div class="game-site" data-interval="${hero.interval}" data-effects="off">
    <a class="gs-skip" href="#about">跳转到游戏介绍</a><div class="gs-reading-progress" data-progress aria-hidden="true"></div>
    <header class="gs-header"><a class="gs-brand" href="#top" aria-label="${escapeHtml(brand.name)}首页"><span class="gs-brand-mark">${seal}</span><span>${escapeHtml(brand.name)}<small>${escapeHtml(brand.englishName)}</small></span></a>
      <button class="gs-menu-toggle" data-menu aria-expanded="false" aria-controls="site-navigation">菜单 <span aria-hidden="true">☰</span></button>
      <nav id="site-navigation" aria-label="主导航">${navigation.map(([id, label]) => `<a href="#${id}" data-nav="${id}">${label}</a>`).join('')}<button class="gs-effects" data-effects-toggle aria-pressed="false">氛围 <span>关</span></button></nav></header>
    <main id="top"><section class="gs-hero" aria-label="游戏主视觉轮播" aria-roledescription="轮播"><div class="gs-slides">${hero.slides.map((slide, i) => `<figure class="gs-slide${i ? '' : ' is-active'}" data-slide="${i}" aria-hidden="${i !== 0}"><img src="${escapeHtml(imagePath(slide.src))}" alt="${escapeHtml(slide.alt)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>${slide.caption ? `<figcaption>${escapeHtml(slide.caption)}</figcaption>` : ''}</figure>`).join('')}</div><div class="gs-hero-shade" aria-hidden="true"></div><div class="gs-fog" aria-hidden="true"></div>
      <div class="gs-hero-copy"><p class="gs-eyebrow gs-light-eyebrow"><span>NO. 000</span>${escapeHtml(hero.eyebrow)}</p><h1>${lines(hero.title)}</h1><p class="gs-hero-description">${escapeHtml(hero.subtitle)}</p><div class="gs-hero-actions">${download.enabled ? `<a class="gs-button gs-button-warm" href="#download">${escapeHtml(download.buttonText)}${arrow}</a>` : ''}<a class="gs-text-link" href="#about">读取第一封来信 ↘</a></div></div>
      <div class="gs-hero-bottom"><span class="gs-hero-signature">寄件人：未知 <span aria-hidden="true">/</span> 投递时间：午夜之后</span><div class="gs-carousel-controls"><span class="gs-slide-number"><b data-current>01</b><span>/ ${String(hero.slides.length).padStart(2, '0')}</span></span><button class="gs-arrow gs-prev" data-prev aria-label="上一张">${arrow}</button><button class="gs-arrow" data-next aria-label="下一张">${arrow}</button><button class="gs-pause" data-pause aria-label="暂停自动轮播" aria-pressed="false">Ⅱ</button></div></div></section>
      <div class="gs-filmstrip"><span class="gs-filmstrip-label">ARCHIVE / <span>影像索引</span></span><div class="gs-dots">${hero.slides.map((slide, i) => `<button class="gs-dot${i ? '' : ' is-active'}" data-goto="${i}" aria-label="查看第 ${i + 1} 张图片" aria-pressed="${i === 0}"><img src="${escapeHtml(imagePath(slide.src))}" alt="" loading="lazy"><span>${number(i)}</span></button>`).join('')}</div><a href="#about" class="gs-scroll-link">向下读取 ↓</a></div>
      <section class="gs-about gs-section" id="about" aria-labelledby="about-title"><div class="gs-about-intro">${heading('01', about.eyebrow, about.title).replace('<h2>', '<h2 id="about-title">')}<div class="gs-about-body">${paragraphs(about.body)}</div><div class="gs-features">${about.features.map((text) => `<span>${escapeHtml(text)}</span>`).join('')}</div></div>
      ${extra.story.enabled ? `<details class="gs-letter"><summary><span class="gs-letter-label">未读来信 / 001</span><span class="gs-letter-mark">${seal}</span><strong>${escapeHtml(extra.story.subject)}</strong><span class="gs-letter-action">拆阅来信 ↗</span></summary><div class="gs-letter-body"><p class="gs-letter-sender">${escapeHtml(extra.story.sender)}</p>${paragraphs(extra.story.body)}<span class="gs-letter-end">— 邮件结束 —</span></div></details>` : ''}</section>
      ${extra.gameplay.length ? `<section class="gs-gameplay gs-section" aria-label="玩法介绍">${extra.gameplay.map((item, i) => `<article><span class="gs-gameplay-number">0${i + 1} /</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`).join('')}</section>` : ''}
      ${renderCharacters(extra.characters, imagePath)}${renderGallery(hero.slides, imagePath)}${renderUpdates(extra.updates)}${renderDownload({ brand, download, extra })}
      ${extra.faq.length ? `<section class="gs-faq gs-section" id="faq" aria-labelledby="faq-title">${heading('06', '收件须知', '关于这次投递。').replace('<h2>', '<h2 id="faq-title">')}<div>${extra.faq.map((item) => `<details><summary>${escapeHtml(item.question)}<span class="gs-plus" aria-hidden="true">+</span></summary><div>${paragraphs(item.answer)}</div></details>`).join('')}</div></section>` : ''}
    </main><footer class="gs-footer"><a class="gs-footer-brand" href="#top">${seal}<span>${escapeHtml(brand.name)}<small>${escapeHtml(brand.studio)}</small></span></a><div class="gs-footer-links">${extra.links
      .filter((item) => /^https:\/\//i.test(item.url))
      .map(
        (item) =>
          `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)} ↗</a>`,
      )
      .join(
        '',
      )}${editorLink ? `<a href="${escapeHtml(editorHref)}" class="gs-admin-link">内容管理 ↗</a>` : ''}<a href="#top">回到顶部 ↑</a></div><p>© ${new Date().getFullYear()} ${escapeHtml(brand.name)}${brand.contact ? ` · ${escapeHtml(brand.contact)}` : ''}</p></footer><div class="gs-toast" role="status" aria-live="polite"></div>
  </div>`;
}

export function renderDocument(
  content,
  { preview = false, editorHref = '', assetBase, imageResolver, assetVersion = '' } = {},
) {
  const prefix = assetBase || (preview ? '/site-assets/' : './');
  const version = assetVersion ? `?v=${encodeURIComponent(assetVersion)}` : '';
  return `<!doctype html>
<html lang="zh-CN" class="site-document"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(content.hero.subtitle)}"><meta name="theme-color" content="#0d1416">${preview ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escapeHtml(content.brand.name)} · 游戏官网</title><link rel="icon" href="${preview ? `${prefix}../` : './'}favicon.svg${version}" type="image/svg+xml"><link rel="stylesheet" href="${prefix}site.css${version}"></head><body>
${renderSite(content, { staticAssets: !preview, editorLink: !!editorHref, editorHref, imageResolver })}
<script type="module">import { mountSite } from '${prefix}site.js${version}'; mountSite(document.querySelector('.game-site'));</script></body></html>`;
}
