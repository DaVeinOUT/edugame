/* Reproducible proofs on an isolated fictional profile, never on a child's data. */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { startServer } from '../../tests/e2e/server.mjs';
const out = resolve(process.argv[2] || 'docs/verification/2026-10-25/kaya-production');
await mkdir(out, { recursive: true });
const { server, url } = await startServer();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    recordVideo: { dir: out, size: { width: 390, height: 844 } } });
  const page = await context.newPage(); const errors = [], timeline = [];
  const startedAt = Date.now();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url); await page.waitForSelector('.pick');
  await page.evaluate(async () => {
    const { newProfile, emptyDevice } = await import('./js/core/schema.js');
    const p = newProfile({ name: 'Léa', avatar: '🦊' });
    localStorage.setItem('educa2:device', JSON.stringify({ ...emptyDevice(), order: [p.id], activeId: p.id, muted: true }));
    localStorage.setItem(`educa2:p:${p.id}`, JSON.stringify(p));
  });
  await page.reload(); await page.waitForSelector('[data-model="gltf"]');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/accueil.png`, fullPage: true });
  const capture = async (name, trigger) => {
    await page.waitForTimeout(450);
    const data = await page.$eval('[data-kaya-companion]', el => ({ state: el.dataset.state, ...el.querySelector('canvas').dataset,
      rig: el.querySelector('canvas')._kayaInspect() }));
    timeline.push({ name, trigger, secondsSincePage: (Date.now() - startedAt) / 1000, ...data });
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.waitForTimeout(name === 'salut' || name === 'celebration' || name === 'encouragement' ? 2100 : 850);
  };
  await page.getByRole('button', { name: 'Saluer Kaya', exact: true }).click();
  await capture('salut', 'bouton réel Saluer Kaya');
  for (const [name, event] of [['ecoute', 'attentive'], ['aide', 'help'], ['encouragement', 'encourage'], ['celebration', 'success']]) {
    await page.evaluate(async event => {
      const { companionEvent } = await import('./js/ui/kaya.js');
      const el = document.querySelector('[data-kaya-companion]');
      companionEvent(el, 'attentive'); companionEvent(el, event, ['success', 'encourage'].includes(event) ? 2600 : undefined);
    }, event);
    await capture(name, `événement explicite ${event} pour démontrer le clip, sans réponse évaluée`);
  }
  await page.getByRole('button', { name: 'Repos', exact: true }).click();
  await capture('repos', 'bouton réel Repos');
  await page.getByRole('button', { name: 'Réveiller Kaya', exact: true }).click();
  // Actual lesson navigation, with compact companion in the reserved top bar.
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('educa2:device')); d.muted = false; localStorage.setItem('educa2:device', JSON.stringify(d)); });
  await page.reload(); await page.waitForSelector('[data-model="gltf"]');
  await page.click('.btn-play'); await page.waitForSelector('.intro-card');
  await page.click('text=C\'est parti'); await page.locator('.choice:not([disabled])').first().click();
  await page.waitForSelector('.dots i.ok, .dots i.ko');
  await page.screenshot({ path: `${out}/exercice.png`, fullPage: true });
  const video = page.video(); await context.close();
  await video.saveAs(`${out}/animations-parcours.webm`);
  const originalVideo = await video.path();
  if (originalVideo !== `${out}/animations-parcours.webm`) await rm(originalVideo);
  await writeFile(`${out}/proof.json`, JSON.stringify({ viewport: '390×844', browser: await browser.version(),
    timeline, errors, note: 'Les réactions techniques et les actions réelles sont distinguées dans timeline.' }, null, 2));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Captures et vidéo écrites dans ${out}`);
} finally { await browser.close(); server.close(); }
