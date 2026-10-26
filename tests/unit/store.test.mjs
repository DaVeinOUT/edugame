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

test('une écriture échouée reste en attente et est relue après rétablissement', () => {
  const disk = memoryStorage();
  let failed = false;
  const storage = { ...disk, setItem(k, v) { if (failed) throw new Error('quota'); disk.setItem(k, v); } };
  const s = store(storage);
  s.load();
  const p = s.addProfile({ name: 'Initial' });
  failed = true;
  s.updateProfile(p.id, x => ({ ...x, name: 'Après panne' }));
  s.flush();
  failed = false;
  s.flush();
  const reopened = store(disk);
  reopened.load();
  assert.equal(reopened.profile(p.id).name, 'Après panne');
});

test('une seconde copie périmée ne peut pas écraser les progrès déjà enregistrés', () => {
  const disk = memoryStorage();
  const a = store(disk);
  a.load();
  const p = a.addProfile({ name: 'Lou' });
  const b = store(disk);
  b.load();
  a.updateProfile(p.id, x => ({ ...x, stats: { ...x.stats, answers: 1 } }));
  a.flush();
  b.updateProfile(p.id, x => ({ ...x, stats: { ...x.stats, answers: 2 } }));
  b.flush();
  const reopened = store(disk);
  reopened.load();
  assert.equal(reopened.profile(p.id).stats.answers, 1);
  assert.equal(b.status.conflict, true);
});

test('une panne entre profil et liste est récupérable après fermeture', () => {
  const disk = memoryStorage();
  let failDevice = false;
  const storage = { ...disk, setItem(k, v) { if (failDevice && k === 'educa2:device') throw new Error('panne partielle'); disk.setItem(k, v); } };
  const s = store(storage);
  s.load();
  failDevice = true;
  const p = s.addProfile({ name: 'Nouveau pendant panne' });
  assert.equal(s.flush(), false);
  assert.equal(s.status.pending, true);
  assert.equal(s.status.failed, true);
  // Une nouvelle instance ne possède aucune référence vers la mémoire de s.
  const reopened = store(disk);
  const boot = reopened.load();
  assert.equal(boot.recovered, true);
  assert.equal(reopened.active().id, p.id);
  assert.equal(reopened.active().name, 'Nouveau pendant pann');
  const third = store(disk);
  third.load();
  assert.equal(third.active().id, p.id);
  assert.equal(disk.getItem('educa2:pending'), null);
});

test('une panne durable conserve la mémoire exportable et les anciennes données sur disque', () => {
  const disk = memoryStorage();
  let fail = false;
  const storage = { ...disk, setItem(k, v) { if (fail) throw new Error('quota'); disk.setItem(k, v); } };
  const s = store(storage);
  s.load();
  const p = s.addProfile({ name: 'Lou' });
  fail = true;
  s.updateProfile(p.id, x => ({ ...x, stats: { ...x.stats, answers: 17 } }));
  for (let i = 0; i < 5; i++) assert.equal(s.flush(), false);
  assert.equal(s.status.pending, true);
  assert.equal(s.degraded, true);
  assert.equal(s.exportAll().profiles[0].stats.answers, 17);
  const reopened = store(disk);
  reopened.load();
  assert.equal(reopened.active().stats.answers, 0);
});

test('deux modifications en attente : la copie périmée garde son export sans écraser le disque', () => {
  const disk = memoryStorage();
  const a = store(disk);
  a.load();
  const p = a.addProfile({ name: 'Lou' });
  const b = store(disk);
  b.load();
  a.updateProfile(p.id, x => ({ ...x, wallet: 2 }));
  b.updateProfile(p.id, x => ({ ...x, wallet: 3 }));
  a.flush();
  assert.equal(b.flush(), false);
  assert.equal(b.status.conflict, true);
  assert.equal(b.exportAll().profiles[0].wallet, 3);
  const reopened = store(disk);
  reopened.load();
  assert.equal(reopened.active().wallet, 2);
});

function lockManager() {
  let held = false;
  return {
    async request(name, options, callback) {
      if (held) return callback(null);
      held = true;
      try { return await callback({ name }); } finally { held = false; }
    },
  };
}

