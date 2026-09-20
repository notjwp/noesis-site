import { test, eq, approx } from './harness.js';

test('harness: eq passes on deep-equal values', () => eq({ a: [1, 2] }, { a: [1, 2] }));
test('harness: approx tolerates float noise', () => approx(0.1 + 0.2, 0.3));
test('harness: eq throws with a readable message', () => {
  let msg = '';
  try { eq(1, 2); } catch (e) { msg = e.message; }
  eq(msg, 'expected 2, got 1');
});
