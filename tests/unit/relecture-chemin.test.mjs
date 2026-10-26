import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as DATA from '../../js/data/curriculum.js';
import { buildCurriculum } from '../../js/core/curriculum.js';
import { parseSeg, spokenSyllables } from '../../js/core/seg.js';
import { makeQuestion } from '../../js/core/questions.js';
import { itemsForStep } from '../../js/core/session.js';
import { seededRandom } from '../../js/core/rng.js';

const cur = buildCurriculum(DATA);
const earKey = p => p.graphemes.filter(g => !g.mute).map(g => g.p).join('.').replace(/è/g, 'é').replace(/eu/g, 'e');
const sylSound = x => (x.reverse ? [...x.gpcs].reverse() : x.gpcs).map(g => g.split('>')[1]).join('.');

test('« Touche le mot » ne propose jamais deux mots qui se disent pareil', () => {
  const all = [...cur.tools, ...cur.words];
  for (let s = 0; s < cur.steps.length; s++) for (const it of itemsForStep(cur, s).hearword) for (let r = 0; r < 20; r++) {
    const q = makeQuestion(it, cur, { rand: seededRandom(r), open: cur.steps.length - 1 });
    const key = earKey(all.find(w => w.text === q.answer).parsed);
    for (const o of q.options.filter(o => o.id !== q.answer)) assert.notEqual(earKey(all.find(w => w.text === o.id).parsed), key, `${q.answer} / ${o.id}`);
  }
});

test('l\'oreille entend les parties des sons composés', () => {
  assert.ok(cur.withSound('a').some(w => w.text === 'roi'));
  assert.ok(cur.withSound('a').some(w => w.text === 'poisson'));
  assert.ok(cur.withSound('s').some(w => w.text === 'taxi'));
  assert.ok(cur.withSound('i').some(w => w.text === 'parapluie'));
});

test('les pièges de syllabes sont lisibles et ne se disent pas pareil', () => {
  for (let s = 0; s < cur.steps.length; s++) for (const it of itemsForStep(cur, s).syllable) for (let r = 0; r < 10; r++) {
    const q = makeQuestion(it, cur, { rand: seededRandom(r), open: s });
    const known = new Map(cur.steps.filter(x => x.index <= s).flatMap(x => cur.syllablesFor(x.index)).map(x => [x.text, sylSound(x)]));
    const flip = it.c.length === 1 && it.v.length === 1 ? (it.text === it.c + it.v ? it.v + it.c : it.c + it.v) : null;
    for (const o of q.options.filter(o => o.id !== q.answer)) {
      assert.ok(o.id === flip || known.has(o.id), `${o.id} pas encore appris (étape ${cur.steps[s].id})`);
      if (o.id !== flip) assert.notEqual(known.get(o.id), known.get(q.answer), `${q.answer} / ${o.id}`);
    }
  }
});

test('l\'aide dit les syllabes comme elles se prononcent', () => {
  assert.deepEqual(spokenSyllables(parseSeg('m-ai|s:z-on')), ['mai', 'zon']);
  assert.deepEqual(spokenSyllables(parseSeg('l-u|n-e:è-tt-e°-s°')), ['lu', 'nète']);
  assert.deepEqual(spokenSyllables(parseSeg('p-o|mm-e°')), ['po', 'me']);
  assert.deepEqual(spokenSyllables(parseSeg('s-e:è-r|p-en-t°')), ['sèr', 'pan']);
  assert.deepEqual(spokenSyllables(parseSeg('d-i-x:s')), ['dix']);
});

test('chaque son du chemin et des mots est dit par une voix humaine enregistrée', async () => {
  const { SOUND_FILES } = await import('../../js/data/sounds.js');
  const { SOUND_TTS } = await import('../../js/services/voice.js');
  const sounds = new Set(cur.steps.map(s => s.ph).filter(Boolean));
  for (const s of cur.steps) for (const m of (s.intro || '').matchAll(/\[([^\]]+)\]/g)) sounds.add(m[1]);
  for (const w of cur.words) for (const ph of w.phonemes) sounds.add(ph);
  for (const t of cur.tools) for (const g of t.parsed.graphemes) if (!g.mute) sounds.add(g.p);
  const unrecorded = [...sounds].filter(ph => !SOUND_FILES[ph]);
  assert.deepEqual(unrecorded, [], `sons sans enregistrement : ${unrecorded.join(', ')}`);
  const noFallback = [...sounds].filter(ph => !SOUND_TTS[ph]);
  assert.deepEqual(noFallback, [], `sons sans secours parlé (fichier illisible) : ${noFallback.join(', ')}`);
});
