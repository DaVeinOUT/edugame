/* ============================================================
   FETCH-FONTS.MJS — Outil de développement (jamais exécuté chez l'enfant)
   Télécharge UNE FOIS les polices libres (SIL OFL) en woff2, sous-ensemble
   « latin » (suffit au français et au créole haïtien), puis écrit
   css/fonts.css. Le jeu n'appelle plus jamais Google : aucune donnée
   d'enfant ne part chez un tiers, et tout marche hors-ligne.
   Usage : node scripts/fetch-fonts.mjs
   ============================================================ */
import { writeFile, mkdir } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const FAMILIES = [
  { family: 'Nunito',   query: 'Nunito:wght@400..900', ofl: 'nunito' },
  { family: 'Andika',   query: 'Andika:wght@400;700',  ofl: 'andika' },
  { family: 'Orbitron', query: 'Orbitron:wght@700;900', ofl: 'orbitron' },
  { family: 'Rajdhani', query: 'Rajdhani:wght@500;700', ofl: 'rajdhani' },
];

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
let css = '/* Généré par scripts/fetch-fonts.mjs — polices SIL OFL 1.1 (voir fonts/licenses/) */\n';
await mkdir('fonts/licenses', { recursive: true });

for (const f of FAMILIES) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${f.query}&display=swap`, { headers: { 'User-Agent': UA } });
  const text = await res.text();
  // Blocs « /* latin */ @font-face { … } » uniquement
  const blocks = [...text.matchAll(/\/\* latin \*\/\s*@font-face\s*{([^}]*)}/g)].map(m => m[1]);
  if (!blocks.length) throw new Error(`aucun bloc latin pour ${f.family}`);
  const seen = new Map();
  for (const b of blocks) {
    const url = b.match(/url\((https:[^)]+)\)/)[1];
    const weight = b.match(/font-weight:\s*([^;]+);/)[1].trim();
    const range = b.match(/unicode-range:\s*([^;]+);/)[1].trim();
    const file = `fonts/${slug(f.family)}-${slug(weight)}.woff2`;
    if (!seen.has(url)) {
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      await writeFile(file, buf);
      seen.set(url, file);
      console.log(`${file}  ${(buf.length / 1024).toFixed(1)} Ko`);
    }
    css += `@font-face {\n  font-family: '${f.family}';\n  font-style: normal;\n  font-weight: ${weight};\n` +
           `  font-display: swap;\n  src: url('../${seen.get(url)}') format('woff2');\n  unicode-range: ${range};\n}\n`;
  }
  const lic = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${f.ofl}/OFL.txt`);
  if (!lic.ok) throw new Error(`licence introuvable pour ${f.family}`);
  await writeFile(`fonts/licenses/${f.family}-OFL.txt`, await lic.text());
}
await writeFile('css/fonts.css', css);
console.log('css/fonts.css écrit');
