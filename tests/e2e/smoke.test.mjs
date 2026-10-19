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

async function createChild(page, name = 'Léa', age = 0) {
  await page.goto(url);
  await page.click('.pick >> nth=0');
  await page.waitForSelector('text=Quel âge as-tu ?');
  await page.click(`.choice-big >> nth=${age}`);
  await page.waitForSelector('text=Dans quel monde veux-tu jouer ?');
  await page.click('.choice-big >> nth=0');
  await page.waitForSelector('input.input');
  await page.fill('input.input', name);
  await page.click('text=C\'est parti');
  if (age === 0) await page.waitForSelector('.btn-play');
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
    if (tile) { await tile.evaluate(el => el.scrollIntoView({ block: 'center' })); await tile.click({ force: true }); }
    else {
      const choice = await page.$('.choice:not([disabled])');
      if (choice) { await choice.evaluate(el => el.scrollIntoView({ block: 'center' })); await choice.click({ force: true }); }
    }
    const cont = await page.$('button[aria-label="Continuer"]:not([hidden])');
    if (cont) { await cont.evaluate(el => el.scrollIntoView({ block: 'center' })); await cont.click({ force: true }); }
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

test('dès 10 ans, un test de positionnement situe l\'enfant sur le chemin', async () => {
  const { context, page, errors } = await open();
  await createChild(page, 'Sam', 2);
  await page.waitForSelector('text=On joue !');
  await page.click('text=On joue !');
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline && !(await page.$('text=C\'est parti ▶'))) {
    const c = await page.$('.choice:not([disabled])');
    if (c) await c.click({ force: true });
    await page.waitForTimeout(300);
  }
  await page.click('text=C\'est parti ▶');
  await page.waitForSelector('.btn-play');
  const path = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('educa2:p:'));
    return JSON.parse(localStorage.getItem(key)).path;
  });
  assert.equal(path.placed, true);
  assert.deepEqual(errors, []);
  await context.close();
});

test('après une première visite, le jeu marche sans internet', async () => {
  const { context, page } = await open({ sw: true });
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  // Safari lit l'audio par morceaux : le service worker doit répondre 206 à une requête Range.
  const range = await page.evaluate(async () => {
    const r = await fetch('audio/mots/chat.mp3', { headers: { Range: 'bytes=0-1' } });
    return { status: r.status, size: (await r.arrayBuffer()).byteLength, cr: r.headers.get('Content-Range') };
  });
  assert.equal(range.status, 206);
  assert.equal(range.size, 2);
  assert.match(range.cr || '', /^bytes 0-1\/\d+$/);
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

test('la voix enregistrée par l\'adulte (blob:) est bien jouée malgré la CSP', async () => {
  const { context, page, errors } = await open();
  await createChild(page, 'Noé');
  const out = await page.evaluate(async () => {
    const blocked = [];
    document.addEventListener('securitypolicyviolation', e => blocked.push(e.violatedDirective));
    const played = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const p = play.call(this);
      p.then(() => played.push('ok'), e => played.push(e.name));
      return p;
    };
    // WAV silencieux de 0,2 s : ce que produit un enregistrement, sans micro.
    const n = 1600;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    const { voice } = await import('./js/services/voice.js');
    voice.setRecordings(new Map([['a', URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))]]));
    await voice.sound('a');
    return { blocked, played };
  });
  assert.deepEqual(out.blocked, [], 'aucune violation de CSP');
  // (l'accueil peut aussi faire entendre le son du jour : au moins une lecture, aucun échec)
  assert.ok(out.played.length >= 1 && out.played.every(x => x === 'ok'), `lecture : ${out.played}`);
  assert.deepEqual(errors, []);
  await context.close();
});

test('un grand déjà lecteur joue un module des niveaux CE1 → 3e', async () => {
  const { context, page, errors } = await open();
  await page.goto(url);
  // Un collégien que le positionnement a reconnu lecteur (chemin des sons acquis).
  await page.evaluate(() => {
    const now = Date.now();
    const id = 'pgrand001';
    localStorage.setItem('educa2:device', JSON.stringify({
      schema: 2, createdAt: now, voice: null, muted: false, activeId: id, order: [id], classStep: null, dailyMinutes: 0, errors: [],
    }));
    localStorage.setItem(`educa2:p:${id}`, JSON.stringify({
      id, createdAt: now, name: 'Inès', avatar: '🦊', age: '13-15', universe: 'jungle',
      path: { open: 65, stars: {}, placed: true, advanced: true },
    }));
  });
  await page.reload();
  await page.waitForSelector('.btn-play');
  assert.match(await page.textContent('.btn-play'), /^▶\s*Jouer/);
  await page.click('.tile:has-text("Niveaux")');
  await page.click('.module-btn.next');
  await page.click('text=C\'est parti');
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline && !(await page.$('.elo-panel'))) {
    const target = await page.$('.gtile.hint') || await page.$('.gtile:not(.used)')
      || await page.$('.wpick:not([disabled])') || await page.$('.choice:not([disabled])');
    if (target) { await target.evaluate(el => el.scrollIntoView({ block: 'center' })); await target.click({ force: true }); }
    const cont = await page.$('button[aria-label="Continuer"]:not([hidden])');
    if (cont) { await cont.evaluate(el => el.scrollIntoView({ block: 'center' })); await cont.click({ force: true }); }
    await page.waitForTimeout(200);
  }
  assert.ok(await page.$('.elo-panel'), 'le bilan du module doit s\'afficher');
  const adv = await page.evaluate(() => JSON.parse(localStorage.getItem('educa2:p:pgrand001')).path.adv);
  const done = Object.values(adv.modules);
  assert.equal(done.length, 1, 'le module est enregistré');
  assert.equal(done[0].tries, 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test('les mots du jeu sont dits par une vraie voix humaine (fichier enregistré)', async () => {
  const { context, page, errors } = await open();
  await createChild(page, 'Lou');
  const played = await page.evaluate(async () => {
    const srcs = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const p = play.call(this);
      p.then(() => srcs.push(decodeURIComponent(this.src)), () => {});
      return p;
    };
    const { voice } = await import('./js/services/voice.js');
    await voice.say('ballon', { slowWord: true });
    return srcs;
  });
  assert.ok(played.some(s => s.endsWith('/audio/mots/ballon.mp3')), `fichiers joués : ${played}`);
  assert.deepEqual(errors, []);
  await context.close();
});

/* Répond à tout (tuiles, mots, choix ; « Continuer » après une correction) jusqu'au bilan. */
async function playUntilResults(page, ms = 150000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline && !(await page.$('.elo-panel'))) {
    const target = await page.$('.gtile.hint') || await page.$('.gtile:not(.used)')
      || await page.$('.wpick:not([disabled])') || await page.$('.choice:not([disabled])');
    if (target) { await target.evaluate(el => el.scrollIntoView({ block: 'center' })); await target.click({ force: true }); }
    const cont = await page.$('button[aria-label="Continuer"]:not([hidden])');
    if (cont) { await cont.evaluate(el => el.scrollIntoView({ block: 'center' })); await cont.click({ force: true }); }
    await page.waitForTimeout(200);
  }
  return !!(await page.$('.elo-panel'));
}

