// 管理员输入的文字先转义，再插入 HTML，避免把普通文案当作标签。
export const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

const lines = (value) => escapeHtml(value).replace(/\n/g, '<br>');
const arrow =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const mark =
  '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 3 5 12 12 5-12 5-5 12-5-12L3 20l12-5Z" fill="currentColor"/><circle cx="20" cy="20" r="4" fill="#f8f4ed"/></svg>';

function renderDownload({ brand, download }) {
  if (!download.enabled) return '';

  const url = /^https:\/\//i.test(download.url) ? download.url : '';
  const button = url
    ? `<a class="gs-button gs-button-dark" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(download.buttonText)} ${arrow}</a>`
    : '<button class="gs-button gs-button-dark" disabled>下载即将开放 <span>↗</span></button>';
  const extraction =
    download.extractionCode && url
      ? `<button class="gs-extraction" data-copy="${escapeHtml(download.extractionCode)}">提取码：${escapeHtml(download.extractionCode)} <span>点击复制</span></button>`
      : '';

  return `
    <section class="gs-download" id="download">
      <div class="gs-download-orbit" aria-hidden="true"></div>
      <div class="gs-download-copy">
        <p class="gs-eyebrow">02 — YOUR NEXT CHAPTER</p>
        <h2>${lines(download.title)}</h2>
        <p>${escapeHtml(download.description)}</p>
      </div>
      <div class="gs-download-card">
        <div class="gs-version"><span class="gs-status-dot"></span>${url ? 'AVAILABLE NOW' : 'COMING SOON'}</div>
        <h3>${escapeHtml(brand.name)}</h3>
        <dl>
          <div><dt>当前版本</dt><dd>${escapeHtml(download.version)}</dd></div>
          <div><dt>支持平台</dt><dd>${escapeHtml(download.platform)}</dd></div>
          <div><dt>文件大小</dt><dd>${escapeHtml(download.fileSize)}</dd></div>
        </dl>
        ${button}
        ${extraction}
        <p class="gs-download-note">${url ? '将前往外部下载平台，文件由该平台提供。' : '尚未设置下载地址，请在后台填写后发布。'}</p>
      </div>
    </section>`;
}

export function renderSite(
  content,
  { staticAssets = false, editorLink = true, editorHref = '/admin/', imageResolver } = {},
) {
  const { brand, hero, about, download } = content;
  const imagePath = (src) => {
    if (imageResolver) return imageResolver(src);
    if (staticAssets) return `./assets/${src.split('/').pop()}`;
    return src;
  };

  const slides = hero.slides
    .map(
      (slide, index) => `
    <figure class="gs-slide${index === 0 ? ' is-active' : ''}" data-slide="${index}" aria-hidden="${index !== 0}">
      <img src="${escapeHtml(imagePath(slide.src))}" alt="${escapeHtml(slide.alt)}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}>
      <figcaption>${escapeHtml(slide.caption)}</figcaption>
    </figure>`,
    )
    .join('');
  const dots = hero.slides
    .map(
      (_, index) => `
    <button class="gs-dot${index === 0 ? ' is-active' : ''}" data-goto="${index}" aria-label="查看第 ${index + 1} 张图片" aria-pressed="${index === 0}"><span></span></button>`,
    )
    .join('');
  const paragraphs = about.body
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((text) => `<p>${lines(text)}</p>`)
    .join('');
  const features = about.features
    .filter(Boolean)
    .map((text, index) => `<span><i>0${index + 1}</i>${escapeHtml(text)}</span>`)
    .join('');
  const management = editorLink
    ? `<a class="gs-admin-link" href="${escapeHtml(editorHref)}">内容管理 <span aria-hidden="true">↗</span></a>`
    : '';

  return `
  <div class="game-site" data-interval="${hero.interval}">
    <header class="gs-header">
      <a class="gs-brand" href="#top" aria-label="${escapeHtml(brand.name)}首页">
        <span class="gs-brand-mark">${mark}</span>
        <span>${escapeHtml(brand.name)}<small>${escapeHtml(brand.englishName)}</small></span>
      </a>
      <nav aria-label="主导航">
        <a href="#about">游戏介绍</a>
        ${download.enabled ? '<a href="#download">获取游戏</a>' : ''}
        ${management}
      </nav>
    </header>
    <main id="top">
      <section class="gs-hero" aria-label="游戏主视觉轮播" aria-roledescription="轮播">
        ${slides}
        <div class="gs-hero-shade"></div>
        <div class="gs-hero-copy">
          <p class="gs-eyebrow gs-light-eyebrow"><span></span>${escapeHtml(hero.eyebrow)}</p>
          <h1>${lines(hero.title)}</h1>
          <p class="gs-hero-description">${escapeHtml(hero.subtitle)}</p>
          <div class="gs-hero-actions">
            ${download.enabled ? `<a class="gs-button gs-button-warm" href="#download">开启旅程 ${arrow}</a>` : ''}
            <a class="gs-text-link" href="#about">了解这个世界 <span>↘</span></a>
          </div>
        </div>
        <div class="gs-hero-bottom">
          <span class="gs-hero-label">EXPLORE THE UNKNOWN</span>
          <div class="gs-carousel-controls">
            <span class="gs-slide-number"><b data-current>01</b><span>/ ${String(hero.slides.length).padStart(2, '0')}</span></span>
            <div class="gs-dots">${dots}</div>
            <button class="gs-arrow gs-prev" data-prev aria-label="上一张">${arrow}</button>
            <button class="gs-arrow" data-next aria-label="下一张">${arrow}</button>
            <button class="gs-pause" data-pause aria-label="暂停自动轮播" aria-pressed="false">Ⅱ</button>
          </div>
        </div>
      </section>
      <section class="gs-about" id="about">
        <div class="gs-section-label"><span>01 — THE STORY</span><p>${escapeHtml(about.eyebrow)}</p></div>
        <div class="gs-about-content">
          <h2>${lines(about.title)}</h2>
          <div class="gs-about-body">${paragraphs}</div>
          <div class="gs-features">${features}</div>
        </div>
      </section>
      ${renderDownload(content)}
    </main>
    <footer class="gs-footer">
      <div class="gs-footer-brand">${mark}<span>${escapeHtml(brand.studio)}</span></div>
      <p>© ${new Date().getFullYear()} ${escapeHtml(brand.name)}${brand.contact ? ` · ${escapeHtml(brand.contact)}` : ''}</p>
      <a href="#top">回到顶部 ↑</a>
    </footer>
    <div class="gs-toast" role="status" aria-live="polite"></div>
  </div>`;
}

export function renderDocument(
  content,
  { preview = false, editorHref = '', assetBase, imageResolver } = {},
) {
  const prefix = assetBase || (preview ? '/site-assets/' : './');
  const body = renderSite(content, {
    staticAssets: !preview,
    editorLink: !!editorHref,
    editorHref,
    imageResolver,
  });

  return `<!doctype html>
<html lang="zh-CN" class="site-document">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="${escapeHtml(content.hero.subtitle)}">
    <meta name="theme-color" content="#102a2e">
    ${preview ? '<meta name="robots" content="noindex,nofollow">' : ''}
    <title>${escapeHtml(content.brand.name)} · 游戏官网</title>
    <link rel="icon" href="${preview ? `${prefix}../` : './'}favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="${prefix}site.css">
  </head>
  <body>
    ${body}
    <script type="module">
      import { mountSite } from '${prefix}site.js';
      mountSite(document.querySelector('.game-site'));
    </script>
  </body>
</html>`;
}
