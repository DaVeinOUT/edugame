import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, seededRandom, sample, pick, weightedPick } from '../../js/core/rng.js';

test('shuffle renvoie une nouvelle liste avec les mêmes éléments', () => {
  const src = Object.freeze([1, 2, 3, 4, 5]);
  const out = shuffle(src, seededRandom(1));
  assert.notEqual(out, src);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});

test('la graine rend le tirage reproductible', () => {
  const a = shuffle([...'abcdefgh'], seededRandom(42)).join('');
  const b = shuffle([...'abcdefgh'], seededRandom(42)).join('');
  assert.equal(a, b);
});

test('Fisher-Yates est uniforme (chaque position équiprobable)', () => {
  const rand = seededRandom(7);
  const counts = [0, 0, 0];
  for (let i = 0; i < 30000; i++) counts[shuffle(['x', 'y', 'z'], rand).indexOf('x')]++;
  counts.forEach(c => assert.ok(Math.abs(c - 10000) < 400, `position déséquilibrée : ${counts}`));
});

test('sample, pick et weightedPick', () => {
  const rand = seededRandom(3);
  assert.equal(sample([1, 2, 3], 2, rand).length, 2);
  assert.equal(pick([], rand), undefined);
  let heavy = 0;
  for (let i = 0; i < 2000; i++) if (weightedPick(['a', 'b'], x => (x === 'a' ? 9 : 1), rand) === 'a') heavy++;
  assert.ok(heavy > 1650 && heavy < 1950, `poids non respecté : ${heavy}`);
  assert.ok(['a', 'b'].includes(weightedPick(['a', 'b'], () => 0, rand)), 'poids nuls : tirage uniforme');
});
