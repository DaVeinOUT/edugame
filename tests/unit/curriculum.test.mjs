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

test('chaque étape a un mot d\'appui (ou des exemples) et fait entendre son son', () => {
  for (const s of cur.steps) {
    if (s.anchor) assert.ok(cur.word(s.anchor), `ancre absente : ${s.id} → ${s.anchor}`);
    else assert.ok(s.examplesParsed.length || s.kind === 'contraste', `ni ancre ni exemple : ${s.id}`);
    if (s.ph) assert.ok(s.introParts.some(p => p.sound), `l'intro de ${s.id} ne fait pas entendre le son`);
  }
  assert.equal(cur.steps.length, 66);
});

test('les mots-outils deviennent lisibles aux étapes prévues (rapport pédagogique §3)', () => {
  const expected = { a: 0, il: 2, la: 2, le: 7, me: 7, se: 9, sur: 9, vous: 14, nous: 15, ne: 15, un: 16,
    je: 17, pour: 18, tout: 19, de: 22, mon: 26, les: 27, des: 27, est: 28, que: 29, dans: 31, mais: 35,
    elle: 42, avec: 42, ce: 47, et: 51 };
  for (const [w, step] of Object.entries(expected)) {
    const t = cur.tools.find(x => x.text === w);
    assert.ok(t, `mot-outil absent : ${w}`);
    assert.equal(t.step, step, `« ${w} » lisible à l'étape ${t.step}, attendu ${step}`);
  }
});

test('b, d, p, q sont éloignés d\'au moins 3 étapes, et les nasales de 4', () => {
  const at = id => cur.stepById(id).index;
  const far = (x, y, n) => assert.ok(Math.abs(at(x) - at(y)) >= n, `${x} et ${y} trop proches`);
  far('p', 'd', 3); far('d', 'b', 3); far('b', 'qu', 3);
  far('on', 'an', 4); far('an', 'in', 4);
  assert.ok(at('bdpq') > at('qu'), 'l\'étape-contraste vient après q');
  assert.ok(at('p') < at('on'), 'consonnes brèves avant les nasales');
});

test('les correspondances de chaque étape sont uniques dans le parcours', () => {
  const seen = new Map();
  for (const s of cur.steps) for (const g of s.gpcs) {
    assert.ok(!seen.has(g), `${g} enseigné deux fois (${seen.get(g)} et ${s.id})`);
    seen.set(g, s.id);
  }
});

test('les consonnes simples donnent des syllabes à lire', () => {
  for (const s of cur.steps.filter(x => ['longue', 'courte'].includes(x.kind) && x.index > 2 && x.show.length === 1 && x.id !== 'w')) {
    assert.ok(cur.syllablesFor(s.index).length >= 2, `pas assez de syllabes pour ${s.id}`);
  }
  assert.ok(!cur.syllablesFor(cur.stepById('g').index).some(x => /^g[eéèi]/.test(x.text)), 'gi/ge ne sont pas des [g]');
});

test('les mots deviennent lisibles progressivement et les phrases arrivent ensuite', () => {
  const first = cur.steps.findIndex(s => cur.readableAt(s.index).length > 0);
  assert.ok(first >= 0 && first <= 6, `premier mot lisible trop tard : étape ${first}`);
  assert.ok(cur.readableAt(cur.stepById('muettes').index).length >= 8, 'les lettres muettes ouvrent beaucoup de mots');
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
