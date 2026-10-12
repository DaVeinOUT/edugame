import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as DATA from '../../js/data/curriculum.js';
import { buildCurriculum } from '../../js/core/curriculum.js';
import { makeQuestion } from '../../js/core/questions.js';
import { planLesson, planPractice, applyAnswer, finishSession, startSession, starsFor } from '../../js/core/session.js';
import { selectItems } from '../../js/core/select.js';
import { newProfile } from '../../js/core/schema.js';
import { seededRandom } from '../../js/core/rng.js';

const cur = buildCurriculum(DATA);
const NOW = Date.UTC(2026, 9, 12, 9);

test('chaque étape propose une leçon complète et jouable', () => {
  const p = newProfile({ age: '7-9' }, NOW, seededRandom(1));
  for (const s of cur.steps) {
    const rand = seededRandom(100 + s.index);
    const plan = planLesson(cur, { ...p, path: { ...p.path, open: s.index } }, s.index, { rand, now: NOW });
    assert.ok(plan.length >= 10, `leçon trop courte à l'étape ${s.id} : ${plan.length}`);
    for (const item of plan) {
      const q = makeQuestion(item, cur, { rand, age: '7-9', open: s.index });
      const ids = q.options.map(o => o.id);
      assert.equal(new Set(ids).size, ids.length, `choix en double (${s.id}, ${item.kind})`);
      if (item.kind === 'build') {
        assert.deepEqual([...q.tiles].sort(), [...q.tiles].sort());
        for (const g of q.answer.split('|')) assert.ok(q.tiles.includes(g), `tuile manquante ${g}`);
      } else {
        assert.ok(ids.includes(q.answer), `la bonne réponse manque (${s.id}, ${item.kind})`);
      }
      assert.ok(Number.isFinite(q.d) && q.guess > 0 && q.guess < 1);
    }
  }
});

test('la leçon va de l\'oreille vers l\'écrit', () => {
  const p = newProfile({}, NOW);
  const plan = planLesson(cur, p, cur.stepById('t').index, { rand: seededRandom(5), now: NOW });
  const order = ['listen', 'sound', 'syllable', 'read', 'build', 'sentence'];
  const ranks = plan.map(i => order.indexOf(i.kind));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test('une réponse renvoie un NOUVEAU profil, mis à jour', () => {
  const p = Object.freeze(newProfile({}, NOW));
  const q = { key: 'snd:a', d: -3.4, guess: 0.5 };
  const p2 = applyAnswer(p, q, { outcome: 'ok' }, NOW);
  assert.notEqual(p2, p);
  assert.equal(p.stats.answers, 0);
  assert.equal(p2.stats.answers, 1);
  assert.equal(p2.wallet, 1);
  assert.equal(p2.mem['snd:a'].b, 2);
  const p3 = applyAnswer(p2, { key: 'snd:b', d: -2, guess: 1 / 3 }, { outcome: 'ko', confusion: 'b/d' }, NOW);
  assert.equal(p3.stats.confusions['b/d'], 1);
  assert.equal(p3.wallet, 1, 'une erreur ne retire jamais d\'étoile');
});

test('bilan : étoiles, déblocage, cartes méritées', () => {
  let p = startSession(newProfile({}, NOW), NOW);
  const results = Array.from({ length: 10 }, () => ({ outcome: 'ok' }));
  const { profile, report } = finishSession(p, { kind: 'lesson', step: 0, results, seconds: 300 }, cur, NOW);
  assert.equal(report.stars, 3);
  assert.equal(report.unlocked, true);
  assert.equal(profile.path.open, 1);
  assert.ok(report.cards.includes('r_first'));
  assert.ok(report.cards.includes('son-a'));
  assert.ok(report.cards.includes('e_perfect'));
  assert.ok(report.elo.after >= report.elo.before);
  p = profile;
  const again = finishSession(p, { kind: 'lesson', step: 0, results, seconds: 60 }, cur, NOW + 1000);
  assert.ok(!again.report.cards.includes('son-a'), 'une carte ne se gagne qu\'une fois');
});

test('on ne bloque jamais un enfant : deux essais ouvrent la suite', () => {
  const p = newProfile({}, NOW);
  const bad = Array.from({ length: 10 }, (_, i) => ({ outcome: i < 3 ? 'ok' : 'ko' }));
  const r1 = finishSession(p, { kind: 'lesson', step: 0, results: bad }, cur, NOW);
  assert.equal(r1.report.unlocked, false);
  assert.equal(r1.profile.path.open, 0);
  const r2 = finishSession(r1.profile, { kind: 'lesson', step: 0, results: bad }, cur, NOW + 1);
  assert.equal(r2.report.unlocked, true);
  const good = Array.from({ length: 10 }, () => ({ outcome: 'ok' }));
  const r3 = finishSession(r2.profile, { kind: 'lesson', step: 0, results: good }, cur, NOW + 2);
  assert.ok(r3.report.cards.includes('e_persist'), 'persévérer après un échec est récompensé');
});

test('les étoiles suivent la précision', () => {
  assert.deepEqual([starsFor(1), starsFor(0.85), starsFor(0.6), starsFor(0.3)], [3, 2, 1, 0]);
});

test('l\'entraînement privilégie ce qui est à réviser', () => {
  const p = { ...newProfile({ age: '7-9' }, NOW), path: { open: 20, stars: {}, tries: {} } };
  const plan = planPractice(cur, p, { rand: seededRandom(9), now: NOW, n: 12 });
  assert.equal(plan.length, 12);
  // Un élément raté (boîte 1, dû) doit sortir bien plus souvent qu'un élément maîtrisé non dû.
  const pool = [{ kind: 'sound', key: 'snd:m', step: 6, guess: 1 / 3 }, { kind: 'sound', key: 'snd:l', step: 2, guess: 1 / 3 }];
  const mem = { 'snd:m': { b: 1, due: NOW - 1000, s: 3, k: 1, last: NOW - 2000 }, 'snd:l': { b: 5, due: NOW + 9e8, s: 9, k: 9, last: NOW } };
  const rand = seededRandom(4);
  let m = 0;
  for (let i = 0; i < 400; i++) if (selectItems(pool, { elo: p.elo, mem, now: NOW, n: 1, rand })[0].key === 'snd:m') m++;
  assert.ok(m > 260, `révision due pas assez prioritaire : ${m}/400`);
});
