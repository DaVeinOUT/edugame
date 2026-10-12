import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as DATA from '../../js/data/curriculum.js';
import { buildCurriculum } from '../../js/core/curriculum.js';
import { checkpoints, startPlacement, placementItem, recordPlacement, placementResult, STOP_AFTER } from '../../js/core/placement.js';
import { makeQuestion } from '../../js/core/questions.js';
import { seededRandom } from '../../js/core/rng.js';

const cur = buildCurriculum(DATA);
const last = cur.steps.length - 1;

/** Joue tout le test pour un enfant qui sait lire jusqu'à l'étape `knows`. */
function simulate(knows, seed = 1) {
  const rand = seededRandom(seed);
  let st = startPlacement(cur);
  let n = 0;
  while (!st.done) {
    const item = placementItem(st, cur, rand);
    const q = makeQuestion(item, cur, { rand, age: '10-12', open: st.points[st.i] });
    assert.ok(q.options.some(o => o.id === q.answer), 'la bonne réponse fait partie des choix');
    st = recordPlacement(st, { ok: item.step <= knows, key: item.key });
    n += 1;
    assert.ok(n < 60, 'le test doit finir');
  }
  return { result: placementResult(st, cur), n, st };
}

test('les paliers couvrent tout le chemin, du début à la dernière étape', () => {
  const pts = checkpoints(cur);
  assert.equal(pts[0], 0);
  assert.equal(pts[pts.length - 1], last);
  assert.ok(pts.length >= 10);
});

test('un enfant qui débute commence au début, après très peu de questions', () => {
  const { result, n } = simulate(-1);
  assert.equal(result.open, 0);
  assert.equal(n, STOP_AFTER * 2);
});

test('un enfant qui lit jusqu\'à l\'étape 25 commence juste avant', () => {
  const { result } = simulate(25);
  assert.ok(result.open >= 18 && result.open <= 25, `départ à ${result.open}`);
  assert.equal(result.all, false);
});

test('un enfant qui lit tout passe aux niveaux des grands', () => {
  const { result } = simulate(last);
  assert.equal(result.all, true);
  assert.equal(result.open, last);
});

test('l\'état n\'est jamais modifié en place', () => {
  const st = Object.freeze(startPlacement(cur));
  const next = recordPlacement(st, { ok: true, key: 'snd:a' });
  assert.notEqual(next, st);
  assert.equal(st.asked, 0);
});
