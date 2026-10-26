import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let server, url, browser;
before(async () => {
  ({ server, url } = await startServer(ROOT));
  // Software WebGL allows an actual GPU pipeline in headless CI, not a canvas mock.
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); server?.close(); });

async function hub({ reduced = false, profileReduced = false, missing = false, webgl = true, canvas2d = true, broken = false, decode = false, delay = false, sw = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    serviceWorkers: sw ? 'allow' : 'block', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript(({ webgl, canvas2d, decode }) => {
    if (decode) window.createImageBitmap = () => Promise.reject(new Error("Image decoding refused"));
    const pending = new Set(); const request = window.requestAnimationFrame.bind(window); const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = fn => { const id = request(t => { pending.delete(id); fn(t); }); pending.add(id); return id; };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    window.__pendingFrames = () => pending.size;
    const get = HTMLCanvasElement.prototype.getContext; window.__createdWebglContexts = [];
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if ((!webgl && type.startsWith('webgl')) || (!canvas2d && type === '2d')) return null;
      const context = get.call(this, type, ...args);
      if (type.startsWith('webgl') && context && !window.__createdWebglContexts.includes(context)) window.__createdWebglContexts.push(context);
      return context;
    };
  }, { webgl, canvas2d, decode });
  const page = await context.newPage();
  let releaseModel, started;
  const hold = new Promise(resolve => { releaseModel = resolve; });
  const modelStarted = new Promise(resolve => { started = resolve; });
  if (delay) await page.route('**/assets/kaya/*.glb', async route => {
    started(); await hold;
    try { await route.continue(); } catch { /* la page a pu annuler la demande */ }
  });
  if (missing) await page.route('**/js/ui/kaya-3d.js', route => route.abort());
  if (broken) await page.route('**/assets/kaya/*.glb', route => route.fulfill({ status: 200, body: 'invalid GLB' }));
  await page.goto(url);
  await page.evaluate(({ profileReduced }) => {
    const at = Date.now(), id = 'pkaya001';
    localStorage.setItem('educa2:device', JSON.stringify({ schema: 2, createdAt: at, muted: false, activeId: id, order: [id] }));
    localStorage.setItem(`educa2:p:${id}`, JSON.stringify({ id, createdAt: at, name: 'Léa', avatar: '🦊', age: '7-9', universe: 'jungle',
      cards: [], stats: { answers: 11 }, path: { open: 0, stars: {} }, comfort: { screenReader: true, reducedMotion: profileReduced } }));
  }, { profileReduced });
  await page.reload(); await page.waitForSelector('.btn-play');
  return { page, context, releaseModel, modelStarted };
}

test('Kaya : vrai maillage WebGL dans le parcours, une seule scène et réactions aux réponses', async () => {
  const { page, context } = await hub();
  try {
    await page.waitForSelector('.kaya[data-renderer="3d"] canvas');
    const rendered = await page.evaluate(async () => {
      const { companionEvent } = await import('./js/ui/kaya.js');
      const el = document.querySelector('[data-kaya-companion]'); companionEvent(el, 'attentive');
      const canvas = el.querySelector('canvas'), gl = canvas.getContext('webgl2');
      const pixel = new Uint8Array(4); gl.readPixels(canvas.width / 2, canvas.height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return { version: gl.getParameter(gl.VERSION), pixel: [...pixel], width: canvas.width, hidden: canvas.getAttribute('aria-hidden') };
    });
    assert.match(rendered.version, /WebGL 2/); assert.ok(rendered.pixel[3] > 0, 'un fragment du maillage est réellement dessiné');
    assert.ok(rendered.width <= 512); assert.equal(rendered.hidden, 'true');
    await page.setViewportSize({ width: 390, height: 360 });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => document.querySelector('[data-kaya-companion]')?.dataset.state === 'paused');
    await page.waitForFunction(() => window.__pendingFrames() === 0);
    await page.evaluate(() => scrollTo(0, 0)); await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-kaya-companion]')?.dataset.state !== 'paused');
    // Exercise the visibility handler without claiming a physical background-app test.
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => document.querySelector('[data-kaya-companion]')?.dataset.state === 'paused' && window.__pendingFrames() === 0);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => document.querySelector('[data-kaya-companion]')?.dataset.state !== 'paused');
    await page.click('.btn-play'); await page.click('text=C\'est parti');
    await page.waitForSelector('.lesson-top .kaya[data-renderer="3d"]');
    assert.equal(await page.locator('[data-kaya-canvas]').count(), 1);
    const overlap = await page.evaluate(() => {
      const kaya = document.querySelector('.lesson-top .kaya').getBoundingClientRect(), stage = document.querySelector('.stage').getBoundingClientRect();
      return kaya.bottom > stage.top;
    });
    assert.equal(overlap, false, 'le compagnon occupe sa zone au-dessus de l’exercice');
    await page.locator('.choice:not([disabled])').first().click();
    assert.ok(['celebrating', 'encouraging', 'attentive', 'speaking'].includes(await page.getAttribute('.lesson-top .kaya', 'data-state')));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('educa2:p:pkaya001')).stats.answers === 12);
    const answers = await page.evaluate(() => JSON.parse(localStorage.getItem('educa2:p:pkaya001')).stats.answers);
    assert.equal(answers, 12);
    await page.getByRole('button', { name: 'Arrêter', exact: true }).click(); await page.waitForSelector('.btn-play');
    for (let i = 0; i < 3; i++) {
      await page.click('.tile:has-text("Mes cartes")'); await page.waitForSelector('.collection');
      assert.equal(await page.locator('[data-kaya-canvas]').count(), 0);
      await page.waitForFunction(() => window.__pendingFrames() === 0);
      await page.getByRole('button', { name: 'Retour', exact: true }).click(); await page.waitForSelector('.btn-play');
      await page.waitForSelector('.kaya[data-renderer="3d"] canvas'); assert.equal(await page.locator('[data-kaya-canvas]').count(), 1);
    }
  } finally { await context.close(); }
});

