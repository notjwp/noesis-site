export const results = [];

export function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, error: String(e) }); }
}

export function eq(actual, expected) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`expected ${b}, got ${a}`);
}

export function approx(actual, expected, eps = 1e-6) {
  if (Math.abs(actual - expected) > eps) throw new Error(`expected ~${expected}, got ${actual}`);
}
