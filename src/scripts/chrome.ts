// Header behaviour and theme. Runs on every page.
const root = document.documentElement;
const bar = document.querySelector<HTMLElement>('.bar')!;
const narrow = matchMedia('(max-width: 820px)');

let lastY = scrollY;
let ticking = false;
function syncBar() {
  const y = scrollY;
  bar.classList.toggle('scrolled', y > 4);
  if (!narrow.matches) bar.classList.remove('hide');
  else if (Math.abs(y - lastY) > 4) bar.classList.toggle('hide', y > 140 && y > lastY && !document.querySelector('dialog[open]'));
  // sticky table headers sit under the bar, or at the top when the bar slides away
  root.style.setProperty('--stick', bar.classList.contains('hide') ? '0px' : `${bar.offsetHeight}px`);
  lastY = y;
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(syncBar); } }, { passive: true });
addEventListener('resize', syncBar);
syncBar();

document.querySelector('.skip')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('main')?.focus();
});

const meta = document.querySelector('meta[name="theme-color"]')!;
const paint = () => meta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
const isDark = () => (root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
const toggle = document.getElementById('theme')!;
toggle.addEventListener('click', () => {
  const t = isDark() ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = t;
    try { localStorage.setItem('st-theme', t); } catch {}
    paint();
  };
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();
  // the new theme spreads like ink from the button (CSS: hj-ink in global.css)
  const r = toggle.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  root.style.setProperty('--ink-x', `${x}px`);
  root.style.setProperty('--ink-y', `${y}px`);
  root.style.setProperty('--ink-r', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
  root.classList.add('theme-vt');
  document.startViewTransition(apply).finished.finally(() => root.classList.remove('theme-vt'));
});
paint();
