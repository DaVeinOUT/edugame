import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import * as CUR from '../../js/data/curriculum.js';
import { parseSeg } from '../../js/core/seg.js';
import { WORD_FILES } from '../../js/data/wordaudio.js';

const dir = new URL('../../audio/mots/', import.meta.url);
const gameWords = new Set([
  ...CUR.LEXICON.map(([seg]) => seg), ...CUR.TOOL_WORDS.map(w => w.seg), ...CUR.SENTENCES.flatMap(s => s.words),
].map(seg => parseSeg(seg).text.toLowerCase()));

test('chaque mot enregistré a son fichier MP3, au nom ASCII unique', () => {
  const names = Object.values(WORD_FILES);
  assert.equal(new Set(names).size, names.length, 'deux mots pour un même fichier');
  for (const name of names) {
    assert.match(name, /^[a-z0-9-]+$/, `nom de fichier : ${name}`);
    assert.ok(existsSync(new URL(`${name}.mp3`, dir)), `fichier manquant : ${name}.mp3`);
  }
  assert.equal(readdirSync(dir).length, names.length, 'aucun fichier orphelin dans audio/mots/');
});

test('seuls des mots du jeu sont enregistrés ; les autres restent à la synthèse vocale', () => {
  for (const mot of Object.keys(WORD_FILES)) assert.ok(gameWords.has(mot), `mot inconnu du jeu : ${mot}`);
  const missing = [...gameWords].filter(w => !(w in WORD_FILES));
  assert.ok(Object.keys(WORD_FILES).length >= 250, 'la grande majorité des mots a une voix humaine');
  assert.ok(missing.length <= 40, `mots sans voix humaine : ${missing.join(', ')}`);
});

test('les sons isolés enregistrés (voyelles et consonnes) ont leur fichier, sans orphelin', async () => {
  const { SOUND_FILES } = await import('../../js/data/sounds.js');
  const { PHONEMES } = await import('../../js/core/seg.js');
  const sons = new URL('../../audio/sons/', import.meta.url);
  for (const [ph, file] of Object.entries(SOUND_FILES)) {
    assert.ok(PHONEMES.includes(ph), `phonème inconnu : ${ph}`);
    assert.match(file, /^[a-z0-9-]+$/);
    assert.ok(existsSync(new URL(`${file}.mp3`, sons)), `fichier manquant : ${file}.mp3`);
  }
  for (const ph of ['m', 's', 'ch', 'v', 'p', 'gn']) assert.ok(ph in SOUND_FILES, `consonne sans enregistrement : ${ph}`);
  const used = new Set(Object.values(SOUND_FILES));
  const orphans = readdirSync(sons).filter(f => f.endsWith('.mp3') && !used.has(f.slice(0, -4)));
  assert.deepEqual(orphans, [], 'aucun fichier orphelin dans audio/sons/');
});
