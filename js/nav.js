/* Mobile menu + services dropdown. Keyboard: Esc closes, buttons toggle, links remain real links. */
(() => {
  'use strict';
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const toggle = header.querySelector('.nav-toggle');
  const desktop = window.matchMedia('(min-width: 1024px)');
  const subs = [...header.querySelectorAll('.has-sub')];

  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-locked', open && !desktop.matches);
  };

  const setSub = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.sub-toggle').setAttribute('aria-expanded', String(open));
  };

  const closeAll = () => {
    setOpen(false);
    subs.forEach((item) => setSub(item, false));
  };

  toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));

  subs.forEach((item) => {
    item.querySelector('.sub-toggle').addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      subs.forEach((other) => setSub(other, other === item && willOpen));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const wasOpen = header.classList.contains('is-open') || subs.some((i) => i.classList.contains('is-open'));
    closeAll();
    if (wasOpen && !desktop.matches) toggle.focus();
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeAll();
  });

  desktop.addEventListener('change', closeAll);
})();
