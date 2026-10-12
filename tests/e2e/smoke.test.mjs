/* ============================================================
   SMOKE.TEST.MJS — Le jeu de bout en bout, dans un vrai navigateur
   1. Un enfant se crée un profil sans savoir lire, et arrive à l'accueil.
   2. Il fait une leçon complète : bilan, Élo, progression enregistrée.
   3. L'espace des grands est protégé par un défi de lecture.
   4. Après une première visite, le jeu fonctionne SANS internet.
   Navigateur : CHROMIUM_PATH (ex. /usr/bin/chromium) ou celui de Playwright.
   ============================================================ */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
let server;
let url;
let browser;

before(async () => {
  ({ server, url } = await startServer(ROOT));
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
});
after(async () => {
  await browser?.close();
  server?.close();
});

async function open({ sw = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: sw ? 'allow' : 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return { context, page, errors };
}

async function createChild(page, name = 'Léa') {
  await page.goto(url);
  await page.click('.pick >> nth=0');
  await page.waitForSelector('text=Quel âge as-tu ?');
  await page.click('.choice-big >> nth=1');
  await page.waitForSelector('text=Dans quel monde veux-tu jouer ?');
  await page.click('.choice-big >> nth=0');
  await page.waitForSelector('input.input');
  await page.fill('input.input', name);
  await page.click('text=C\'est parti');
  await page.waitForSelector('.btn-play');
}

test('un enfant crée son profil sans lire et arrive à l\'accueil', async () => {
  const { context, page, errors } = await open();
  await createChild(page);
  assert.equal(await page.textContent('.hub-name'), 'Léa');
  assert.ok(await page.isVisible('.elo-badge'));
  assert.deepEqual(errors, []);
  await context.close();
});

test('une leçon complète mène au bilan et enregistre la progression', async () => {
  const { context, page, errors } = await open();
  await createChild(page);
  await page.click('.btn-play');
  await page.click('text=C\'est parti');
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline && !(await page.$('.elo-panel'))) {
    const hint = await page.$('.gtile.hint');
    const tile = hint || await page.$('.gtile:not(.used)');
    if (tile) await tile.click({ force: true });
    else {
      const choice = await page.$('.choice:not([disabled])');
      if (choice) await choice.click({ force: true });
    }
    const cont = await page.$('button[aria-label="Continuer"]:not([hidden])');
    if (cont) await cont.click({ force: true });
    await page.waitForTimeout(250);
  }
  assert.ok(await page.$('.elo-panel'), 'le bilan doit s\'afficher');
  const stats = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('educa2:p:'));
    return JSON.parse(localStorage.getItem(key)).stats;
  });
  assert.ok(stats.answers >= 10, `réponses enregistrées : ${stats.answers}`);
  assert.equal(stats.sessions, 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test('l\'espace des grands demande de lire des chiffres écrits en lettres', async () => {
  const { context, page, errors } = await open();
  await createChild(page);
  await page.click('button[aria-label="Espace des grands"]');
  const words = (await page.textContent('.panel .h1')).split(',').map(w => w.trim());
  for (const w of words) await page.click(`.gate-pad button:text-is("${WORDS.indexOf(w)}")`);
  await page.waitForSelector('[role="tablist"]');
  assert.ok(await page.isVisible('text=Force de lecture (Élo)'));
  assert.deepEqual(errors, []);
  await context.close();
});

test('les sons purs synthétisés ont la bonne couleur (s aigu, m grave) et ne saturent pas', async () => {
  const { context, page } = await open();
  await page.goto(url);
  const res = await page.evaluate(async () => {
    const { renderPhoneme } = await import('./js/services/phonemes.js');
    const measure = async ph => {
      const ctx = new OfflineAudioContext(1, 44100 * 2, 44100);
      const dur = renderPhoneme(ctx, ph, 0.01);
      const data = (await ctx.startRendering()).getChannelData(0);
      let zc = 0; let sum = 0; let peak = 0;
      for (let i = 1; i < data.length; i++) {
        if ((data[i - 1] < 0) !== (data[i] < 0)) zc++;
        sum += data[i] * data[i];
        peak = Math.max(peak, Math.abs(data[i]));
      }
      const n = Math.max(1, Math.round(dur * 44100));
      return { zcr: zc / n, rms: Math.sqrt(sum / n), peak, dur };
    };
    return { s: await measure('s'), ch: await measure('ch'), m: await measure('m'), p: await measure('p') };
  });
  assert.ok(res.s.zcr > res.ch.zcr && res.ch.zcr > res.m.zcr, `ordre aigu→grave attendu : ${JSON.stringify(res)}`);
  for (const [ph, r] of Object.entries(res)) {
    assert.ok(r.rms > 0.01, `${ph} trop faible`);
    assert.ok(r.peak <= 1, `${ph} sature`);
  }
  assert.ok(res.p.dur < 0.6, 'un petit bruit sec reste court');
  await context.close();
});

test('après une première visite, le jeu marche sans internet', async () => {
  const { context, page } = await open({ sw: true });
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.pick', { timeout: 15000 });
  // Charger la police de lecture hors-ligne : elle doit venir du cache.
  const fontsOk = await page.evaluate(async () => {
    await document.fonts.load('700 20px Andika');
    return document.fonts.check('700 20px Andika');
  });
  assert.ok(fontsOk, 'les polices doivent venir du cache');
  await context.close();
});
