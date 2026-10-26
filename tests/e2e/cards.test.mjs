import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let server; let url; let browser;
before(async () => {
  ({ server, url } = await startServer(ROOT));
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); server?.close(); });

async function collection({ sw = false, reduced = false, missing = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    serviceWorkers: sw ? 'allow' : 'block', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  if (missing) await page.route('**/assets/cards/**', route => route.abort());
  await page.goto(url);
  // Profil v2 ancien, incomplet : sa collection et son compteur doivent survivre.
  await page.evaluate(() => {
    const now = Date.now(); const id = 'pcards001';
    localStorage.setItem('educa2:device', JSON.stringify({ schema: 2, createdAt: now, muted: true, activeId: id, order: [id] }));
    localStorage.setItem(`educa2:p:${id}`, JSON.stringify({ id, createdAt: now, name: 'Léa', avatar: '🦊', age: '7-9', universe: 'jungle',
      cards: ['son-m', 'r_first', 'diplome-n3'], stats: { answers: 24, sessions: 2 }, path: { open: 8, stars: {} } }));
  });
  await page.reload();
  await page.waitForSelector('.btn-play');
  await page.click('.tile:has-text("Mes cartes")');
  await page.waitForSelector('.collection');
  return { context, page };
}
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('educa2:p:pcards001')));

test('navigation pendant une carte : la fermeture ne coupe pas la nouvelle consigne', async () => {
  const { context, page } = await collection();
  try {
    const events = await page.evaluate(async () => {
      const { createRouter } = await import('./js/ui/router.js');
      const { revealCard } = await import('./js/ui/cards.js');
      const root = document.createElement('div'); document.body.append(root);
      const events = [];
      const voice = { say: text => events.push(text), stop: () => events.push('stop') };
      const router = createRouter({ root, ctx: {} });
      router.register('card', { mount() { revealCard({ router, voice, sfx: {} }, {
        id: 'son-m', kind: 'son', show: 'm', name: 'Le son m', desc: 'moto', theme: 'theme-teal', n: 7,
      }, 83); } });
      router.register('next', { mount() { voice.say('Nouvelle consigne'); } });
      router.go('card'); router.go('next');
      await Promise.resolve();
      root.remove();
      return events;
    });
    assert.equal(events.at(-1), 'Nouvelle consigne');
    assert.ok(events.includes('stop'));
  } finally { await context.close(); }
});

test('cartes illustrées et diplômes : ancien profil, rechargement, textes et compteur préservés', async () => {
  const { context, page } = await collection();
  try {
    assert.match(await page.textContent('h1'), /3\/83/);
    assert.equal(await page.locator('.illustrated-thumb img').count(), 2);
    assert.ok(await page.getByRole('button', { name: 'Diplôme CE1-CE2', exact: true }).isVisible());
    await page.getByRole('button', { name: 'Le son m', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.card-front img')?.naturalWidth > 0);
    await page.getByRole('button', { name: 'Retourner la carte' }).click();
    assert.equal(await page.textContent('.illustrated-graph'), 'm');
    assert.match(await page.textContent('.letter-word'), /moto/);
    assert.equal(await page.$eval('.illustrated-graph', el => getComputedStyle(el).fontFamily.includes('Andika')), true);
    assert.equal(await page.$eval('.card-image-stack img', el => getComputedStyle(el).objectFit), 'contain');
    assert.ok(await page.getByRole('button', { name: 'Continuer', exact: true }).isVisible());
    await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    assert.equal((await saved(page)).stats.answers, 24);
    await page.reload();
    await page.waitForSelector('.btn-play');
    await page.click('.tile:has-text("Mes cartes")');
    assert.match(await page.textContent('h1'), /3\/83/);
    assert.deepEqual((await saved(page)).cards, ['son-m', 'r_first', 'diplome-n3']);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally { await context.close(); }
});

test('modale : Tab et Maj+Tab restent dans la carte, Échap et retour restaurent le focus', async () => {
  const { context, page } = await collection();
  try {
    const trigger = page.getByRole('button', { name: 'Le son m', exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.classList.contains('card-wrap'));
    assert.equal(await page.$eval('#app', el => el.inert), true);
    await page.keyboard.press('Shift+Tab');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Fermer la fenêtre');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Retourner la carte');
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    assert.equal(await page.$eval('#app', el => el.inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Le son m');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role="dialog"]');
    await page.goBack();
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    assert.ok(await page.isVisible('.collection'));
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Le son m');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role="dialog"]');
    // Un conflit de stockage peut verrouiller le jeu pendant une modale.
    await page.$eval('#app', el => { el.dataset.writeBlocked = ''; el.inert = true; });
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    assert.equal(await page.$eval('#app', el => el.inert), true, 'la fermeture ne déverrouille pas les écritures en conflit');
  } finally { await context.close(); }
});

test('fichier absent et réduction des mouvements : secours lisible et retournement utilisable', async () => {
  const { context, page } = await collection({ reduced: true, missing: true });
  try {
    await page.getByRole('button', { name: 'Le son m', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.card-front img')?.complete);
    assert.equal(await page.$eval('.card-image-stack', el => el.classList.contains('has-card-image')), false);
    assert.equal(await page.$eval('.card-image-stack .image-fallback', el => getComputedStyle(el).visibility), 'visible');
    await page.getByRole('button', { name: 'Retourner la carte' }).click();
    await page.mouse.move(40, 120);
    assert.equal(await page.$eval('.card-wrap', el => getComputedStyle(el).transform), 'none');
    assert.ok(await page.getByRole('button', { name: 'Continuer', exact: true }).isVisible());
    await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    assert.equal((await saved(page)).stats.answers, 24);
  } finally { await context.close(); }
});

test('après installation complète, les deux illustrations sont consultables sans réseau', async () => {
  const { context, page } = await collection({ sw: true });
  try {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('.btn-play');
    await page.waitForSelector('.kaya[data-renderer="3d"] canvas');
    await page.click('.tile:has-text("Mes cartes")');
    for (const name of ['Le son m', 'Première leçon']) {
      await page.getByRole('button', { name, exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.card-front img')?.naturalWidth > 0);
      await page.getByRole('button', { name: 'Retourner la carte' }).click();
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    }
    assert.equal((await saved(page)).stats.answers, 24);
  } finally { await context.close(); }
});
