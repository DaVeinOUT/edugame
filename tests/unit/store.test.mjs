import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryStorage } from '../../js/services/store.js';

const NOW = Date.UTC(2026, 9, 13, 9);

function store(storage = memoryStorage()) {
  return createStore({ storage, now: () => NOW, maxStep: 65 });
}

test('restaurer une vieille sauvegarde ne fait rien perdre à l\'enfant', () => {
  const s = store();
  s.load();
  const p = s.addProfile({ name: 'Lou' });
  const old = s.exportAll();   // sauvegarde faite au tout début
  s.updateProfile(p.id, x => ({ ...x, stats: { ...x.stats, answers: 120 }, path: { ...x.path, open: 9 } }));
  s.importAll(JSON.parse(JSON.stringify(old)));
  assert.equal(s.profile(p.id).path.open, 9, 'la copie la plus avancée est gardée');
  assert.equal(s.profiles().length, 1);
});

test('un profil abîmé sur le disque est remis d\'aplomb au chargement', () => {
  const storage = memoryStorage();
  const s = store(storage);
  s.load();
  const p = s.addProfile({ name: 'Zoé' });
  storage.setItem(`educa2:p:${p.id}`, JSON.stringify({ ...p, path: { open: 999 }, stats: { days: null } }));
  const again = store(storage);
  again.load();
  assert.equal(again.profile(p.id).path.open, 65);
  assert.deepEqual(again.profile(p.id).stats.days, {});
});
