/* ============================================================
   RELEASE.MJS — Prépare la version hors-ligne (outil de développement)
   Génère, à partir des fichiers réellement présents sur le disque :
   • la liste ASSETS du service worker (fini les oublis à la main) ;
   • CACHE_NAME = empreinte du contenu : toute modification donne une
     nouvelle version, que les téléphones reçoivent proprement.
   Usage : node scripts/release.mjs          (réécrit sw.js)
           node scripts/release.mjs --check  (échoue si sw.js n'est pas à jour — CI)
   ============================================================ */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENTRIES = ['index.html', 'confidentialite.html', 'guide.html', 'manifest.json', 'css', 'js', 'fonts', 'icons', 'audio'];
/* Licences et notes : utiles dans le dépôt, inutiles pour jouer hors-ligne. */
const SKIP = /(^|\/)\.|(^|\/)licenses\/|LICENSE|README|\.(txt|md)$/;
const BEGIN = '/* <release> — généré par scripts/release.mjs, ne pas éditer à la main */';
const END = '/* </release> */';

async function walk(rel) {
  const abs = join(ROOT, rel);
  const st = await stat(abs).catch(() => null);
  if (!st) return [];
  if (st.isFile()) return [rel];
  const names = await readdir(abs);
  const nested = await Promise.all(names.map(n => walk(`${rel}/${n}`)));
  return nested.flat();
}

/** Liste des fichiers servis, empreinte et bloc à insérer dans sw.js. */
export async function computeRelease() {
  const files = (await Promise.all(ENTRIES.map(walk))).flat().filter(f => !SKIP.test(f)).sort();
  const hash = createHash('sha256');
  for (const f of files) {
    hash.update(f);
    hash.update(await readFile(join(ROOT, f)));
  }
  const version = hash.digest('hex').slice(0, 10);
  const list = files.map(f => `  './${f}',`).join('\n');
  const block = `${BEGIN}\nconst CACHE_NAME = 'educa-${version}';\nconst ASSETS = [\n  './',\n${list}\n];\n${END}`;
  return { files, version, block };
}

const swPath = join(ROOT, 'sw.js');
const sw = await readFile(swPath, 'utf8');
const start = sw.indexOf(BEGIN);
const stop = sw.indexOf(END);
if (start < 0 || stop < 0) throw new Error('marqueurs <release> absents de sw.js');
const { files, version, block } = await computeRelease();
const next = sw.slice(0, start) + block + sw.slice(stop + END.length);

if (process.argv.includes('--check')) {
  if (next !== sw) {
    console.error('sw.js n\'est pas à jour : lancez « npm run release » puis commitez.');
    process.exit(1);
  }
  console.log(`sw.js à jour (educa-${version}, ${files.length} fichiers)`);
} else {
  await writeFile(swPath, next);
  console.log(`sw.js : educa-${version}, ${files.length} fichiers en cache hors-ligne`);
}
