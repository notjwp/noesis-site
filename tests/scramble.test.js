import { test, eq } from './harness.js';
import { scrambleFrame } from '../js/scramble.js';

const zero = () => 0;   // always the first glyph, '█'
test('scrambleFrame at progress 1 is the target', () => eq(scrambleFrame('ab cd', 1), 'ab cd'));
test('scrambleFrame at progress 0 keeps whitespace and length', () => eq(scrambleFrame('ab cd\nef', 0, zero), '██ ██\n██'));
test('scrambleFrame resolves left to right', () => eq(scrambleFrame('abcd', 0.5, zero), 'ab██'));
