import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as CUR from '../../js/data/curriculum.js';
import { buildCurriculum } from '../../js/core/curriculum.js';
import {
  buildLevels, openLevels, moduleOpen, nextModule, moduleQuestions, planModule, finishModule,
  itemDifficulty, tokens, phonicsDone,
} from '../../js/core/levels.js';
import { newProfile } from '../../js/core/schema.js';
import { seededRandom } from '../../js/core/rng.js';

const cur = buildCurriculum(CUR);
const NOW = Date.UTC(2026, 9, 13, 9);
const item = (n, extra = {}) => ({ type: 'choice', text: `Question ${n} ?`, choices: ['oui', 'non'], answer: 'oui', explain: '.', ...extra });
const FIX = {
  LEVELS: [
    { id: 'n3', name: 'Lire et comprendre', grade: 'CE1-CE2', unlockElo: 1000, intro: '.' },
    { id: 'n4', name: 'Grammaire', grade: 'CM1-CM2', unlockElo: 1300, intro: '.' },
  ],
  MODULES: [
    { id: 'n3-a', level: 'n3', order: 1, skill: 'orthographe', title: 'a ou à', difficulty: 1, intro: '.',
      items: [{ type: 'gap', text: 'Léa ___ un vélo.', choices: ['a', 'à'], answer: 'a', explain: '.' },
              { type: 'pick', text: 'Le chat dort sur le lit.', prompt: 'Touche le verbe.', answer: 'dort', explain: '.' },
              { type: 'order', words: ['Le', 'chien', 'mange'], answer: 'Le chien mange.', explain: '.' },
              { type: 'text', passage: 'Tom va à la plage. Il nage.', questions: [item(1), item(2)] }] },
    { id: 'n3-b', level: 'n3', order: 2, skill: 'grammaire', title: 'Le verbe', difficulty: 3, intro: '.', items: Array.from({ length: 16 }, (_, i) => item(i)) },
    { id: 'n3-controle', level: 'n3', order: 9, skill: 'controle', title: 'Contrôle', difficulty: 5, intro: '.', items: Array.from({ length: 12 }, (_, i) => item(i)) },
    { id: 'n4-a', level: 'n4', order: 1, skill: 'grammaire', title: 'Sujet', difficulty: 1, intro: '.', items: [item(1)] },
    { id: 'n4-controle', level: 'n4', order: 9, skill: 'controle', title: 'Contrôle', difficulty: 5, intro: '.', items: [item(1)] },
  ],
};
const L = buildLevels(FIX);
const lastStep = cur.steps.length - 1;
const withPath = (path, extra = {}) => ({ ...newProfile({ age: '10-12' }, NOW), ...extra, path: { open: 0, stars: {}, tries: {}, ...path } });

test('aucun niveau des grands tant que le chemin des sons n\'est pas su', () => {
  const p = withPath({ open: 10 });
  assert.equal(phonicsDone(p, cur), false);
  assert.deepEqual(openLevels(L, p, cur, 1500), []);
});

test('le chemin terminé (ou le positionnement) ouvre le premier niveau', () => {
  const done = withPath({ open: lastStep, stars: { [cur.step(lastStep).id]: 1 } });
  assert.deepEqual(openLevels(L, done, cur, 500).map(l => l.id), ['n3']);
  const placed = withPath({ open: lastStep, advanced: true });
  assert.deepEqual(openLevels(L, placed, cur, 500).map(l => l.id), ['n3']);
});

test('plus la jauge monte, plus le niveau augmente ; le contrôle réussi ouvre aussi la suite', () => {
  const p = withPath({ open: 50 });
  assert.deepEqual(openLevels(L, p, cur, 1100).map(l => l.id), ['n3'], 'Élo suffisant et sons complexes travaillés');
  assert.deepEqual(openLevels(L, p, cur, 1350).map(l => l.id), ['n3', 'n4']);
  const ctl = withPath({ advanced: true, adv: { modules: {}, controles: { n3: true } } });
  assert.deepEqual(openLevels(L, ctl, cur, 500).map(l => l.id), ['n3', 'n4']);
});

test('les modules s\'ouvrent en chaîne, le contrôle à tout moment', () => {
  const p = withPath({ advanced: true });
  assert.equal(moduleOpen(L, p, L.module('n3-a')), true);
  assert.equal(moduleOpen(L, p, L.module('n3-b')), false);
  assert.equal(moduleOpen(L, p, L.module('n3-controle')), true);
  const after = withPath({ advanced: true, adv: { modules: { 'n3-a': { stars: 1, tries: 1 } }, controles: {} } });
  assert.equal(moduleOpen(L, after, L.module('n3-b')), true);
});

test('« Jouer » propose le module suivant, puis le contrôle, puis le niveau d\'après', () => {
  const young = { age: '7-9' };
  const p0 = withPath({ advanced: true }, young);
  assert.equal(nextModule(L, p0, cur, 600).id, 'n3-a');
  const p1 = withPath({ advanced: true, adv: { modules: { 'n3-a': { stars: 2, tries: 1 }, 'n3-b': { stars: 0, tries: 2 } }, controles: {} } }, young);
  assert.equal(nextModule(L, p1, cur, 600).id, 'n3-controle');
  const p2 = withPath({ advanced: true, adv: { modules: p1.path.adv.modules, controles: { n3: true } } }, young);
  assert.equal(nextModule(L, p2, cur, 600).id, 'n4-a');
});

