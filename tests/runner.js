import { results } from './harness.js';

// One entry per module. Later tasks append here.
const MODULES = ['./harness.test.js', './main.test.js', './theme.test.js', './install.test.js', './scramble.test.js', './sphere.test.js', './loader.test.js', './readouts.test.js'];

for (const m of MODULES) {
  try { await import(m); }
  catch (e) { results.push({ name: m, ok: false, error: String(e) }); }
}

window.__results = results;
const failing = results.filter(r => !r.ok).length;
document.getElementById('out').textContent =
  results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.error ? `\n      ${r.error}` : ''}`).join('\n')
  + `\n\n${failing} failing of ${results.length}`;
