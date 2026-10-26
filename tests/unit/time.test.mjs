import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDay, activeClock, IDLE_CAP_MS } from '../../js/core/time.js';

test('le jour est celui du calendrier local', () => {
  const t = new Date(2026, 9, 13, 23, 30).getTime();   // 23 h 30, heure locale
  assert.equal(localDay(t), '2026-10-13');
  assert.equal(localDay(new Date(2026, 0, 5, 0, 5).getTime()), '2026-01-05');
});

test('le temps actif ne compte pas une tablette posée', () => {
  const t0 = 1_000_000;
  const clock = activeClock(t0);
  clock.tick(t0 + 10_000);                   // 10 s de jeu
  clock.tick(t0 + 10_000 + 3_600_000);       // une heure sans rien toucher
  assert.equal(clock.ms(t0 + 10_000 + 3_600_000), 10_000 + IDLE_CAP_MS);
  assert.equal(clock.ms(t0 + 10_000 + 3_600_000 + 5_000), 10_000 + IDLE_CAP_MS + 5_000);
});

test('une horloge qui recule ne retire jamais de temps', () => {
  const clock = activeClock(5_000);
  clock.tick(4_000);
  assert.equal(clock.ms(4_000), 0);
});

test('des relevés périodiques ne repoussent pas l’échéance d’inactivité', () => {
  const clock = activeClock(0);
  for (let t = 5_000; t <= 180_000; t += 5_000) clock.ms(t);
  assert.equal(clock.ms(180_000), 60_000);
});

test('la pause exclut l’arrière-plan et les intervalles ne sont consommés qu’une fois', () => {
  const clock = activeClock(0);
  clock.tick(10_000);
  clock.pause(15_000);
  clock.resume(3_600_000);
  assert.equal(clock.ms(3_605_000), 20_000);
  const intervals = clock.takeIntervals(3_605_000);
  assert.equal(intervals.reduce((sum, [a, b]) => sum + b - a, 0), 20_000);
  assert.deepEqual(clock.takeIntervals(3_605_000), []);
});
