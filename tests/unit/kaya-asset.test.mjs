import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('le GLB local contient un skin pondéré, huit vrais clips et aucune dépendance distante', () => {
  const root = new URL('../../', import.meta.url);
  const report = JSON.parse(execFileSync('python3', [fileURLToPath(new URL('scripts/kaya/validate_glb.py', root)),
    fileURLToPath(new URL('assets/kaya/kaya-production-v1.glb', root))], { encoding: 'utf8' }));
  assert.equal(report.skins, 1); assert.equal(report.joints, 14);
  assert.ok(report.weightedVertices > 0); assert.ok(report.triangles < 50000);
  assert.equal(Object.keys(report.clipsSeconds).length, 8);
  assert.equal(report.embeddedImages, 1);
});
