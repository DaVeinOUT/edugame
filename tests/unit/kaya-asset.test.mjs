import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
test('le GLB v2 local contient un skin pondéré, huit vrais clips et aucune dépendance distante', () => {
  const root = new URL('../../', import.meta.url);
  const report = JSON.parse(execFileSync('python3', [fileURLToPath(new URL('scripts/kaya/validate_glb.py', root)),
    fileURLToPath(new URL('assets/kaya/kaya-production-v2.glb', root))], { encoding: 'utf8' }));
  assert.equal(report.skins, 1); assert.equal(report.joints, 14);
  assert.ok(report.weightedVertices > 0); assert.ok(report.triangles < 50000);
  assert.equal(Object.keys(report.clipsSeconds).length, 8);
  assert.equal(report.embeddedImages, 2);
});
test('le modèle précédent reste conservé exactement pour comparaison et reprise', () => {
  const previous = readFileSync(new URL('../../docs/design/kaya-compagnon/production/kaya-production-v1.glb', import.meta.url));
  assert.equal(createHash('sha256').update(previous).digest('hex'),
    'b4e379ed9e170c21ce68818f1b720bfa2c6b467a860f4154bfd1632eca198ed9');
});
