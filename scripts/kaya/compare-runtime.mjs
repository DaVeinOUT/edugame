/* Same real hub, renderer, lights, viewport and static pose; only the local GLB differs. */
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { startServer } from '../../tests/e2e/server.mjs';

const out = resolve(process.argv[2] || 'docs/verification/2026-10-26/kaya-v2/comparison');
await mkdir(out, { recursive: true });
const assets = await Promise.all(['v1', 'v2'].map(async version => ({ version,
  body: await readFile(new URL(version === 'v1'
    ? '../../docs/design/kaya-compagnon/production/kaya-production-v1.glb'
    : '../../assets/kaya/kaya-production-v2.glb', import.meta.url)) })));
const { server, url } = await startServer();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const proofs = [], errors = [];
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1100, height: 900 }]) {
    const format = viewport.width === 390 ? 'mobile' : 'desktop';
    for (const view of ['front', 'three-quarter']) {
      for (const { version, body } of assets) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
        try {
          const page = await context.newPage();
          const responses = [];
          page.on('response', response => {
            if (new URL(response.url()).pathname.endsWith('.glb')) responses.push(response.body().then(bytes => ({
              url: response.url(), status: response.status(), hash: createHash('sha256').update(bytes).digest('hex') })));
          });
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          // Asset substitution is deliberately limited to the archived baseline. Runtime is identical.
          if (version === 'v1') await page.route('**/assets/kaya/*.glb', route => route.fulfill({
            status: 200, contentType: 'model/gltf-binary', body }));
          await page.goto(`${url}?kaya-view=${view}`);
          await page.evaluate(async () => {
            const { newProfile, emptyDevice } = await import('./js/core/schema.js');
            const p = newProfile({ name: 'Léa', avatar: '🦊' });
            p.comfort.screenReader = true; p.comfort.reducedMotion = true;
            localStorage.setItem('educa2:device', JSON.stringify({ ...emptyDevice(), order: [p.id], activeId: p.id, muted: true }));
            localStorage.setItem(`educa2:p:${p.id}`, JSON.stringify(p));
          });
          await page.reload(); await page.waitForSelector('[data-model="gltf"]');
          await page.locator('.toast.show').waitFor({ state: 'hidden' });
          await page.evaluate(async () => {
            const { companionEvent } = await import('./js/ui/kaya.js');
            companionEvent(document.querySelector('[data-kaya-companion]'), 'attentive');
            companionEvent(document.querySelector('[data-kaya-companion]'), 'wake');
          });
          const prefix = `${version}-${view}-${format}`;
          await page.screenshot({ path: `${out}/${prefix}-game.png`, fullPage: true });
          await page.locator('.kaya-visual').first().screenshot({ path: `${out}/${prefix}-detail.png` });
          const rig = await page.$eval('[data-kaya-canvas]', c => c._kayaInspect());
          const received = await Promise.all(responses);
          const assetHash = createHash('sha256').update(body).digest('hex');
          assert.ok(received.length > 0, 'le jeu a réellement reçu un GLB');
          assert.ok(received.every(response => response.status === 200 && response.hash === assetHash), 'le GLB rendu est exactement la version annoncée');
          assert.equal(rig.framing.view, view);
          assert.equal(rig.clip, 'idle');
          proofs.push({ version, view, viewport, assetHash, received,
            file: `${prefix}-game.png`, detail: `${prefix}-detail.png`, rig });
        } finally { await context.close(); }
      }
    }
  }
  assert.deepEqual(errors, []);
  for (let i = 0; i < proofs.length; i += 2) {
    assert.deepEqual(proofs[i].rig.framing.camera, proofs[i + 1].rig.framing.camera);
    assert.equal(proofs[i].rig.framing.fov, proofs[i + 1].rig.framing.fov);
    assert.equal(proofs[i].rig.framing.exposure, proofs[i + 1].rig.framing.exposure);
  }
  await writeFile(`${out}/proof.json`, JSON.stringify({ browser: await browser.version(), errors, proofs,
    method: 'Même jeu courant et menu, mouvement réduit, idle t=0. V1 substitué localement à la requête GLB. Seul le preset caméra change entre les vues. Box3 et échelle conservés dans chaque preuve.' }, null, 2));
  const rows = ['front', 'three-quarter'].map(view => `<tr><th>${view === 'front' ? 'Face' : 'Trois quarts'}</th>` +
    ['v1', 'v2'].map(v => `<td><a href="${v}-${view}-mobile-game.png"><img src="${v}-${view}-mobile-detail.png" alt="Kaya ${v}, ${view}, extrait du jeu"><br>Voir dans l’accueil</a></td>`).join('') + '</tr>').join('');
  await writeFile(`${out}/index.html`, `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kaya — comparaison v1 / v2</title><style>body{font:18px system-ui;background:#fff8e9;color:#3b2b21;max-width:900px;margin:2rem auto;padding:1rem}table{width:100%;table-layout:fixed}th,td{text-align:center;padding:8px}img{width:100%;max-width:320px;image-rendering:auto}a{color:#294c37}</style><h1>Kaya — itération artistique 2</h1><p>Extraits du véritable accueil, 390 × 844. Même lumière, caméra, pose idle à t=0 et interface. Les images sont agrandies ici ; les liens ouvrent leur taille réelle dans le jeu. Le détail des échelles et les vues desktop sont dans proof.json. Ces comparaisons ne constituent pas une validation artistique finale.</p><table><tr><th>Vue</th><th>Avant — v1</th><th>Après — v2</th></tr>${rows}</table></html>`);
  console.log(`Comparaisons du jeu écrites dans ${out}`);
} finally { await browser.close(); server.close(); }
