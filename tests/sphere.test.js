import { test, eq, approx } from './harness.js';
import { STATES, stateFor, fibonacciSphere, latticeOf } from '../js/sphere.js';

test('stateFor maps sections to states, unknown → idle', () => {
  eq(['hero', 'numbers', 'gate', 'ledger', 'properties', 'footer', 'nope'].map(stateFor),
     ['idle', 'measured', 'gate', 'ledger', 'memory', 'idle', 'idle']);
});
test('every state names a colour token and the shader knobs', () => {
  for (const s of Object.values(STATES)) {
    eq(typeof s.color, 'string'); eq(s.color.startsWith('--'), true);
    for (const k of ['amp', 'order', 'x', 'breathe', 'dim']) eq(typeof s[k], 'number');
  }
});
test('fibonacciSphere points are unit length', () => {
  const p = fibonacciSphere(50); eq(p.length, 150);
  for (let i = 0; i < 50; i++) approx(Math.hypot(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]), 1, 1e-5);
});
test('latticeOf snaps to 1/k steps', () => eq([...latticeOf(new Float32Array([0.26, -0.9, 0.05]), 4)], [0.25, -1, 0]));
