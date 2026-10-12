import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newProfile, sanitizeProfile, migrateLegacy, exportBundle, importBundle,
  emptyDevice, cleanName, SCHEMA_VERSION, DEFAULT_COMFORT,
} from '../../js/core/schema.js';
import { seededRandom } from '../../js/core/rng.js';

const NOW = Date.UTC(2026, 9, 12);

test('nouveau profil : valeurs par défaut sûres', () => {
  const p = newProfile({ name: 'Léa', age: '7-9', avatar: '🦊' }, NOW, seededRandom(1));
  assert.match(p.id, /^p[0-9a-z]{8}$/);
  assert.equal(p.name, 'Léa');
  assert.equal(p.avatar, '🦊');
  assert.equal(p.universe, 'jungle');
  assert.deepEqual(p.comfort, DEFAULT_COMFORT);
  assert.ok(p.elo.theta < 0);
});

test('valeurs inconnues remplacées, prénom nettoyé', () => {
  const p = newProfile({ name: '<b>Zoé</b>\u0007', age: '99', avatar: '💣' }, NOW);
  assert.equal(p.name, 'bZoé/b');
  assert.equal(p.age, '4-6');
  assert.equal(p.avatar, '🐯');
  assert.equal(cleanName('x'.repeat(40)).length, 20);
});

test('sanitizeProfile complète un profil abîmé et refuse le n\'importe quoi', () => {
  const p = sanitizeProfile({ id: 'pabc', name: 'Tom', comfort: { font: 'comic' }, cards: ['A', 3] }, NOW);
  assert.equal(p.comfort.font, DEFAULT_COMFORT.font);
  assert.deepEqual(p.cards, ['A']);
  assert.ok(p.elo && p.stats && p.path);
  assert.throws(() => sanitizeProfile(null), /invalide/);
  assert.throws(() => sanitizeProfile({ name: 'sans id' }), /invalide/);
});

test('migration v1 : prénom, univers, cartes et confort sont conservés', () => {
  const m = migrateLegacy({
    educaProfile: { name: 'Sam', age: '7-9', universe: 'ocean', xp: 120, cards: ['A', 'r_first'], palier: 2 },
    educaLetterStats: { gamesPlayed: 3, letters: { A: { ok: 2, seen: 3 } } },
    educaComfort: { dyslexicFont: true, wideSpacing: true, softBg: true },
    educaVoiceName: 'Google français',
    educaMuted: '1',
  }, NOW);
  assert.equal(m.profile.name, 'Sam');
  assert.equal(m.profile.universe, 'ocean');
  assert.deepEqual(m.profile.cards, ['son-a', 'r_first'], 'la carte-lettre A devient la carte du son a');
  assert.equal(m.profile.comfort.font, 'opendyslexic');
  assert.equal(m.profile.comfort.spacing, 'xwide');
  assert.equal(m.profile.legacy.xp, 120);
  assert.equal(m.device.voice, 'Google français');
  assert.equal(m.device.muted, true);
  assert.equal(m.device.activeId, m.profile.id);
  assert.equal(migrateLegacy({}, NOW), null);
});

test('le prénom par défaut « Champion » de la v1 devient vide', () => {
  const m = migrateLegacy({ educaProfile: { name: 'Champion', age: '4-6' } }, NOW);
  assert.equal(m.profile.name, '');
});

test('export puis import : aller-retour sans perte', () => {
  const device = emptyDevice(NOW);
  const a = newProfile({ name: 'Ana' }, NOW);
  const b = newProfile({ name: 'Bo', age: '10-12' }, NOW);
  const file = JSON.parse(JSON.stringify(exportBundle(device, [a, b], NOW)));
  assert.equal(file.educa, SCHEMA_VERSION);
  const back = importBundle(file, NOW);
  assert.equal(back.profiles.length, 2);
  assert.deepEqual(back.profiles.map(p => p.name), ['Ana', 'Bo']);
});

test('import d\'un ancien export v1', () => {
  const back = importBundle({ educa: 1, profile: { name: 'Lou', age: '4-6', cards: ['B'] }, voice: 'Amélie' }, NOW);
  assert.equal(back.profiles[0].name, 'Lou');
  assert.deepEqual(back.profiles[0].cards, ['son-b']);
  assert.equal(back.device.voice, 'Amélie');
});

test('un fichier étranger est refusé avec un message clair', () => {
  assert.throws(() => importBundle('texte', NOW), /illisible/);
  assert.throws(() => importBundle({ educa: 99, profiles: [] }, NOW), /EDUCA/);
});