test('dès 10 ans, le contrôle d\'un niveau neuf vient d\'abord : on monte vite si on sait', () => {
  const grand = withPath({ advanced: true });   // 10-12 ans
  assert.equal(nextModule(L, grand, cur, 600).id, 'n3-controle');
  const failed = withPath({ advanced: true, adv: { modules: { 'n3-controle': { stars: 0, tries: 1 } }, controles: {} } });
  assert.equal(nextModule(L, failed, cur, 600).id, 'n3-a', 'contrôle pas encore réussi : les modules apprennent ce qui manque');
  const passed = withPath({ advanced: true, adv: { modules: { 'n3-controle': { stars: 2, tries: 1 } }, controles: { n3: true } } });
  assert.equal(nextModule(L, passed, cur, 600).id, 'n4-controle', 'au niveau suivant aussi, le contrôle d\'abord');
});

test('les questions sont bien formées (trou, mot à toucher, ordre, texte)', () => {
  const qs = moduleQuestions(L.module('n3-a'));
  assert.equal(qs.length, 5, 'un texte à 2 questions compte pour 2');
  const pick = qs.find(q => q.type === 'pick');
  assert.equal(pick.options.find(o => o.id === pick.answer).text, 'dort');
  assert.deepEqual(tokens('« Bonjour », dit-il.'), ['Bonjour', 'dit-il']);
  assert.ok(qs.every(q => q.d > itemDifficulty({ levelIndex: 0, difficulty: 0 }, 'gap') - 0.01));
  assert.ok(itemDifficulty(L.module('n4-a'), 'gap') > itemDifficulty(L.module('n3-a'), 'gap'));
});

test('une séance prend au plus 12 questions, dans l\'ordre du cours ; le contrôle les prend toutes', () => {
  const p = withPath({ advanced: true });
  const plan = planModule(L.module('n3-b'), p, { rand: seededRandom(3), now: NOW });
  assert.equal(plan.length, 12);
  const idx = plan.map(q => Number(q.key.split(':').pop()));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
  assert.equal(planModule(L.module('n3-controle'), p, { now: NOW }).length, 12);
});

test('contrôle réussi : niveau suivant ouvert et diplôme ; les étoiles ne baissent jamais', () => {
  const p = withPath({ advanced: true });
  const ok = Array.from({ length: 12 }, (_, i) => ({ outcome: i < 9 ? 'ok' : 'ko' }));
  const r = finishModule(p, { module: L.module('n3-controle'), results: ok }, cur, NOW);
  assert.equal(r.report.passed, true);
  assert.ok(r.profile.cards.includes('diplome-n3'));
  assert.equal(r.profile.path.adv.controles.n3, true);
  const bad = Array.from({ length: 12 }, () => ({ outcome: 'ko' }));
  const r2 = finishModule(r.profile, { module: L.module('n3-controle'), results: bad }, cur, NOW + 1);
  assert.equal(r2.profile.path.adv.controles.n3, true, 'un contrôle réussi le reste');
  assert.ok(r2.profile.path.adv.modules['n3-controle'].stars >= r.profile.path.adv.modules['n3-controle'].stars);
});

test('les données réelles des niveaux (si présentes) sont bien formées', async t => {
  const file = new URL('../../js/data/levels.js', import.meta.url);
  if (!existsSync(file)) return;
  const DATA = await import(file.href);
  if (!DATA.LEVELS?.length) { t.skip('niveaux pas encore écrits'); return; }
  const real = buildLevels(DATA);
  assert.ok(real.levels.length >= 1);
  for (const lv of real.levels) assert.ok(real.modulesOf(lv.id).some(m => m.isControle), `contrôle manquant : ${lv.id}`);
  const ids = new Set();
  for (const m of real.modules) {
    assert.ok(!ids.has(m.id), `module en double : ${m.id}`);
    ids.add(m.id);
    for (const q of moduleQuestions(m)) {
      const where = `${q.key} (${q.type})`;
      if (q.type === 'order') {
        const joined = q.words.join(' ').replace(/\s+([.,!?;:…])/g, ' $1');
        assert.equal(q.answer.replace(/\s*[.!?…]+$/, '').replace(/\s+/g, ' '), joined.replace(/\s*[.!?…]+$/, ''), `ordre incohérent ${where}`);
      } else {
        assert.ok(q.options.some(o => o.id === q.answer), `réponse absente des choix ${where}`);
        assert.equal(new Set(q.options.map(o => o.text)).size === q.options.length || q.type === 'pick', true, `choix en double ${where}`);
      }
      if (q.type === 'pick') {
        const n = q.words.filter(w => w.toLowerCase() === String(q.answerText).toLowerCase()).length;
        assert.equal(n, 1, `le mot à toucher doit apparaître une seule fois ${where}`);
      }
      assert.ok(!/\b(faux|raté|mauvais|nul)\b/i.test(q.explain), `retour négatif ${where}`);
    }
  }
});
