import { test, eq } from './harness.js';
import { readout } from '../js/readouts.js';

test('readout writes to every matching element and nothing else', () => {
  const a = document.createElement('p'), b = document.createElement('p'), c = document.createElement('p');
  a.dataset.readout = 'x'; b.dataset.readout = 'x'; c.dataset.readout = 'y';
  document.body.append(a, b, c);
  readout('x', 'hello');
  eq([a.textContent, b.textContent, c.textContent], ['hello', 'hello', '']);
  a.remove(); b.remove(); c.remove();
});
