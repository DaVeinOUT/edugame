import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

let server, url, browser;
before(async () => {
  ({ server, url } = await startServer());
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); server?.close(); });

async function seeded({ sw = false, pin = false } = {}) {
  const context = await browser.newContext({ serviceWorkers: sw ? 'allow' : 'block', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector('.pick');
  await page.evaluate(async pin => {
    const { newProfile, emptyDevice } = await import('./js/core/schema.js');
    const { hashPin } = await import('./js/core/pin.js');
    const p = newProfile({ name: 'Léa', avatar: '🦊' });
    const d = { ...emptyDevice(), order: [p.id], activeId: p.id };
    if (pin) d.adultPin = await hashPin('1234');
    localStorage.setItem('educa2:device', JSON.stringify(d));
    localStorage.setItem(`educa2:p:${p.id}`, JSON.stringify(p));
  }, pin);
  await page.reload();
  await page.waitForSelector('.btn-play');
  return { context, page };
}

async function answerOne(page) {
  await page.click('.btn-play');
  await page.click('text=C\'est parti');
  await page.locator('.choice:not([disabled])').first().click();
  await page.waitForSelector('.dots i.ok, .dots i.ko');
}

test('deux onglets : une seule session écrit, puis la reprise relit la réponse sauvegardée', async () => {
  const { context, page } = await seeded();
  const second = await context.newPage();
  await second.goto(url);
  await second.waitForSelector('text=Sauvegarde protégée');
  assert.equal(await second.locator('.btn-play').count(), 0);
  await answerOne(page);
  await page.close(); // pagehide doit vider les écritures avant de libérer le verrou
  await second.click('text=Reprendre ici');
  await second.waitForSelector('.btn-play');
  const answers = await second.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('educa2:device'));
    return JSON.parse(localStorage.getItem(`educa2:p:${d.activeId}`)).stats.answers;
  });
  assert.equal(answers, 1);
  await context.close();
});

test('pagehide sans visibilité : les dernières secondes sont sauvées avant libération du verrou', async () => {
  const { context, page } = await seeded();
  await page.click('.btn-play');
  await page.waitForSelector('.intro-card');
  await page.waitForTimeout(2300);
  const seconds = await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent('pagehide'));
    const d = JSON.parse(localStorage.getItem('educa2:device'));
    return JSON.parse(localStorage.getItem(`educa2:p:${d.activeId}`)).stats.seconds;
  });
  assert.ok(seconds >= 2, `secondes avant fermeture : ${seconds}`);
  await context.close();
});

test('une panne de sauvegarde en cours de leçon reste visible et récupère la réponse sur disque', async () => {
  const { context, page } = await seeded();
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    window.__failWrites = true;
    Storage.prototype.setItem = function (key, value) {
      if (window.__failWrites && key.startsWith('educa2:')) throw new DOMException('quota', 'QuotaExceededError');
      return write.call(this, key, value);
    };
  });
  await answerOne(page);
  await page.waitForSelector('.save-status:not([hidden])');
  await page.evaluate(() => { window.__failWrites = false; });
  await page.waitForSelector('.save-status', { state: 'hidden' });
  await page.reload();
  await page.waitForSelector('.btn-play');
  const stats = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('educa2:device'));
    return JSON.parse(localStorage.getItem(`educa2:p:${d.activeId}`)).stats;
  });
  assert.equal(stats.answers, 1);
  assert.equal(stats.sessions, 0, 'une sortie précoce ne crée pas de séance terminée');
  await context.close();
});

test('effacement complet : les sons IndexedDB et les profils disparaissent après rechargement', async () => {
  const { context, page } = await seeded();
  await page.evaluate(async () => {
    const { saveRecording } = await import('./js/services/recordings.js');
    await saveRecording('m', new Blob(['témoin'], { type: 'audio/webm' }));
  });
  await page.click('button[aria-label="Espace des grands"]');
  const words = (await page.textContent('.panel .h1')).split(',').map(w => w.trim());
  const numbers = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  for (const word of words) await page.click(`.gate-pad button:text-is("${numbers.indexOf(word)}")`);
  await page.click('[role="tablist"] >> text="Données"');
  await page.click('text=Tout effacer sur cet appareil');
  await page.click('text=Confirmer : TOUT effacer');
  await page.waitForSelector('.screen-welcome');
  const remaining = await page.evaluate(async () => {
    const { loadRecordings } = await import('./js/services/recordings.js');
    return { sounds: (await loadRecordings()).size, profiles: Object.keys(localStorage).filter(k => k.startsWith('educa2:p:')).length };
  });
  assert.deepEqual(remaining, { sounds: 0, profiles: 0 });
  await context.close();
});

test('diagnostic hors ligne : un fichier manquant invalide le statut prêt', async () => {
  const { context, page } = await seeded({ sw: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  const status = await page.evaluate(async () => {
    const { createOfflineStatus } = await import('./js/services/offline.js');
    const registration = await navigator.serviceWorker.ready;
    const diagnostic = createOfflineStatus();
    const before = await diagnostic.check(registration.active);
    const cacheName = (await caches.keys()).find(k => k.startsWith('educa-'));
    const cache = await caches.open(cacheName);
    await cache.delete(new URL('audio/mots/moto.mp3', location.href).href);
    const after = await diagnostic.check(registration.active);
    return { before, after, status: diagnostic.status };
  });
  assert.deepEqual(status, { before: true, after: false, status: 'failed' });
  await context.close();
});

test('une mise à jour ne recharge pas la leçon si la sauvegarde échoue', async () => {
  const { context, page } = await seeded({ sw: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // contrôleur présent au démarrage de main
  await page.waitForSelector('.btn-play');
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    window.__failWrites = true;
    Storage.prototype.setItem = function (key, value) {
      if (window.__failWrites && key.startsWith('educa2:')) throw new DOMException('quota', 'QuotaExceededError');
      return write.call(this, key, value);
    };
  });
  await answerOne(page);
  await page.waitForSelector('.save-status:not([hidden])');
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.screen-lesson').count(), 1, 'les progrès en mémoire restent accessibles');
  await page.evaluate(() => { window.__failWrites = false; });
  await page.waitForSelector('.save-status', { state: 'hidden' });
  await context.close();
});

test('création protégée : le formulaire autorisé depuis les données adulte aboutit puis reverrouille', async () => {
  const { context, page } = await seeded({ pin: true });
  await page.click('button[aria-label="Espace des grands"]');
  for (const digit of ['1', '2', '3', '4']) await page.click(`.gate-pad button:text-is("${digit}")`);
  await page.click('[role="tablist"] >> text="Données"');
  await page.click('text=Ajouter un enfant');
  await page.locator('.pick').first().click();
  await page.waitForSelector('text=Quel âge as-tu ?');
  await page.locator('.choice-big').first().click();
  await page.waitForSelector('text=Dans quel monde veux-tu jouer ?');
  await page.locator('.choice-big').first().click();
  await page.waitForSelector('input.input');
  await page.fill('input.input', 'Tom');
  assert.ok(await page.locator('.profile-identity-preview .profile-badge').isVisible());
  await page.click('text=C\'est parti');
  await page.waitForSelector('.hub-name:text-is("Tom")');
  const badges = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('educa2:device'));
    return d.order.map(id => JSON.parse(localStorage.getItem(`educa2:p:${id}`)).badgeId);
  });
  assert.equal(badges.length, 2);
  assert.equal(new Set(badges).size, 2);
  await page.click('button[aria-label="Espace des grands"]');
  await page.waitForSelector('.gate-pad');
  assert.equal(await page.locator('[role="tablist"]').count(), 0);
  await context.close();
});
