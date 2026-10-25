/* One bounded local WebGL renderer. No model/texture request or remote service. */
import * as T from '../vendor/three/three.module.js';
import { createJaguar, poseJaguar } from './kaya-model.js';

export function createKaya3D(host, onFailure) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.domElement.className = 'kaya-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.setAttribute('data-kaya-canvas', '');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(31, 1, .1, 20);
  camera.position.set(.55, 1.48, 5.8); camera.lookAt(0, 1.22, 0);
  scene.add(new T.HemisphereLight(0xfff5df, 0x846e51, 2.8));
  const key = new T.DirectionalLight(0xffecd1, 3.3); key.position.set(-3, 5, 4); scene.add(key);
  const fill = new T.DirectionalLight(0xffffff, 1.1); fill.position.set(3, 2, -1); scene.add(fill);
  let model;
  try { model = createJaguar(); }
  catch (error) { renderer.dispose(); renderer.forceContextLoss(); throw error; }
  scene.add(model.root);
  let destroyed = false;
  const onLost = event => { event.preventDefault(); if (!destroyed) onFailure(); };
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  host.append(renderer.domElement);
  function resize() {
    if (destroyed) return;
    const size = Math.max(32, Math.min(256, host.clientWidth || 132));
    renderer.setSize(size, size, false);
  }
  resize();
  return {
    update(snapshot, seconds, motion) {
      if (destroyed) return;
      poseJaguar(model, snapshot, seconds, motion);
      renderer.render(scene, camera);
    },
    resize,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      const geometries = new Set(), materials = new Set(), textures = new Set();
      scene.traverse(obj => {
        if (obj.geometry) geometries.add(obj.geometry);
        if (obj.material) for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(mat);
      });
      materials.forEach(mat => { if (mat.map) textures.add(mat.map); mat.dispose(); });
      geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
      renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
      renderer.domElement.remove(); scene.clear();
    },
  };
}
