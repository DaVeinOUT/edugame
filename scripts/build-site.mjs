#!/usr/bin/env node
/* ============================================================
   scripts/build-site.mjs — assemble l'application (et rien d'autre) dans un dossier
   Usage : node scripts/build-site.mjs _site     (CI : site publié)
           node scripts/build-site.mjs www       (Capacitor : webDir)
   Ne copie ni archive/, rapports/, ops/, tests/, scripts/ ni audio-src/ (WAV sources).
   ============================================================ */
import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.EDUCA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? '_site');
const ITEMS = [
  'index.html', 'manifest.json', 'sw.js', 'LICENSE',
  'css', 'js', 'fonts', 'icons', 'audio',
  'confidentialite.html',           // politique de confidentialité publique (exigée par les deux magasins)
  '.well-known',                     // assetlinks.json (TWA) : seulement si le site a son propre domaine
  'CNAME',                           // domaine personnalisé GitHub Pages
];

const exists = p => access(p).then(() => true, () => false);

await mkdir(OUT, { recursive: true });
const copied = [];
for (const item of ITEMS) {
  const from = path.join(ROOT, item);
  if (!(await exists(from))) continue;
  await cp(from, path.join(OUT, item), { recursive: true });
  copied.push(item);
}
console.log(`${copied.length} éléments copiés dans ${OUT} : ${copied.join(', ')}`);
