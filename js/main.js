import { initTheme } from './theme.js';
import { initInstall } from './install.js';
import { initReveal, revealHeader } from './reveal.js';
import { runLoader } from './loader.js';
import { readout } from './readouts.js';

export function cellSize(clientWidth, cols) {
  const cell = Math.floor(clientWidth / cols);
  return { cell, offset: Math.floor((clientWidth - cell * cols) / 2) };
}

function applyGrid() {
  const root = document.documentElement;
  const cols = parseInt(getComputedStyle(root).getPropertyValue('--cols'), 10);
  const { cell, offset } = cellSize(root.clientWidth, cols);
  root.style.setProperty('--cell', `${cell}px`);
  root.style.setProperty('--grid-x', `${offset}px`);
}

function trackScroll() {
  const root = document.documentElement;
  const update = () => {
    const max = root.scrollHeight - root.clientHeight;
    const p = max > 0 ? (root.scrollTop / max).toFixed(4) : '0';
    root.style.setProperty('--scroll', p);
    readout('scroll', `scroll: ${p}`);
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

function menu() {
  const btn = document.querySelector('[data-menu]'), nav = document.getElementById('menu');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { nav.hidden = !nav.hidden; btn.setAttribute('aria-expanded', String(!nav.hidden)); });
  nav.addEventListener('click', () => { nav.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
}

// Boot order: theme → grid → install → (loader, while the sphere module loads) → live → reveal.
(async () => {
  if (typeof document === 'undefined' || !document.querySelector('.frame')) return;
  const root = document.documentElement;
  initTheme();
  initInstall();
  applyGrid();
  addEventListener('resize', applyGrid);
  trackScroll();
  menu();

  const sphereReady = import('./sphere.js').then(m => {
    const s = m.mountSphere(document.getElementById('sphere')); window.__sphere = s; return s;
  });
  if (root.dataset.state === 'booting') {
    await runLoader({ milestones: [[document.fonts.ready, 30], [sphereReady, 30], [sphereReady.then(s => s.ready), 30]] });
  }
  root.dataset.state = 'live';
  initReveal();
  revealHeader();
  document.querySelector('[data-install-command]')?.focus({ preventScroll: true });

  const sphere = await sphereReady;
  const { stateFor } = await import('./sphere.js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const points = matchMedia('(max-width: 767px)').matches ? '7,000' : '14,000';
  let fps = 0;
  const sphereReadout = () => readout('sphere', sphere.unavailable ? 'sphere: webgl unavailable'
    : `sphere: ${sphere.state} · ${points} pts · ${reduced ? 'static' : `${fps} fps`}`);

  // A band across the middle of the viewport: the section crossing it owns the sphere.
  const sections = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { sphere.setState(stateFor(e.target.id)); sphereReadout(); } });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  document.querySelectorAll('.section[id]').forEach(s => sections.observe(s));
  sphereReadout();

  // a coarse frame counter, only while something is animating
  if (!reduced && !sphere.unavailable) {
    let frames = 0, at = performance.now();
    const tick = now => {
      frames++;
      if (now - at >= 1000) { fps = frames; frames = 0; at = now; sphereReadout(); }
      if (!document.hidden) requestAnimationFrame(tick);
      else document.addEventListener('visibilitychange', () => { at = performance.now(); frames = 0; requestAnimationFrame(tick); }, { once: true });
    };
    requestAnimationFrame(tick);
  }

  // hovering a ledger row tints the sphere by its verdict
  document.querySelectorAll('#ledger .row').forEach(row => {
    const token = { kept: '--accent', reverted: '--refuse' }[row.dataset.kind] ?? null;
    row.addEventListener('pointerenter', () => sphere.tint(token));
    row.addEventListener('pointerleave', () => sphere.tint(null));
  });

  // the hovered cell prints its live clip-path (the inset border drawing in)
  document.querySelectorAll('.cell').forEach(cell => cell.addEventListener('pointermove', () => {
    readout('cell', `clip-path: ${getComputedStyle(cell, '::after').clipPath}`);
  }, { passive: true }));
})();