test('les révisions des niveaux reprennent un module déjà travaillé', async () => {
  const { context, page, errors } = await open();
  await page.goto(url);
  await page.evaluate(() => {
    const now = Date.now();
    const id = 'pgrand002';
    localStorage.setItem('educa2:device', JSON.stringify({
      schema: 2, createdAt: now, voice: null, muted: false, activeId: id, order: [id], classStep: null, dailyMinutes: 0, errors: [],
    }));
    localStorage.setItem(`educa2:p:${id}`, JSON.stringify({
      id, createdAt: now, name: 'Yanis', avatar: '🐼', age: '10-12', universe: 'jungle',
      path: { open: 65, stars: {}, placed: true, advanced: true, adv: { modules: { 'n3-comprendre': { stars: 1, tries: 1 } }, controles: {} } },
    }));
  });
  await page.reload();
  await page.waitForSelector('.btn-play');
  await page.click('.tile:has-text("Jeux")');
  await page.click('.tile:has-text("Niveaux")');
  await page.click('text=C\'est parti');
  assert.ok(await playUntilResults(page), 'le bilan des révisions doit s\'afficher');
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('educa2:p:pgrand002')));
  assert.ok(Object.keys(p.mem).every(k => k.startsWith('adv:n3-comprendre:')), 'seulement le module travaillé');
  assert.equal(p.path.lastKind, 'review');
  assert.deepEqual(errors, []);
  await context.close();
});

test('au clavier seul (ou au contacteur), on joue une leçon', async () => {
  const { context, page, errors } = await open();
  await createChild(page, 'Tom');
  await page.focus('.btn-play');
  await page.keyboard.press('Enter');
  await page.waitForSelector('text=C\'est parti');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent.includes('C\'est parti')), true, 'le bouton de départ a le focus');
  await page.keyboard.press('Enter');
  let answered = 0;
  for (let k = 0; k < 120 && answered < 4; k++) {
    const kind = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return 'none';
      if (a.matches('button[aria-label="Continuer"]')) return 'continue';
      if (a.matches('.choice:not([disabled]), .gtile:not(.used)')) return 'answer';
      return 'other';
    });
    if (kind === 'continue' || kind === 'answer') {
      await page.keyboard.press('Enter');
      if (kind === 'answer') answered = await page.$$eval('.dots i.ok, .dots i.ko', d => d.length);
      await page.waitForTimeout(300);
    } else {
      await page.keyboard.press('Tab');
    }
  }
  assert.ok(answered >= 4, `réponses données au clavier : ${answered}`);
  assert.deepEqual(errors, []);
  await context.close();
});

test('mode lecteur d\'écran : Kaya se tait et ses phrases vont au lecteur d\'écran', async () => {
  const { context, page, errors } = await open();
  await page.addInitScript(() => {
    window.__spoken = [];
    if (window.speechSynthesis) {
      const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = u => { window.__spoken.push(u.text); return speak(u); };
    }
    window.__played = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return play.call(this); };
  });
  await page.goto(url);
  await page.evaluate(() => {
    const now = Date.now();
    const id = 'plecteur1';
    localStorage.setItem('educa2:device', JSON.stringify({
      schema: 2, createdAt: now, voice: null, muted: false, activeId: id, order: [id], classStep: null, dailyMinutes: 0, errors: [],
    }));
    localStorage.setItem(`educa2:p:${id}`, JSON.stringify({
      id, createdAt: now, name: 'Sam', avatar: '🐢', age: '7-9', universe: 'jungle', path: { open: 5, stars: {} },
      comfort: { screenReader: true },
    }));
  });
  await page.reload();
  await page.waitForSelector('.btn-play');
  await page.click('.btn-play');
  await page.waitForSelector('text=C\'est parti');
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => ({
    spoken: window.__spoken, played: window.__played, live: document.getElementById('sr-live')?.textContent || '',
  }));
  assert.deepEqual(state.spoken, [], 'aucune synthèse vocale par-dessus le lecteur d\'écran');
  assert.deepEqual(state.played, [], 'aucun fichier audio par-dessus le lecteur d\'écran');
  assert.ok(state.live.length > 0, 'la phrase de Kaya est annoncée au lecteur d\'écran');
  assert.deepEqual(errors, []);
  await context.close();
});
