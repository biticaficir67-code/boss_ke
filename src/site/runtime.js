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
  // 氛围开关仅控制轻微雾层运动，不播放声音、不制造闪屏。
  const effectsButton = root.querySelector('[data-effects-toggle]');
  let effects = !media.matches;
  try {
    effects = !media.matches && localStorage.getItem('unknown-mail-effects') !== 'off';
  } catch {
    /* 禁用存储仍可使用。 */
  }
  const setEffects = (enabled, remember = false) => {
    effects = enabled;
    root.dataset.effects = enabled ? 'on' : 'off';
    effectsButton?.setAttribute('aria-pressed', String(enabled));
    if (effectsButton) effectsButton.querySelector('span').textContent = enabled ? '开' : '关';
    if (remember)
      try {
        localStorage.setItem('unknown-mail-effects', enabled ? 'on' : 'off');
      } catch {
        /* 使用内存状态。 */
      }
  };
  setEffects(effects);
  on(effectsButton, 'click', () => setEffects(!effects, true));

  const menu = root.querySelector('[data-menu]');
  const navigation = root.querySelector('#site-navigation');
  const setMenu = (open) => {
    root.classList.toggle('is-menu-open', open);
    menu?.setAttribute('aria-expanded', String(open));
  };
  on(menu, 'click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  on(navigation, 'click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-menu-open')) {
      setMenu(false);
      menu.focus();
    }
  });
  on(document, 'click', (event) => {
    if (
      root.classList.contains('is-menu-open') &&
      !root.querySelector('.gs-header').contains(event.target)
    )
      setMenu(false);
  });
  const tabs = [...root.querySelectorAll('[data-character]')];
  const panels = [...root.querySelectorAll('[data-character-panel]')];
  const selectCharacter = (index) => {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };
  tabs.forEach((tab, index) => {
    on(tab, 'click', () => selectCharacter(index));
    on(tab, 'keydown', (event) => {
      const destination =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : event.key === 'ArrowRight'
              ? (index + 1) % tabs.length
              : event.key === 'ArrowLeft'
                ? (index - 1 + tabs.length) % tabs.length
                : -1;
      if (destination < 0) return;
      event.preventDefault();
      selectCharacter(destination);
      tabs[destination].focus();
    });
  });
  const navLinks = [...root.querySelectorAll('[data-nav]')];
  const sections = navLinks.map((link) => root.querySelector(`#${link.dataset.nav}`));
  let scrollFrame;
  const updatePosition = () => {
    scrollFrame = null;
    let active = -1;
    sections.forEach((section, i) => {
      if (section?.getBoundingClientRect().top <= 165) active = i;
    });
    navLinks.forEach((link, i) => {
      if (i === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const progress = root.querySelector('[data-progress]');
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    if (progress)
      progress.style.width = `${distance > 0 ? Math.max(0, Math.min(100, (window.scrollY / distance) * 100)) : 0}%`;
  };
  const schedulePosition = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updatePosition);
  };
  on(window, 'scroll', schedulePosition);
  on(window, 'resize', schedulePosition);
  updatePosition();
  let current = 0;
  let paused = media.matches;
  let hovering = false;
  let focusing = false;
  let timer;
  let toastTimer;
  let viewing = false;
  const updatePause = () => {
    if (!pauseButton) return;
    pauseButton.textContent = paused ? '▷' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', paused ? '开始自动轮播' : '暂停自动轮播');
    pauseButton.setAttribute('aria-pressed', String(paused));
  };
  const start = () => {
    clearInterval(timer);
    if (!paused && !hovering && !focusing && !viewing && !document.hidden && slides.length > 1) {
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
    if (media.matches) setEffects(false);
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
  // 画廊直接复用轮播图片；无须额外数据接口或图片服务。
  const gallery = [...root.querySelectorAll('[data-gallery]')];
  const lightbox = root.querySelector('[data-lightbox]');
  let selected = 0;
  let previousOverflow;
  const showImage = (index) => {
    selected = (index + gallery.length) % gallery.length;
    const source = gallery[selected].querySelector('img');
    const image = lightbox.querySelector('[data-lightbox-image]');
    image.src = source.src;
    image.alt = source.alt;
    lightbox.querySelector('[data-lightbox-count]').textContent =
      `${String(selected + 1).padStart(2, '0')} / ${String(gallery.length).padStart(2, '0')}`;
    lightbox.querySelector('[data-lightbox-caption]').textContent = gallery[selected].querySelector(
      '.gs-gallery-caption > span',
    ).textContent;
  };
  gallery.forEach((button, index) =>
    on(button, 'click', () => {
      showImage(index);
      previousOverflow = document.body.style.overflow;
      lightbox.showModal();
      viewing = true;
      document.body.style.overflow = 'hidden';
      start();
    }),
  );
  on(root.querySelector('[data-lightbox-close]'), 'click', () => lightbox.close());
  on(root.querySelector('[data-lightbox-prev]'), 'click', () => showImage(selected - 1));
  on(root.querySelector('[data-lightbox-next]'), 'click', () => showImage(selected + 1));
  on(lightbox, 'click', (event) => {
    if (event.target !== lightbox) return;
    const rect = lightbox.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      lightbox.close();
  });
  on(lightbox, 'keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showImage(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  on(lightbox, 'close', () => {
    document.body.style.overflow = previousOverflow || '';
    viewing = false;
    start();
  });
  // 横向轻扫切换主视觉，纵向滚动仍由浏览器处理。
  let touch;
  on(hero, 'touchstart', (event) => {
    const point = event.touches[0];
    touch = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
  });
  on(hero, 'touchend', (event) => {
    if (!touch) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
    touch = null;
  });
  on(hero, 'touchcancel', () => {
    touch = null;
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
    cancelAnimationFrame(scrollFrame);
    if (viewing) {
      lightbox.close();
      document.body.style.overflow = previousOverflow || '';
    }
    clearInterval(timer);
    clearTimeout(toastTimer);
    cleanups.forEach((cleanup) => cleanup());
  };
}
