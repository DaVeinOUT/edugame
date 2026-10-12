import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ELO, probability, update, decay, display, prudent, toPoints,
  commitSession, titleFor, initialState,
} from '../../js/core/elo.js';
import { seededRandom } from '../../js/core/rng.js';

const DAY = 86400000;
const T0 = Date.UTC(2026, 9, 12);

test('probabilité : 50 % à niveau égal, chance de deviner prise en compte', () => {
  assert.equal(probability(0, 0), 0.5);
  assert.equal(probability(0, 0, 0.5), 0.75);
  assert.ok(probability(2, 0) > 0.85);
});

test('une réponse ne modifie jamais l\'état reçu (immuabilité)', () => {
  const st = Object.freeze(initialState('7-9', T0));
  const next = update(st, { d: st.theta, correct: true, guess: 1 / 3 });
  assert.notEqual(next, st);
  assert.equal(next.n, 1);
});

test('réussir fait monter θ, rater le fait baisser, l\'aide un peu moins', () => {
  const st = initialState('7-9', T0);
  const up = update(st, { d: st.theta, correct: true, guess: 1 / 3 });
  const down = update(st, { d: st.theta, correct: false, guess: 1 / 3 });
  const help = update(st, { d: st.theta, correct: false, guess: 1 / 3, help: true });
  assert.ok(up.theta > st.theta);
  assert.ok(down.theta < st.theta);
  assert.ok(help.theta < st.theta && help.theta > down.theta);
});

test('l\'Élo affiché ne baisse JAMAIS, même après une séance ratée', () => {
  let st = initialState('7-9', T0);
  st = commitSession(st, T0).state;
  const before = display(st);
  for (let i = 0; i < 15; i++) st = update(st, { d: st.theta - 1, correct: false, guess: 1 / 3 });
  const res = commitSession(st, T0 + DAY);
  assert.ok(res.after >= before);
  assert.equal(res.gained, res.after - before);
  assert.ok(res.gained >= 0);
});

test('un coup de chance au début ne gonfle pas l\'affichage', () => {
  let st = initialState('4-6', T0);
  for (let i = 0; i < 8; i++) st = update(st, { d: 0, correct: true, guess: 1 / 3 });
  const { after } = commitSession(st, T0);
  assert.ok(after < toPoints(-2), `affichage trop haut après 8 réponses chanceuses : ${after}`);
});

test('une absence élargit l\'incertitude sans toucher à l\'affichage', () => {
  let st = commitSession(initialState('7-9', T0), T0).state;
  for (let i = 0; i < 60; i++) st = update(st, { d: st.theta, correct: i % 4 !== 0, guess: 1 / 3 });
  st = commitSession(st, T0).state;
  const shown = display(st);
  const later = decay(st, T0 + 21 * DAY);
  assert.ok(later.v > st.v);
  assert.equal(display(later), shown);
});

test('simulation : un enfant qui progresse voit son Élo monter sans jamais baisser', () => {
  const rand = seededRandom(11);
  let now = T0;
  let st = initialState('4-6', now);
  let trueTheta = -3.2;
  let shown = display(st);
  const guess = 1 / 3;
  for (let session = 0; session < 40; session++) {
    now += DAY;
    st = decay(st, now);
    for (let i = 0; i < 30; i++) {
      // Exercice choisi pour viser ~80 % de réussite estimée (+ un peu de variété)
      const d = st.theta - 0.85 + (rand() - 0.5) * 0.6;
      const correct = rand() < probability(trueTheta, d, guess);
      st = update(st, { d, correct, guess });
    }
    const res = commitSession(st, now);
    assert.ok(res.after >= shown, `baisse à la séance ${session}`);
    shown = res.after;
    st = res.state;
    trueTheta += 0.1;
  }
  const truth = trueTheta - 0.1;
  assert.ok(Math.abs(st.theta - truth) < 0.6, `estimation trop loin : ${st.theta} vs ${truth}`);
  assert.ok(shown <= toPoints(truth) + 60, `affichage gonflé : ${shown} > ${toPoints(truth)}`);
  assert.ok(shown >= toPoints(truth) - 260, `affichage trop timide : ${shown}`);
  assert.ok(titleFor(shown).rank >= 2, 'au moins Fou après 40 séances de progrès');
});

test('titres d\'échecs et progression vers le suivant', () => {
  assert.equal(titleFor(0).title.id, 'pion');
  assert.equal(titleFor(599).title.id, 'pion');
  assert.equal(titleFor(600).title.id, 'cavalier');
  assert.equal(titleFor(1500).title.id, 'roi');
  assert.equal(titleFor(1500).next, null);
  assert.equal(titleFor(700).progress, 0.5);
});

test('la promotion est détectée au passage d\'un titre', () => {
  const st = { ...initialState('10-12', T0), peak: 590, theta: (650 - ELO.offset) / ELO.scale + 0.2, v: 0.04 };
  assert.ok(prudent(st) >= 600);
  const res = commitSession(st, T0);
  assert.equal(res.promoted?.id, 'cavalier');
});

test('l\'historique garde une entrée par jour', () => {
  let st = initialState('7-9', T0);
  st = commitSession(st, T0).state;
  st = commitSession(st, T0 + 3600000).state;
  st = commitSession(st, T0 + DAY).state;
  assert.equal(st.history.length, 2);
});
