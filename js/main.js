/* Progressive enhancements: header shadow, scroll reveal, count-up, back-to-top.
   Everything degrades gracefully: with JS off, content is fully visible and counters show final values. */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasObserver = 'IntersectionObserver' in window;

  // Header gets a border/shadow once the page scrolls.
  const header = document.querySelector('[data-header]');
  const toTop = document.querySelector('[data-to-top]');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.hidden = y < 700;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      const main = document.getElementById('main');
      if (main) main.focus({ preventScroll: true });
    });
  }

  // Scroll reveal. Common layout pieces are tagged automatically so every page animates the same way;
  // grid children get a stagger (--i) and the two halves of a .split slide in from opposite sides.
  const AUTO = [
    '.section-head', '.grid > *', '.stats > *', '.steps > li', '.feature-list > li', '.chips > li',
    '.check-list > li', '.project-figures > *', '.cta-band', '.accordion', '.form-card',
    '.contact-grid > *', '.pagination', '.prose > *', '.split > *', '.mission', '.quick-contacts > *',
    '.footer-grid > *',
  ].join(',');
  document.querySelectorAll(`main ${AUTO.split(',').join(', main ')}, .footer-grid > *`).forEach((el) => {
    if (el.closest('.hero, .page-hero')) return;
    el.classList.add('reveal');
    const siblings = el.parentElement ? [...el.parentElement.children].filter((n) => n.nodeType === 1) : [];
    el.style.setProperty('--i', String(Math.min(siblings.indexOf(el), 8)));
    if (!el.dataset.anim) {
      if (el.matches('.stat, .cta-band')) el.dataset.anim = 'zoom';
      else if (el.parentElement && el.parentElement.matches('.split') && siblings.length === 2) el.dataset.anim = siblings.indexOf(el) === 0 ? 'left' : 'right';
    }
  });

  const reveals = document.querySelectorAll('.reveal');
  const settle = (el) => {
    // once shown, hand the element back to its normal CSS so hover effects respond instantly
    const done = () => {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--i');
      el.removeAttribute('data-anim');
    };
    el.addEventListener('transitionend', (e) => { if (e.propertyName === 'opacity') done(); }, { once: true });
    setTimeout(done, 2200);
  };
  if (hasObserver && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        settle(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Scroll progress bar and light parallax (skipped with reduced motion)
  if (!reduceMotion) {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--progress', max > 0 ? String(Math.min(window.scrollY / max, 1)) : '0');
      document.documentElement.style.setProperty('--py', String(Math.min(window.scrollY, 600) * 0.12));
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Count-up: <span data-count="80">80</span>
  const counters = document.querySelectorAll('[data-count]');
  if (hasObserver && !reduceMotion) {
    const animate = (el) => {
      const end = Number(el.dataset.count);
      if (!Number.isFinite(end)) return;
      const start = performance.now();
      const duration = 1200;
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => {
      el.textContent = '0';
      io.observe(el);
    });
  }
})();
