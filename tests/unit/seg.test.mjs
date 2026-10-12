import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSeg, checkSeg, isDecodable, spokenSyllables, gpcId } from '../../js/core/seg.js';

test('un mot simple : graphèmes, syllabes et CGP', () => {
  const p = parseSeg('m-o|t-o');
  assert.equal(p.text, 'moto');
  assert.deepEqual(p.syllables.map(s => s.text), ['mo', 'to']);
  assert.deepEqual(p.gpcs, ['m>m', 'o>o', 't>t']);
});

test('les graphèmes complexes comptent pour UN son', () => {
  const p = parseSeg('ch-a-t°');
  assert.deepEqual(p.graphemes.map(g => g.g), ['ch', 'a', 't']);
  assert.deepEqual(p.gpcs, ['ch>ch', 'a>a']);
});

test('la lettre muette est marquée et ne demande aucune connaissance', () => {
  const p = parseSeg('ch-a-t°');
  assert.equal(p.graphemes[2].mute, true);
  assert.equal(p.graphemes[2].p, '');
  assert.equal(isDecodable(p, new Set(['ch>ch', 'a>a'])), true);
});

test('une lecture explicite remplace la lecture par défaut', () => {
  const p = parseSeg('m-ai|s:z-on');
  assert.deepEqual(p.gpcs, ['m>m', 'ai>è', 's>z', 'on>on']);
  assert.equal(isDecodable(p, new Set(['m>m', 'ai>è', 's>s', 'on>on'])), false,
    'connaître s>s ne suffit pas pour lire le s de maison');
});

test('les majuscules et les accents sont gérés', () => {
  assert.equal(parseSeg('é|c-o|l-e°').text, 'école');
  assert.equal(gpcId('CH', 'ch'), 'ch>ch');
});

test('checkSeg détecte une notation qui ne correspond pas au mot', () => {
  assert.deepEqual(checkSeg('l-a|p-in', 'lapin'), []);
  assert.equal(checkSeg('l-a|p-in', 'lapins').length, 1);
  assert.equal(checkSeg('l-a|p-q', 'lapq').length, 0, 'graphème q seul : lecture /k/ autorisée');
});

test('une notation invalide lève une erreur claire', () => {
  assert.throws(() => parseSeg(''), /vide/);
  assert.throws(() => parseSeg('x:zz'), /phonème inconnu/);
  assert.throws(() => parseSeg('m--o'), /graphème vide/);
  assert.throws(() => parseSeg('m-$'), /lecture inconnue/);
});

test('le découpage oral garde le e final des syllabes écrites', () => {
  assert.deepEqual(spokenSyllables(parseSeg('l-u|n-e°')), ['lu', 'ne']);
  assert.deepEqual(spokenSyllables(parseSeg('ch-a-t°')), ['cha']);
  assert.deepEqual(spokenSyllables(parseSeg('h°-i|b-ou')), ['i', 'bou']);
});
