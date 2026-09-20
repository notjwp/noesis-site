import { test, eq } from './harness.js';
import { displayedProgress, shouldBoot } from '../js/loader.js';

test('displayedProgress never runs ahead of the time floor', () => { eq(displayedProgress(100, 1300), 50); eq(displayedProgress(100, 0), 0); });
test('displayedProgress stalls at what has really loaded', () => { eq(displayedProgress(40, 2600), 40); eq(displayedProgress(40, 9999), 40); });
test('displayedProgress reaches 100 only when both agree', () => eq(displayedProgress(100, 2600), 100));
test('shouldBoot', () => {
  eq(shouldBoot({ reducedMotion: false, booted: false, forced: false }), true);
  eq(shouldBoot({ reducedMotion: true, booted: false, forced: false }), false);
  eq(shouldBoot({ reducedMotion: false, booted: true, forced: false }), false);
  eq(shouldBoot({ reducedMotion: true, booted: true, forced: true }), true);
});
