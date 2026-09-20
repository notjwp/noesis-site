import { scramble } from './scramble.js';

// What the bar shows: never ahead of the time floor (so it reads as a sequence, not a jump),
// never ahead of what has really loaded (so a slow network shows as a stall, not a lie).
export function displayedProgress(real, elapsedMs, floorMs = 2600) {
  const floor = Math.min(100, (elapsedMs / floorMs) * 100);
  return Math.max(0, Math.min(real, floor));
}

// Twin of the inline <head> script in index.html, which must run before first paint.
export function shouldBoot({ reducedMotion, booted, forced }) { return Boolean(forced || (!reducedMotion && !booted)); }

function typeDots(el, count = 16) {
  return new Promise(resolve => {
    let n = 0, last = 0;
    const tick = now => {
      if (now - last > 60) { el.textContent = '.'.repeat(++n); last = now; }
      if (n < count) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}

// milestones: [[promise, weight], …] summing to 90; the last 10 belong to the time floor.
export async function runLoader({ milestones = [], floorMs = 2600, capMs = 6000 } = {}) {
  const el = document.getElementById('boot');
  if (!el) return;
  const fill = el.querySelector('[data-boot-fill]'), pct = el.querySelector('[data-boot-pct]'), skipBtn = el.querySelector('[data-boot-skip]');
  let real = 10, done = false;
  milestones.forEach(([p, w]) => Promise.resolve(p).then(() => { real += w; }, () => { real += w; }));
  const skip = () => { done = true; };
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') skip(); };
  skipBtn.addEventListener('click', skip); addEventListener('keydown', onKey); skipBtn.focus();

  scramble(el.querySelector('[data-boot-mark]'), { duration: 1200 });
  typeDots(el.querySelector('[data-boot-dots]')).then(() => scramble(el.querySelector('[data-boot-ok]'), { duration: 300 }));

  const start = performance.now();
  await new Promise(resolve => {
    const tick = now => {
      const elapsed = now - start, shown = displayedProgress(real, elapsed, floorMs);
      fill.style.width = `${shown}%`; pct.textContent = `${Math.round(shown)}%`;
      if (done || shown >= 100 || elapsed >= capMs) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  removeEventListener('keydown', onKey);
  try { sessionStorage.setItem('noesis.booted', '1'); } catch {}
  el.dataset.exit = '';
  await new Promise(r => {
    const onEnd = e => { if (e.target === el && e.propertyName === 'opacity') { el.removeEventListener('transitionend', onEnd); r(); } };
    el.addEventListener('transitionend', onEnd);
    setTimeout(r, 1500);                                 // safety if transitions are disabled
  });
  el.remove();
}
