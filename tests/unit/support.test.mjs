import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProfile, sanitizeProfile, mergeProfiles } from '../../js/core/schema.js';
import { applyAnswer } from '../../js/core/session.js';
import { createStore, memoryStorage } from '../../js/services/store.js';
import { createSupportTrace, supportSummary, sanitizeSupport, SUPPORT_LIMIT, recordSupport } from '../../js/core/support.js';
import { supportReport } from '../../js/core/report.js';

const NOW = Date.UTC(2026, 9, 25, 12);
const question = { key: 'wd:moto', kind: 'read', d: 0, guess: 1 / 3 };
const trace = (eventId, methods = {}) => ({ version: 1, eventId, methods });

test('l’écoute d’une option est conservée sans changer le score, la mémoire ni les étoiles', () => {
  const p = newProfile({}, NOW, () => 0.25);
  const alone = applyAnswer(p, question, { outcome: 'ok', support: trace('alone') }, NOW);
  const audio = applyAnswer(p, question, { outcome: 'ok', support: trace('audio', { 'option-audio': 1 }) }, NOW);
  assert.deepEqual(audio.elo, alone.elo);
  assert.deepEqual(audio.mem, alone.mem);
  assert.deepEqual(audio.stats, alone.stats);
  assert.equal(audio.wallet, alone.wallet);
  assert.equal(audio.support.recent[0].methods['option-audio'], 1);
  assert.deepEqual(alone.support.recent[0].methods, {});
});

test('une observation documentée traverse la sauvegarde et une nouvelle ouverture', () => {
  const disk = memoryStorage();
  const a = createStore({ storage: disk, now: () => NOW }); a.load();
  const p = a.addProfile({ name: 'Léa' });
  a.updateProfile(p.id, profile => applyAnswer(profile, question,
    { outcome: 'help', support: trace('persisted', { 'explicit-help': 1 }) }, NOW));
  a.flush();
  const b = createStore({ storage: disk, now: () => NOW }); b.load();
  assert.equal(b.active().support.recent[0].id, 'persisted');
  assert.equal(b.active().support.recent[0].outcome, 'help');
  assert.equal(b.active().support.recent[0].methods['explicit-help'], 1);
});

test('deux imports divergents réunissent les observations sans doubler une même réponse', () => {
  const p = newProfile({}, NOW);
  const a = applyAnswer(p, question, { outcome: 'ok', support: trace('shared') }, NOW);
  const b = applyAnswer(a, question, { outcome: 'help', support: trace('local', { 'explicit-help': 1 }) }, NOW + 1);
  const c = applyAnswer(a, question, { outcome: 'ok', support: trace('incoming', { 'option-audio': 1 }) }, NOW + 2);
  const merged = mergeProfiles(b, c);
  assert.equal(merged.stats.answers, 2, 'la politique des compteurs existants ne change pas');
  assert.equal(merged.support.recent.length, 3);
  assert.equal(new Set(merged.support.recent.map(r => r.id)).size, 3);
  assert.equal(sanitizeProfile(merged, NOW).support.recent.length, 3);
  assert.equal(supportReport(merged).counterMismatch, true);
  assert.match(supportReport(merged).coverageLabel, /compteurs importés/);
});

test('les écoutes tardives ne contaminent pas la question suivante et les snapshots sont isolés', () => {
  const recorder = createSupportTrace();
  recorder.reset({ eventId: 'first' });
  recorder.note('instruction-replay'); recorder.note('instruction-replay');
  const first = recorder.close();
  assert.equal(recorder.note('option-audio'), false);
  first.methods['option-audio'] = 100;
  assert.equal(recorder.snapshot().methods['option-audio'], undefined);
  recorder.reset({ eventId: 'second', screenReader: true });
  assert.deepEqual(recorder.close(), trace('second', { 'screen-reader': 1 }));
});

test('un ancien profil reste un historique non détaillé, jamais une réussite autonome inventée', () => {
  const p = newProfile({}, NOW);
  delete p.support; p.stats.answers = 24;
  const restored = sanitizeProfile(p, NOW);
  const summary = supportSummary(restored);
  assert.equal(summary.documented, 0);
  assert.equal(summary.notDetailed, 24);
  assert.equal(summary.withoutSupport, 0);
  assert.equal(supportReport(restored).coverageLabel, 'Historique non détaillé');
  const plain = applyAnswer(restored, question, { outcome: 'ok' }, NOW);
  assert.equal(supportSummary(plain).notDetailed, 25, 'un appelant non instrumenté ne devient pas une preuve d’autonomie');
});

test('le journal garde les dernières réponses et annonce les résultats plus anciens sans détail', () => {
  let p = newProfile({}, NOW);
  for (let i = 0; i < SUPPORT_LIMIT + 3; i++) {
    p = { ...p, support: recordSupport(p, question, { outcome: 'ok', support: trace(`sample-${i}`) }, NOW + i),
      stats: { ...p.stats, answers: p.stats.answers + 1 } };
  }
  assert.equal(p.support.recent.length, SUPPORT_LIMIT);
  assert.equal(p.support.recent[0].id, 'sample-3');
  assert.equal(supportSummary(p).notDetailed, 3);
  const before = p.support;
  p = { ...p, support: recordSupport(p, question, { outcome: 'ok', support: trace(`sample-${SUPPORT_LIMIT + 2}`) }, NOW + SUPPORT_LIMIT + 2) };
  assert.deepEqual(p.support, before, 'même événement importé/rejoué, une seule observation');
});

test('le rapport sépare les réussites documentées, la réécoute, l’audio demandé et le guidage', () => {
  let p = newProfile({}, NOW);
  const samples = [
    ['ok', {}], ['ok', { 'instruction-replay': 2 }], ['ok', { 'option-audio': 1 }],
    ['help', { 'explicit-help': 1, 'text-audio': 1 }], ['ko', { 'construction-hint': 1 }],
  ];
  samples.forEach(([outcome, methods], i) => { p = applyAnswer(p, question, { outcome, support: trace(`category-${i}`, methods) }, NOW + i); });
  const s = supportSummary(p);
  assert.deepEqual([s.withoutSupport, s.replayOnly, s.audio, s.guided, s.incorrect], [1, 1, 1, 1, 1]);
  assert.equal(s.methods['instruction-replay'], 2);
  assert.equal(s.methods['construction-hint'], 1);
  assert.match(supportReport(p).successLabel, /sans aide enregistrée/);
  assert.doesNotMatch(supportReport(p).successLabel, /autonome/);
});

test('un journal abîmé ou d’une version inconnue est assaini sans modifier les résultats', () => {
  const entry = { id: 'valid', t: NOW, key: question.key, outcome: 'ok', methods: { 'option-audio': 1e9, unknown: 2 } };
  const support = sanitizeSupport({ version: 1, recent: [null, {}, entry, entry, { ...entry, id: 'bad', t: -1 }] });
  assert.equal(support.recent.length, 1);
  assert.deepEqual(support.recent[0].methods, { 'option-audio': 100 });
  assert.deepEqual(sanitizeSupport({ version: 99, recent: [entry] }).recent, []);
});