test('une seule session détient le verrou ; la fermeture permet une reprise', async () => {
  const disk = memoryStorage();
  const locks = lockManager();
  const a = store(disk);
  const b = store(disk);
  assert.equal(await a.claimSession(locks), true);
  a.load();
  const p = a.addProfile({ name: 'Lou' });
  assert.equal(await b.claimSession(locks), false);
  b.load();
  assert.equal(b.status.sessionReason, 'busy');
  assert.equal(b.updateProfile(p.id, x => ({ ...x, wallet: 99 })), null);
  await a.releaseSession();
  assert.equal(await b.claimSession(locks), true);
  b.load();
  b.updateProfile(p.id, x => ({ ...x, wallet: 1 }));
  b.releaseSession();
  const reopened = store(disk);
  reopened.load();
  assert.equal(reopened.active().wallet, 1);
});

test('sans verrou navigateur, la récupération est lisible mais les mutations sont refusées', async () => {
  const disk = memoryStorage();
  const a = store(disk);
  a.load();
  a.addProfile({ name: 'Lou' });
  const b = store(disk);
  assert.equal(await b.claimSession(null), false);
  b.load();
  assert.equal(b.status.sessionReason, 'unsupported');
  assert.equal(b.addProfile({ name: 'Autre' }), null);
  assert.equal(b.exportAll().profiles.length, 1);
});

test('restauration vierge : limite quotidienne conservée, appareil configuré : réglage actuel conservé', () => {
  const source = store();
  source.load();
  source.addProfile({ name: 'Lou' });
  source.updateDevice(d => ({ ...d, dailyMinutes: 15 }));
  const file = JSON.parse(JSON.stringify(source.exportAll()));
  const target = store();
  target.load();
  target.importAll(file);
  assert.equal(target.device().dailyMinutes, 15);
  target.updateDevice(d => ({ ...d, dailyMinutes: 20 }));
  target.importAll(file);
  assert.equal(target.device().dailyMinutes, 20);
});

test('import divergent : cartes et réussites sont réunies sans doubler les réponses communes', () => {
  const disk = memoryStorage();
  const s = store(disk);
  s.load();
  const p = s.addProfile({ name: 'Prénom local' });
  s.updateProfile(p.id, x => ({ ...x, cards: ['son-m'], wallet: 2,
    stats: { ...x.stats, answers: 20 }, path: { ...x.path, open: 5, stars: { m: 3 } } }));
  const incoming = { ...p, name: 'Ancien prénom', cards: ['r_first'], wallet: 3,
    stats: { ...p.stats, answers: 30 }, path: { ...p.path, open: 2, stars: { a: 3 } } };
  s.importAll({ educa: 2, profiles: [incoming] });
  const reopened = store(disk);
  reopened.load();
  const result = reopened.active();
  assert.equal(result.stats.answers, 30);
  assert.equal(result.path.open, 5);
  assert.deepEqual(result.path.stars, { m: 3, a: 3 });
  assert.deepEqual(result.cards, ['son-m', 'r_first']);
  assert.equal(result.name, 'Prénom local');
  assert.equal(result.wallet, 3);
});

test('stockage refusé à l’écriture : les anciens profils restent lisibles', async () => {
  const disk = memoryStorage();
  const a = store(disk);
  a.load();
  const p = a.addProfile({ name: 'Lou' });
  const { probeStorage } = await import('../../js/services/store.js');
  const denied = { ...disk, setItem() { throw new Error('quota'); } };
  const probe = probeStorage({ localStorage: denied });
  assert.equal(probe.persistent, false);
  const b = createStore(probe);
  b.load();
  assert.equal(b.profile(p.id).name, 'Lou');
  b.updateProfile(p.id, x => ({ ...x, wallet: 4 }));
  assert.equal(b.flush(), false);
  assert.equal(b.exportAll().profiles[0].wallet, 4);
});


test('importer des élèves conserve les choix explicites « aucune » voix et assignation', () => {
  const s = store();
  s.load();
  s.addProfile({ name: 'Lou' });
  s.updateDevice(d => ({ ...d, voice: null, classStep: null }));
  s.importAll({ educa: 2, device: { voice: 'Ancienne voix', classStep: 65, dailyMinutes: 15 }, profiles: [] });
  assert.equal(s.device().voice, null);
  assert.equal(s.device().classStep, null);
});

