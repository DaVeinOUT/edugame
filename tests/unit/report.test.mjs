import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as CUR from '../../js/data/curriculum.js';
import * as LEVELS from '../../js/data/levels.js';
import { buildCurriculum } from '../../js/core/curriculum.js';
import { buildLevels } from '../../js/core/levels.js';
import { newProfile } from '../../js/core/schema.js';
import { localDay } from '../../js/core/time.js';
import { classRows, toCSV } from '../../js/core/report.js';

const cur = buildCurriculum(CUR);
const L = buildLevels(LEVELS);
const NOW = new Date(2026, 9, 13, 17, 0).getTime();
const DAY = 86400000;

test('le tableau de la classe résume chaque enfant', () => {
  const debutant = newProfile({ name: 'Léa' }, NOW);
  const grand = {
    ...newProfile({ name: 'Malik', age: '10-12' }, NOW),
    path: { open: 65, stars: {}, placed: true, advanced: true, adv: { modules: {}, controles: { n3: true } } },
    stats: { sessions: 3, answers: 40, correct: 30, seconds: 1500,
      days: { [localDay(NOW)]: 600, [localDay(NOW - 2 * DAY)]: 300, [localDay(NOW - 20 * DAY)]: 900 },
      confusions: { 'b/d': 4, 'on/an': 1 } },
  };
  const [a, b] = classRows([debutant, grand], cur, L, NOW);
  assert.deepEqual([a.name, a.step, a.level, a.weekMinutes, a.lastDay, a.watch], ['Léa', '1 / 66', '—', 0, '—', '—']);
  assert.equal(b.step, 'acquis');
  assert.equal(b.level, 'CM1-CM2', 'contrôle CE1-CE2 réussi : le niveau suivant est ouvert');
  assert.equal(b.controles, 1);
  assert.equal(b.weekMinutes, 15, 'seulement les 7 derniers jours');
  assert.equal(b.lastDay, '13/10');
  assert.equal(b.watch, 'b ↔ d');
});

test('export tableur : séparateur ;, accents, guillemets, et jamais de formule', () => {
  const csv = toCSV([
    { name: 'Zoé; la "grande"', points: 812, title: 'Fou', step: '12 / 66', level: '—', controles: 0, weekMinutes: 20, lastDay: '13/10', watch: '—' },
    { name: '=HYPERLINK("x")', points: 600, title: 'Cavalier', step: '3 / 66', level: '—', controles: 0, weekMinutes: 0, lastDay: '—', watch: '—' },
  ]);
  assert.ok(csv.startsWith('﻿Enfant;Force de lecture;'));
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].startsWith('"Zoé; la ""grande""";812;Fou;'));
  assert.ok(lines[2].startsWith('"\'=HYPERLINK(""x"")";'), lines[2]);
});