test('Kaya : réduction système/profil et masquage arrêtent les boucles, le clavier reste utilisable', async () => {
  for (const settings of [{ reduced: true }, { profileReduced: true }]) {
    const { page, context } = await hub(settings);
    try {
      await page.waitForSelector('.kaya[data-renderer="3d"] canvas');
      await page.waitForFunction(() => window.__pendingFrames() === 0);
      assert.equal(await page.$eval('.kaya .kf-body', el => getComputedStyle(el).animationName), 'none');
      await page.getByRole('button', { name: 'Masquer Kaya', exact: true }).focus(); await page.keyboard.press('Enter');
      assert.equal(await page.getAttribute('[data-kaya-companion]', 'data-state'), 'hidden');
      assert.equal(await page.locator('.kaya-visual').first().isVisible(), false);
      await page.waitForFunction(() => window.__pendingFrames() === 0);
      await page.keyboard.press('Enter'); assert.notEqual(await page.getAttribute('[data-kaya-companion]', 'data-state'), 'hidden');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    } finally { await context.close(); }
  }
});

test('Kaya : modèle/module absent, WebGL refusé et contexte perdu conservent le jeu et le secours entier', async () => {
  for (const settings of [{ missing: true }, { broken: true }, { decode: true }, { webgl: false }, {}]) {
    const { page, context } = await hub(settings);
    try {
      if (!settings.missing && !settings.broken && !settings.decode && settings.webgl !== false) {
        await page.waitForSelector('.kaya[data-renderer="3d"] canvas');
        await page.$eval('[data-kaya-canvas]', canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      }
      await page.waitForSelector('.kaya[data-renderer="fallback"] .kf-tail');
      await page.waitForFunction(() => document.querySelector('[data-kaya-companion]')?.dataset.renderer === 'fallback' && !document.querySelector('[data-kaya-canvas]'));
      if (settings.broken || settings.decode) assert.equal(await page.evaluate(() => window.__createdWebglContexts.length), 0, 'pas de contexte GPU en attente d’un modèle défectueux');
      assert.ok(await page.locator('.kaya .kf-paw').count());
      await page.click('.btn-play'); await page.waitForSelector('.intro-card');
      assert.ok(await page.getByRole('button', { name: 'C\'est parti ! ▶', exact: true }).isVisible());
    } finally { await context.close(); }
  }
});


test('Kaya : le vrai salut anime un os et le repos réduit neutralise le fondu', async () => {
  const { page, context } = await hub();
  try {
    await page.waitForSelector('[data-model="gltf"]');
    await page.getByRole('button', { name: 'Saluer Kaya', exact: true }).click();
    await page.waitForTimeout(250);
    const first = await page.$eval('[data-kaya-canvas]', c => c._kayaInspect());
    await page.waitForTimeout(400);
    const second = await page.$eval('[data-kaya-canvas]', c => c._kayaInspect());
    assert.equal(first.clip, 'greeting');
    assert.equal(Object.keys(first.bones).length, 14);
    const paw = Object.keys(first.bones).find(name => /upperarm.*R/.test(name));
    assert.ok(paw); assert.notDeepEqual(first.bones[paw], second.bones[paw], 'la patte du skin change réellement de pose');
    await page.getByRole('button', { name: 'Repos', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__pendingFrames() === 0);
    const rest = await page.$eval('[data-kaya-canvas]', c => c._kayaInspect());
    assert.equal(rest.clip, 'resting'); assert.equal(rest.weights.resting, 1);
    for (const [name, weight] of Object.entries(rest.weights)) if (name !== 'resting') assert.equal(weight, 0);
    assert.ok(Object.values(rest.morphs).filter(m => m.Blink > .8).length >= 2, 'les deux paupières utilisent leur pose de repos');
  } finally { await context.close(); }
});

test('Kaya : masquer pendant le chargement annule la création GPU et permet une reprise', async () => {
  const { page, context, modelStarted, releaseModel } = await hub({ delay: true });
  try {
    await modelStarted;
    await page.getByRole('button', { name: 'Masquer Kaya', exact: true }).click();
    releaseModel();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('[data-kaya-canvas]').count(), 0);
    assert.equal(await page.evaluate(() => window.__createdWebglContexts.length), 0);
    await page.getByRole('button', { name: 'Afficher Kaya', exact: true }).click();
    await page.waitForSelector('[data-model="gltf"]');
  } finally { releaseModel(); await context.close(); }
});