test('migration des repères : 30 anciens profils au même animal restent distincts et conservent leurs progrès', async () => {
  const { newProfile, emptyDevice } = await import('../../js/core/schema.js');
  const disk = memoryStorage();
  const old = Array.from({ length: 30 }, (_, i) => {
    const p = newProfile({ avatar: '🐯' }, NOW);
    delete p.badgeId;
    p.stats.answers = i + 1;
    p.cards = ['son-m'];
    return p;
  });
  disk.setItem('educa2:device', JSON.stringify({ ...emptyDevice(NOW), order: old.map(p => p.id), activeId: old[7].id }));
  for (const p of old) disk.setItem(`educa2:p:${p.id}`, JSON.stringify(p));
  const s = store(disk);
  const boot = s.load();
  assert.equal(boot.profileBadgesMigrated, true);
  assert.equal(new Set(s.profiles().map(p => p.badgeId)).size, 30);
  assert.ok(s.profiles().every(p => Number.isInteger(p.badgeId)));
  const reopened = store(disk);
  assert.equal(reopened.load().profileBadgesMigrated, false);
  assert.deepEqual(reopened.profiles().map(({ badgeId, ...p }) => p), old);
  assert.deepEqual(reopened.profiles().map(p => p.badgeId), s.profiles().map(p => p.badgeId));
  assert.equal(reopened.active().id, old[7].id);
});

test('ajouter et importer des élèves garde les repères locaux et répare les collisions', async () => {
  const { newProfile } = await import('../../js/core/schema.js');
  const disk = memoryStorage();
  const s = store(disk);
  s.load();
  const first = s.addProfile({ avatar: '🐯' });
  const second = s.addProfile({ avatar: '🐯' });
  const third = { ...newProfile({ avatar: '🐯' }, NOW), badgeId: first.badgeId };
  s.importAll({ educa: 2, profiles: [third, { ...first, badgeId: second.badgeId }] });
  assert.equal(s.profile(first.id).badgeId, first.badgeId);
  assert.equal(s.profile(second.id).badgeId, second.badgeId);
  assert.equal(new Set(s.profiles().map(p => p.badgeId)).size, 3);
  const roundtrip = JSON.parse(JSON.stringify(s.exportAll()));
  const target = store();
  target.load();
  target.importAll(roundtrip);
  assert.deepEqual(target.profiles().map(p => [p.id, p.badgeId]), s.profiles().map(p => [p.id, p.badgeId]));
  const reopened = store(disk);
  reopened.load();
  assert.deepEqual(reopened.profiles().map(p => [p.id, p.badgeId]), s.profiles().map(p => [p.id, p.badgeId]));
});

test('un appareil abîmé ne propage pas errors texte ni une limite quotidienne absurde', () => {
  const disk = memoryStorage();
  disk.setItem('educa2:device', JSON.stringify({ schema: 2, errors: 'oops', dailyMinutes: 1e15, classStep: 1e9,
    order: ['absent', 'absent', 3], muted: 'oui', adultPin: { salt: 'bad', hash: 'bad' } }));
  const s = store(disk);
  assert.doesNotThrow(() => s.load());
  assert.deepEqual(s.device().errors, []);
  assert.equal(s.device().dailyMinutes, 240);
  assert.equal(s.device().classStep, 65);
  assert.equal(s.device().muted, false);
  assert.equal(s.device().adultPin, null);
  assert.doesNotThrow(() => s.logError({ t: NOW, msg: 'test', where: 'unitaire' }));
  assert.equal(s.device().errors.length, 1);
});

test('updateDevice et un journal repris passent par le même assainissement', async () => {
  const { newProfile, emptyDevice } = await import('../../js/core/schema.js');
  const disk = memoryStorage();
  const p = newProfile({ name: 'Lou' }, NOW);
  const adultPin = { salt: '0123456789abcdef', hash: 'b'.repeat(64) };
  disk.setItem('educa2:pending', JSON.stringify({ version: 1, revision: 'interrompue', profiles: [p], removed: [],
    device: { ...emptyDevice(NOW), adultPin, activeId: p.id, order: [p.id, p.id], errors: 'oops', dailyMinutes: 1e9 } }));
  const s = store(disk);
  assert.equal(s.load().recovered, true);
  assert.deepEqual(s.device().adultPin, adultPin);
  assert.deepEqual(s.device().order, [p.id]);
  assert.deepEqual(s.device().errors, []);
  s.updateDevice(d => ({ ...d, muted: 'yes', errors: 'bad', dailyMinutes: -20, classStep: 999 }));
  s.flush();
  const reopened = store(disk);
  reopened.load();
  assert.equal(reopened.active().id, p.id);
  assert.equal(reopened.device().muted, false);
  assert.equal(reopened.device().dailyMinutes, 0);
  assert.equal(reopened.device().classStep, 65);
  assert.deepEqual(reopened.device().errors, []);
  assert.deepEqual(reopened.device().adultPin, adultPin);
});
