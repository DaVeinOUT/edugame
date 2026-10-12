import { test } from 'node:test';
import assert from 'node:assert/strict';
import { review, isDue, isMastered, strength, overdue, INTERVAL, BOX_MAX } from '../../js/core/srs.js';

const NOW = Date.UTC(2026, 9, 12, 9);
const DAY = 86400000;

test('un élément jamais vu est à voir', () => {
  assert.equal(isDue(undefined, NOW), true);
  assert.equal(strength(undefined), 0);
});

test('première réponse juste : boîte 2, revu plus tard', () => {
  const r = review(undefined, 'ok', NOW);
  assert.equal(r.b, 2);
  assert.equal(r.due, NOW + INTERVAL[2]);
  assert.equal(isDue(r, NOW), false);
  assert.deepEqual([r.s, r.k], [1, 1]);
});

test('une erreur ramène en boîte 1, à revoir tout de suite (sans sanction)', () => {
  let r = review(undefined, 'ok', NOW);
  r = review(r, 'ok', NOW + DAY);
  r = review(r, 'ko', NOW + 2 * DAY);
  assert.equal(r.b, 1);
  assert.equal(isDue(r, NOW + 2 * DAY), true);
});

test('l\'aide recule d\'une seule boîte', () => {
  let r = review(undefined, 'ok', NOW);   // 2
  r = review(r, 'ok', NOW + DAY);         // 3
  r = review(r, 'help', NOW + 2 * DAY);   // 2
  assert.equal(r.b, 2);
});

test('maîtrise à partir de la boîte 4, boîte 5 confirmée = 3 semaines', () => {
  let r;
  let t = NOW;
  for (let i = 0; i < 6; i++) { r = review(r, 'ok', t); t = r.due; }
  assert.equal(r.b, BOX_MAX);
  assert.equal(isMastered(r), true);
  assert.ok(r.due - r.last >= 21 * DAY);
});

test('le retard se mesure pour prioriser les révisions', () => {
  const r = review(undefined, 'ok', NOW);
  assert.equal(overdue(r, NOW), 0);
  assert.ok(overdue(r, NOW + DAY) > 0);
});

test('review ne modifie pas l\'enregistrement reçu', () => {
  const r = Object.freeze(review(undefined, 'ok', NOW));
  const r2 = review(r, 'ok', NOW + DAY);
  assert.notEqual(r2, r);
  assert.equal(r.b, 2);
});
