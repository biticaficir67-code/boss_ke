export function mountSite(root) {
  if (!root) return () => {};
  const cleanups = [];
  const on = (element, event, handler) => {
    element?.addEventListener(event, handler);
    if (element) cleanups.push(() => element.removeEventListener(event, handler));
  };
  const slides = [...root.querySelectorAll('[data-slide]')];
  const dots = [...root.querySelectorAll('[data-goto]')];
  const pauseButton = root.querySelector('[data-pause]');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = media.matches;
  let hovering = false;
  let focusing = false;
  let timer;
  let toastTimer;
  const updatePause = () => {
    if (!pauseButton) return;
    pauseButton.textContent = paused ? '▷' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', paused ? '开始自动轮播' : '暂停自动轮播');
    pauseButton.setAttribute('aria-pressed', String(paused));
  };
  const start = () => {
    clearInterval(timer);
    if (!paused && !hovering && !focusing && !document.hidden && slides.length > 1) {
      timer = setInterval(() => go(current + 1, false), Number(root.dataset.interval) || 5500);
    }
  };
  const go = (next, reset = true) => {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-pressed', String(i === current));
    });
    const counter = root.querySelector('[data-current]');
    if (counter) counter.textContent = String(current + 1).padStart(2, '0');
    if (reset) start();
  };
  dots.forEach((dot, i) => on(dot, 'click', () => go(i)));
  on(root.querySelector('[data-prev]'), 'click', () => go(current - 1));
  on(root.querySelector('[data-next]'), 'click', () => go(current + 1));
  on(pauseButton, 'click', () => {
    paused = !paused;
    updatePause();
    start();
  });
  const hero = root.querySelector('.gs-hero');
  on(hero, 'mouseenter', () => {
    hovering = true;
    start();
  });
  on(hero, 'mouseleave', () => {
    hovering = false;
    start();
  });
  on(hero, 'focusin', () => {
    focusing = true;
    start();
  });
  on(hero, 'focusout', (event) => {
    if (!hero.contains(event.relatedTarget)) {
      focusing = false;
      start();
    }
  });
  on(document, 'visibilitychange', start);
  on(media, 'change', () => {
    paused = media.matches;
    updatePause();
    start();
  });
  on(hero, 'keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(current + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current - 1);
    }
  });
  on(root.querySelector('[data-copy]'), 'click', async (event) => {
    const button = event.currentTarget;
    const toast = root.querySelector('.gs-toast');
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      toast.textContent = '提取码已复制';
    } catch {
      toast.textContent = `提取码：${button.dataset.copy}`;
    }
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  });
  updatePause();
  start();
  return () => {
    clearInterval(timer);
    clearTimeout(toastTimer);
    cleanups.forEach((cleanup) => cleanup());
  };
}
