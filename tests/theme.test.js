import { test, eq } from './harness.js';
import { resolveTheme } from '../js/theme.js';

test('resolveTheme: stored value wins', () => { eq(resolveTheme('am', true), 'am'); eq(resolveTheme('pm', false), 'pm'); });
test('resolveTheme: falls back to the OS preference', () => { eq(resolveTheme(null, true), 'pm'); eq(resolveTheme('junk', false), 'am'); });
