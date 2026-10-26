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

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('educa2:p:psupport01')));
const numbers = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];

test('ancien profil : audio demandé et guidage restent distincts après réponse, rechargement et consultation adulte', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(url); await page.waitForSelector('.pick');
    await page.evaluate(async () => {
      const { newProfile, emptyDevice } = await import('./js/core/schema.js');
      const p = { ...newProfile({ name: 'Léa' }), id: 'psupport01', wallet: 10 };
      delete p.support; // un profil déjà utilisé avant instrumentation
      p.path.open = 12; p.stats.answers = 24; p.stats.correct = 20;
      localStorage.setItem('educa2:device', JSON.stringify({ ...emptyDevice(), muted: true, order: [p.id], activeId: p.id }));
      localStorage.setItem(`educa2:p:${p.id}`, JSON.stringify(p));
    });
    await page.reload(); await page.waitForSelector('.btn-play');
    await page.click('.tile:has-text("Jeux")');
    await page.getByRole('button', { name: 'Lire des mots et des phrases', exact: true }).click();
    await page.waitForSelector('.big-word');
    const first = await page.textContent('.big-word');
    await page.getByRole('button', { name: `Écouter : ${first}`, exact: true }).click();
    await page.getByRole('button', { name: 'Réécouter la consigne', exact: true }).click();
    await page.locator(`.choice[data-id="${first}"]`).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('educa2:p:psupport01'))?.support?.recent.length === 1);
    const afterAudio = await saved(page);
    assert.equal(afterAudio.support.recent[0].outcome, 'ok');
    assert.deepEqual(afterAudio.support.recent[0].methods, { 'instruction-replay': 1, 'option-audio': 1 });
    assert.equal(afterAudio.wallet, 11);

    await page.waitForSelector('.choice:not([disabled])');
    const second = await page.textContent('.big-word');
    await page.getByRole('button', { name: 'Aide de Kaya', exact: true }).click();
    await page.locator(`.choice[data-id="${second}"]`).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('educa2:p:psupport01'))?.support?.recent.length === 2);
    const afterHelp = await saved(page);
    assert.equal(afterHelp.support.recent[1].outcome, 'help');
    assert.deepEqual(afterHelp.support.recent[1].methods, { 'explicit-help': 1, 'text-audio': 1 });
    assert.equal(new Set(afterHelp.support.recent.map(r => r.id)).size, 2);
    assert.equal(afterHelp.wallet, 11, 'le guidage conserve les conditions de gain existantes');
    assert.equal(afterHelp.stats.answers, 26);
    assert.equal(afterHelp.stats.correct, 21);
    await page.getByRole('button', { name: 'Arrêter', exact: true }).click();
    await page.waitForSelector('.btn-play');
    await page.reload(); await page.waitForSelector('.btn-play');
    assert.deepEqual((await saved(page)).support, afterHelp.support);

    await page.getByRole('button', { name: 'Espace des grands', exact: true }).click();
    const words = (await page.textContent('.panel .h1')).split(',').map(w => w.trim());
    for (const word of words) await page.locator(`.gate-pad button:text-is("${numbers.indexOf(word)}")`).click();
    await page.getByRole('heading', { name: 'Aides et aménagements observés', exact: true }).waitFor();
    const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Aides et aménagements observés', exact: true }) });
    assert.match(await panel.textContent(), /2 dernières réponses documentées/);
    assert.match(await panel.textContent(), /24 autres réponses sans détail conservé/);
    assert.match(await panel.textContent(), /1 avec support audio demandé/);
    assert.match(await panel.textContent(), /1 guidées/);
  } finally { await context.close(); }
});
