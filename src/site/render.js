// 所有可编辑文字均先转义；官网、后台预览和 ZIP 共用这份模板。
export const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const lines = (value) => escapeHtml(value).replace(/\n/g, '<br>');
const arrow =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const paw =
  '<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><ellipse cx="9" cy="15" rx="4" ry="5.5" transform="rotate(-25 9 15)"/><ellipse cx="17" cy="9" rx="4" ry="5.5" transform="rotate(-8 17 9)"/><ellipse cx="26" cy="10" rx="4" ry="5.5" transform="rotate(15 26 10)"/><ellipse cx="33" cy="17" rx="3.6" ry="5" transform="rotate(30 33 17)"/><path d="M10 29c0-5 6-12 11-12s11 7 11 12c0 7-7 5-11 4-4 1-11 3-11-4Z"/></svg>';
const number = (index) => String(index + 1).padStart(2, '0');

function renderDownload({ brand, download }) {
  if (!download.enabled) return '';
  const url = /^https:\/\//i.test(download.url) ? download.url : '';
  const button = url
    ? `<a class="gs-button gs-button-dark" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(download.buttonText)} ${arrow}</a>`
    : '<button class="gs-button gs-button-dark" disabled>下载即将开放 <span aria-hidden="true">↗</span></button>';
  const extraction =
    download.extractionCode && url
      ? `<button class="gs-extraction" data-copy="${escapeHtml(download.extractionCode)}">提取码：${escapeHtml(download.extractionCode)} <span>复制</span></button>`
      : '';
  const details = [
    ['当前版本', download.version],
    ['支持平台', download.platform],
    ['文件大小', download.fileSize],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');
  return `
    <section class="gs-download" id="download" aria-labelledby="download-title">
      <div class="gs-download-paw" aria-hidden="true">${paw}</div>
      <div class="gs-download-copy">
        <p class="gs-eyebrow"><span>03</span> 下一站，故事里见</p>
        <h2 id="download-title">${lines(download.title)}</h2>
        ${download.description ? `<p class="gs-download-description">${escapeHtml(download.description)}</p>` : ''}
      </div>
      <div class="gs-download-card">
        <div class="gs-version"><span class="gs-status-dot"></span>${url ? '现已开放下载' : '期待与你相遇'}</div>
        <h3>${escapeHtml(brand.name)}</h3>
        <dl>${details}</dl>
        ${button}${extraction}
      </div>
    </section>`;
}

function renderGallery(slides, imagePath) {
  if (slides.length < 2) return '';
  return `
    <section class="gs-gallery" id="gallery" aria-labelledby="gallery-title">
      <div class="gs-gallery-heading">
        <div><p class="gs-eyebrow"><span>02</span> 旅途拾光</p><h2 id="gallery-title">把相遇，留在画面里。</h2></div>
        <span class="gs-gallery-count">${String(slides.length).padStart(2, '0')} 帧 / 雾海印象</span>
      </div>
      <div class="gs-gallery-grid">${slides
        .map(
          (slide, index) => `
        <button class="gs-gallery-item" data-gallery="${index}" aria-label="放大查看：${escapeHtml(slide.alt || `画面 ${index + 1}`)}">
          <span class="gs-gallery-image"><img src="${escapeHtml(imagePath(slide.src))}" alt="${escapeHtml(slide.alt)}" loading="lazy"><span class="gs-gallery-zoom" aria-hidden="true">↗</span></span>
          <span class="gs-gallery-caption"><span>${escapeHtml(slide.caption || slide.alt || `画面 ${number(index)}`)}</span><i>${number(index)}</i></span>
        </button>`,
        )
        .join('')}
      </div>
    </section>
    <dialog class="gs-lightbox" aria-label="画面浏览" data-lightbox>
      <div class="gs-lightbox-toolbar"><span data-lightbox-count></span><button type="button" data-lightbox-close aria-label="关闭大图" autofocus>关闭 <span aria-hidden="true">×</span></button></div>
      <div class="gs-lightbox-stage"><button type="button" data-lightbox-prev aria-label="上一张大图">←</button><figure><img data-lightbox-image alt=""><figcaption data-lightbox-caption></figcaption></figure><button type="button" data-lightbox-next aria-label="下一张大图">→</button></div>
    </dialog>`;
}

export function renderSite(
  content,
  { staticAssets = false, editorLink = true, editorHref = '/admin/', imageResolver } = {},
) {
  const { brand, hero, about, download } = content;
  const imagePath = (src) =>
    imageResolver ? imageResolver(src) : staticAssets ? `./assets/${src.split('/').pop()}` : src;
  const slides = hero.slides
    .map(
      (slide, index) => `
    <figure class="gs-slide${index === 0 ? ' is-active' : ''}" data-slide="${index}" aria-hidden="${index !== 0}">
      <img src="${escapeHtml(imagePath(slide.src))}" alt="${escapeHtml(slide.alt)}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}>
      ${slide.caption ? `<figcaption>${escapeHtml(slide.caption)}</figcaption>` : ''}
    </figure>`,
    )
    .join('');
  const dots = hero.slides
    .map(
      (slide, index) => `
    <button class="gs-dot${index === 0 ? ' is-active' : ''}" data-goto="${index}" aria-label="查看第 ${index + 1} 张图片" aria-pressed="${index === 0}"><img src="${escapeHtml(imagePath(slide.src))}" alt="" loading="lazy"><span>${number(index)}</span></button>`,
    )
    .join('');
  const paragraphs = about.body
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((text) => `<p>${lines(text)}</p>`)
    .join('');
  const features = about.features
    .filter(Boolean)
    .map((text) => `<span>${paw}${escapeHtml(text)}</span>`)
    .join('');
  return `
  <div class="game-site" data-interval="${hero.interval}">
    <a class="gs-skip" href="#about">跳转到游戏介绍</a>
    <header class="gs-header">
      <a class="gs-brand" href="#top" aria-label="${escapeHtml(brand.name)}首页"><span class="gs-brand-mark">${paw}</span><span>${escapeHtml(brand.name)}${brand.englishName ? `<small>${escapeHtml(brand.englishName)}</small>` : ''}</span></a>
      <nav aria-label="主导航"><a href="#about">关于游戏</a>${hero.slides.length > 1 ? '<a href="#gallery">画廊</a>' : ''}${download.enabled ? '<a class="gs-nav-download" href="#download">获取游戏 <span aria-hidden="true">↗</span></a>' : ''}</nav>
    </header>
    <main id="top">
      <section class="gs-hero" aria-label="游戏主视觉轮播" aria-roledescription="轮播">
        <div class="gs-slides">${slides}</div>
        <div class="gs-hero-shade" aria-hidden="true"></div>
        <div class="gs-hero-copy">
          ${hero.eyebrow ? `<p class="gs-eyebrow gs-light-eyebrow"><span class="gs-tiny-paw">${paw}</span>${escapeHtml(hero.eyebrow)}</p>` : ''}
          <h1>${lines(hero.title)}</h1>
          ${hero.subtitle ? `<p class="gs-hero-description">${escapeHtml(hero.subtitle)}</p>` : ''}
          <div class="gs-hero-actions">${download.enabled ? `<a class="gs-button gs-button-warm" href="#download">${escapeHtml(download.buttonText)} ${arrow}</a>` : ''}<a class="gs-text-link" href="#about">认识这个世界 <span aria-hidden="true">↘</span></a></div>
        </div>
        <div class="gs-hero-bottom">
          <div class="gs-hero-signature"><span aria-hidden="true">✳</span> 每一份不同，都值得被温柔以待。</div>
          <div class="gs-carousel-controls"><span class="gs-slide-number"><b data-current>01</b><span>/ ${String(hero.slides.length).padStart(2, '0')}</span></span><button class="gs-arrow gs-prev" data-prev aria-label="上一张">${arrow}</button><button class="gs-arrow" data-next aria-label="下一张">${arrow}</button><button class="gs-pause" data-pause aria-label="暂停自动轮播" aria-pressed="false">Ⅱ</button></div>
        </div>
      </section>
      <div class="gs-filmstrip" aria-label="选择轮播画面"><span class="gs-filmstrip-label">${escapeHtml(brand.name)} <span aria-hidden="true">/</span> 光影手记</span><div class="gs-dots">${dots}</div><a class="gs-scroll-link" href="#about">向下探索 ↓</a></div>
      <section class="gs-about" id="about" aria-labelledby="about-title">
        <div class="gs-section-label"><p class="gs-eyebrow"><span>01</span> ${escapeHtml(about.eyebrow)}</p><div class="gs-about-seal" aria-hidden="true">${paw}<span>相遇 · 同行 · 回响</span></div></div>
        <div class="gs-about-content"><h2 id="about-title">${lines(about.title)}</h2><div class="gs-about-body">${paragraphs}</div>${features ? `<div class="gs-features">${features}</div>` : ''}</div>
      </section>
      ${renderGallery(hero.slides, imagePath)}
      ${renderDownload(content)}
    </main>
    <footer class="gs-footer"><div class="gs-footer-brand">${paw}<span>${escapeHtml(brand.studio)}</span></div><p>© ${new Date().getFullYear()} ${escapeHtml(brand.name)}${brand.contact ? ` · ${escapeHtml(brand.contact)}` : ''}</p><div class="gs-footer-links">${editorLink ? `<a class="gs-admin-link" href="${escapeHtml(editorHref)}">内容管理 ↗</a>` : ''}<a href="#top">回到顶部 ↑</a></div></footer>
    <div class="gs-toast" role="status" aria-live="polite"></div>
  </div>`;
}

export function renderDocument(
  content,
  { preview = false, editorHref = '', assetBase, imageResolver } = {},
) {
  const prefix = assetBase || (preview ? '/site-assets/' : './');
  return `<!doctype html>
<html lang="zh-CN" class="site-document">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="${escapeHtml(content.hero.subtitle)}">
    <meta name="theme-color" content="#172f2b">
    ${preview ? '<meta name="robots" content="noindex,nofollow">' : ''}
    <title>${escapeHtml(content.brand.name)} · 游戏官网</title>
    <link rel="icon" href="${preview ? `${prefix}../` : './'}favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="${prefix}site.css">
  </head>
  <body>
    ${renderSite(content, { staticAssets: !preview, editorLink: !!editorHref, editorHref, imageResolver })}
    <script type="module">
      import { mountSite } from '${prefix}site.js';
      mountSite(document.querySelector('.game-site'));
    </script>
  </body>
</html>`;
}
