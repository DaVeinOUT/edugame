import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as DATA from '../../js/data/curriculum.js';
import { buildCurriculum, parseIntro, introCaption, difficultyOf } from '../../js/core/curriculum.js';
import { checkSeg, parseSeg } from '../../js/core/seg.js';

const cur = buildCurriculum(DATA);

test('chaque mot du lexique est correctement noté et unique', () => {
  const texts = new Set();
  const emojis = new Set();
  for (const [seg, emoji] of DATA.LEXICON) {
    const text = parseSeg(seg).text;
    assert.deepEqual(checkSeg(seg, text), [], seg);
    assert.match(text, /^[a-zàâçéèêëîïôœùûü]+$/, `caractère inattendu dans ${text}`);
    assert.ok(!texts.has(text), `mot en double : ${text}`);
    assert.ok(!emojis.has(emoji), `émoji en double : ${emoji} (${text})`);
    texts.add(text);
    emojis.add(emoji);
  }
});

test('chaque étape a un mot d\'appui illustré et un son à écouter', () => {
  for (const s of cur.steps) {
    assert.ok(cur.word(s.anchor), `ancre absente : ${s.id} → ${s.anchor}`);
    assert.ok(cur.withSound(s.ph).length >= 1, `aucun mot pour écouter le son de ${s.id}`);
    assert.ok(s.introParts.some(p => p.sound), `l'intro de ${s.id} ne fait pas entendre le son`);
  }
});

test('les correspondances de chaque étape sont uniques dans le parcours', () => {
  const seen = new Map();
  for (const s of cur.steps) for (const g of s.gpcs) {
    assert.ok(!seen.has(g), `${g} enseigné deux fois (${seen.get(g)} et ${s.id})`);
    seen.set(g, s.id);
  }
});

test('les consonnes simples donnent des syllabes à lire', () => {
  for (const s of cur.steps.filter(x => ['longue', 'courte'].includes(x.kind) && x.index > 2)) {
    assert.ok(cur.syllablesFor(s.index).length >= 2, `pas assez de syllabes pour ${s.id}`);
  }
  assert.ok(!cur.syllablesFor(cur.stepById('g').index).some(x => /^g[eéèi]/.test(x.text)), 'gi/ge ne sont pas des [g]');
});

test('les mots deviennent lisibles progressivement et les phrases arrivent ensuite', () => {
  const first = cur.steps.findIndex(s => cur.readableAt(s.index).length > 0);
  assert.ok(first >= 0 && first <= 4, `premier mot lisible trop tard : étape ${first}`);
  assert.ok(cur.readableAt(cur.steps.length - 1).length >= 200);
  for (const s of cur.sentences) assert.ok(Number.isFinite(s.step), `phrase jamais lisible : ${s.text}`);
});

test('lire « maison » exige d\'avoir appris que s se lit [z]', () => {
  const maison = cur.word('maison');
  assert.equal(maison.step, cur.stepById('s-z').index);
});

test('le texte de Kaya se découpe en sons et en mots', () => {
  assert.deepEqual(parseIntro('Écoute [a] comme «ananas» !'), ['Écoute', { sound: 'a' }, 'comme', { word: 'ananas' }, '!']);
  assert.equal(introCaption('le son [a] de «ananas»'), 'le son « a » de ananas');
});

test('la difficulté a priori augmente avec l\'étape et le type d\'exercice', () => {
  assert.ok(difficultyOf({ kind: 'sound', step: 10 }) > difficultyOf({ kind: 'sound', step: 2 }));
  assert.ok(difficultyOf({ kind: 'read', step: 10, word: { syllables: 1, graphemes: 3 } })
    > difficultyOf({ kind: 'listen', step: 10 }));
});
