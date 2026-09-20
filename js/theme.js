// Mirrors the inline <head> script in index.html, which must run before first paint.
export function resolveTheme(stored, prefersDark) {
  return stored === 'am' || stored === 'pm' ? stored : (prefersDark ? 'pm' : 'am');
}

export function initTheme() {
  const root = document.documentElement;
  const apply = theme => {
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-label]').forEach(el => { el.textContent = theme.toUpperCase(); });
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };
  apply(resolveTheme(root.dataset.theme, matchMedia('(prefers-color-scheme: dark)').matches));
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'pm' ? 'am' : 'pm';
    try { localStorage.setItem('noesis.theme', next); } catch {}
    apply(next);
  }));
}
