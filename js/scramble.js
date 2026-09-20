const GLYPHS = '█▓▒░<>/\\|=+-*#@%ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// One frame of the effect: the first `progress` share of `target` resolved, the rest random
// glyphs. Whitespace is never replaced, so mono layouts keep their columns while scrambling.
export function scrambleFrame(target, progress, rand = Math.random) {
  const resolved = Math.floor(progress * target.length);
  let out = '';
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    out += (i < resolved || /\s/.test(ch)) ? ch : GLYPHS[Math.floor(rand() * GLYPHS.length)];
  }
  return out;
}

// Scramble `el`'s text into place over `duration` ms. The final text is kept in
// `el.dataset.text` on first use so the effect can replay. Reduced motion: set it at once.
export function scramble(el, { duration = 800 } = {}) {
  const target = el.dataset.text ?? (el.dataset.text = el.textContent);
  if (reducedMotion()) { el.textContent = target; return Promise.resolve(); }
  return new Promise(resolve => {
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = scrambleFrame(target, p);
      if (p < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}
