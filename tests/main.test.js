import { test, eq } from './harness.js';
import { cellSize } from '../js/main.js';

test('cellSize floors to whole pixels and centres the remainder', () => {
  eq(cellSize(1437, 20), { cell: 71, offset: 8 });   // 1437 - 1420 = 17 → 8 left
  eq(cellSize(400, 8), { cell: 50, offset: 0 });
});
