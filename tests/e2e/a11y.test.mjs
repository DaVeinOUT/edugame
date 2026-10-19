/* ============================================================
   A11Y.TEST.MJS — Accessibilité vérifiée par axe-core (WCAG 2.2 AA)
   Chaque écran que voit l'enfant ou l'adulte est audité, dans un
   monde clair et dans le monde sombre (« l'espace »), ainsi que
   chaque type d'exercice des niveaux des grands. Toute violation
   « grave » ou « critique » fait échouer le test.
   (bypassCSP : seulement pour injecter axe ; le jeu, lui, garde sa CSP.)
   ============================================================ */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const AXE = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const SETTLE_MS = 700;   // fin des animations d'entrée (sinon contrastes faussés en plein fondu)
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

async function open() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', bypassCSP: true });
  return { context, page: await context.newPage() };
}

/** Violations graves de l'écran affiché, sous forme lisible. */
async function audit(page, label) {
  await page.waitForTimeout(SETTLE_MS);
  const found = await page.evaluate(async ({ src, tags }) => {
    if (!window.axe) (0, eval)(src);
    // axe ne sait pas mesurer un contraste sur un dégradé : on pose, le temps de l'audit, la couleur
    // la plus défavorable du fond (la plus claire en monde sombre, la plus foncée sinon).
    const dark = document.body.classList.contains('u-space');
    const worst = getComputedStyle(document.body).getPropertyValue(dark ? '--bg1' : '--bg2').trim();
    const before = document.body.style.background;
    document.body.style.background = worst;
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    document.body.style.background = before;
    return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
      .map(v => `${v.id} : ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
  }, { src: AXE, tags: TAGS });
  // Même famille de défauts : une valeur absente affichée telle quelle à l'enfant.
  const text = await page.evaluate(() => document.body.innerText);
  const leaked = text.match(/\bnull\b|\bundefined\b|\[object \w+\]|\bNaN\b/);
  if (leaked) found.push(`texte technique affiché : « ${leaked[0]} »`);
  return found.map(f => `${label} → ${f}`);
}

async function createChild(page, problems, { world = 0, name = 'Léa' } = {}) {
  await page.goto(url);
  problems.push(...await audit(page, 'bienvenue'));
  await page.click('.pick >> nth=0');
  await page.waitForSelector('text=Quel âge as-tu ?');
  problems.push(...await audit(page, 'âge'));
  await page.click('.choice-big >> nth=0');
  await page.waitForSelector('text=Dans quel monde veux-tu jouer ?');
  problems.push(...await audit(page, 'monde'));
  await page.click(`.choice-big >> nth=${world}`);
  await page.waitForSelector('input.input');
  problems.push(...await audit(page, 'prénom'));
  await page.fill('input.input', name);
  await page.click('text=C\'est parti');
  await page.waitForSelector('.btn-play');
}

async function childScreens(page, problems, tag) {
  problems.push(...await audit(page, `${tag} accueil`));
  for (const [tile, label] of [['Le chemin', 'chemin'], ['Mes cartes', 'cartes'], ['Jeux', 'jeux'], ['Niveaux', 'niveaux']]) {
    await page.click(`.tile:has-text("${tile}")`);
    problems.push(...await audit(page, `${tag} ${label}`));
    await page.goBack();
    await page.waitForSelector('.btn-play');
  }
  await page.click('.elo-badge');
  problems.push(...await audit(page, `${tag} échelle`));
  await page.goBack();
  await page.click('.btn-play');
  await page.waitForSelector('text=C\'est parti');
  problems.push(...await audit(page, `${tag} leçon (présentation)`));
  await page.click('text=C\'est parti');
  problems.push(...await audit(page, `${tag} leçon (question)`));
}

test('écrans de l\'enfant, monde clair : aucune violation WCAG 2.2 AA grave', async () => {
  const { context, page } = await open();
  const problems = [];
  await createChild(page, problems, { world: 0 });
  await childScreens(page, problems, 'jungle');
  assert.deepEqual(problems, []);
  await context.close();
});

test('monde sombre (« l\'espace ») : contrastes conformes partout', async () => {
  const { context, page } = await open();
  const problems = [];
  await createChild(page, problems, { world: 2, name: 'Noé' });
  await childScreens(page, problems, 'espace');
  assert.deepEqual(problems, []);
  await context.close();
});

test('espace des grands : la porte et tous les onglets, monde clair et monde sombre', async () => {
  const problems = [];
  for (const [world, tag] of [[0, 'clair'], [2, 'sombre']]) {
    const { context, page } = await open();
    await createChild(page, problems, { world });
    await page.click('button[aria-label="Espace des grands"]');
    problems.push(...await audit(page, `porte (${tag})`));
    const words = (await page.textContent('.panel .h1')).split(',').map(w => w.trim());
    for (const w of words) await page.click(`.gate-pad button:text-is("${WORDS.indexOf(w)}")`);
    await page.waitForSelector('[role="tablist"]');
    const tabs = await page.$$eval('[role="tablist"] [role="tab"], [role="tablist"] button', els => els.map(e => e.textContent.trim()));
    for (const t of tabs) {
      await page.click(`[role="tablist"] >> text="${t}"`);
      problems.push(...await audit(page, `adulte (${tag}) · ${t}`));
    }
    assert.ok(tabs.length >= 4, `onglets trouvés : ${tabs}`);
    await context.close();
  }
  assert.deepEqual(problems, []);
});

test('niveaux des grands : chaque type d\'exercice, la correction et le bilan', async () => {
  const { context, page } = await open();
  await page.goto(url);
  await page.evaluate(() => {
    const now = Date.now();
    const id = 'pa11y001';
    localStorage.setItem('educa2:device', JSON.stringify({
      schema: 2, createdAt: now, voice: null, muted: true, activeId: id, order: [id], classStep: null, dailyMinutes: 0, errors: [],
    }));
    localStorage.setItem(`educa2:p:${id}`, JSON.stringify({
      id, createdAt: now, name: 'Inès', avatar: '🦊', age: '7-9', universe: 'ocean',
      path: { open: 65, stars: {}, placed: true, advanced: true },
    }));
  });
  await page.reload();
  await page.waitForSelector('.btn-play');
  await page.click('.tile:has-text("Niveaux")');
  await page.click('.module-btn.next');
  const problems = [...await audit(page, 'présentation du module')];
  await page.click('text=C\'est parti');
  const seen = new Set();
  let wrongDone = false;
  const ALL = ['trou', 'texte', 'ordre', 'mot à toucher', 'correction'];
  // Un module tire 12 questions au hasard : on enchaîne les modules tant qu'un type manque.
  for (let round = 0; round < 4; round++) {
    const deadline = Date.now() + 150000;
    while (Date.now() < deadline && !(await page.$('.elo-panel'))) {
      const type = await page.evaluate(() => (document.querySelector('.gap-hole') ? 'trou' : document.querySelector('.wpick') ? 'mot à toucher'
        : document.querySelector('.order-line') ? 'ordre' : document.querySelector('.adv-passage') ? 'texte' : 'question'));
      if (!seen.has(type) && await page.$('.choice:not([disabled]), .wpick:not([disabled]), .gtile:not(.used)')) {
        seen.add(type);
        problems.push(...await audit(page, `exercice : ${type}`));
      }
      const cont = await page.$('button[aria-label="Continuer"]:not([hidden])');
      if (cont) {
        if (!seen.has('correction')) { seen.add('correction'); problems.push(...await audit(page, 'correction')); }
        await cont.evaluate(el => el.scrollIntoView({ block: 'center' }));
        await cont.click({ force: true });
        continue;
      }
      let target;
      if (!wrongDone && await page.$('.choice.textopt:not([disabled])')) {
        wrongDone = true;   // une erreur exprès, pour auditer l'écran de correction
        const all = await page.$$('.choice.textopt:not([disabled])');
        target = all[all.length - 1];
      } else {
        target = await page.$('.gtile.hint') || await page.$('.gtile:not(.used)') || await page.$('.wpick:not([disabled])') || await page.$('.choice:not([disabled])');
      }
      if (target) { await target.evaluate(el => el.scrollIntoView({ block: 'center' })); await target.click({ force: true }); }
      await page.waitForTimeout(150);
    }
    assert.ok(await page.$('.elo-panel'), 'le bilan doit s\'afficher');
    if (round === 0) problems.push(...await audit(page, 'bilan du module'));
    if (ALL.every(t => seen.has(t))) break;
    await page.click('.stack .btn-gold');           // « Module suivant ▶ » (ou « Rejouer »)
    await page.click('text=C\'est parti');
  }
  assert.ok(ALL.every(t => seen.has(t)), `types vus : ${[...seen]}`);
  assert.deepEqual(problems, []);
  await context.close();
});

test('vue de la classe : accessible, et le tableur exporté est lisible', async () => {
  const { context, page } = await open();
  await page.goto(url);
  await page.evaluate(() => {
    const now = Date.now();
    const kids = [['pclasse01', 'Léa', '🦊'], ['pclasse02', 'Malik', '🐼']];
    localStorage.setItem('educa2:device', JSON.stringify({
      schema: 2, createdAt: now, voice: null, muted: true, activeId: kids[0][0], order: kids.map(k => k[0]), classStep: null, dailyMinutes: 0, errors: [],
    }));
    for (const [id, name, avatar] of kids) {
      localStorage.setItem(`educa2:p:${id}`, JSON.stringify({ id, createdAt: now, name, avatar, age: '7-9', universe: 'jungle', path: { open: 3, stars: {} } }));
    }
  });
  await page.reload();
  await page.waitForSelector('.who');                                  // plusieurs enfants : « Qui joue ? »
  const problems = await audit(page, 'qui joue');
  await page.click('button[aria-label="Espace des grands"]');
  const words = (await page.textContent('.panel .h1')).split(',').map(w => w.trim());
  for (const w of words) await page.click(`.gate-pad button:text-is("${WORDS.indexOf(w)}")`);
  await page.waitForSelector('[role="tablist"]');
  await page.click('[role="tablist"] >> text="La classe"');
  await page.waitForSelector('.class-table');
  problems.push(...await audit(page, 'la classe'));
  const names = await page.$$eval('.class-table tbody tr', trs => trs.map(tr => tr.querySelector('td').textContent));
  assert.equal(names.length, 2);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('text=Exporter en tableur')]);
  const csv = readFileSync(await download.path(), 'utf8');
  assert.ok(csv.startsWith('﻿Enfant;Force de lecture;'), csv.slice(0, 40));
  assert.ok(csv.includes('Léa;') && csv.includes('Malik;'));
  assert.deepEqual(problems, []);
  await context.close();
});

test('pages publiques (guide de l\'enseignant, confidentialité) : accessibles', async () => {
  const { context, page } = await open();
  const problems = [];
  for (const [file, label] of [['guide.html', 'guide'], ['confidentialite.html', 'confidentialité']]) {
    await page.goto(url + file);
    await page.waitForSelector('h1');
    problems.push(...await audit(page, label));
  }
  assert.deepEqual(problems, []);
  await context.close();
});
