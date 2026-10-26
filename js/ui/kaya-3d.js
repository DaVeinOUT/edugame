/* Local authored GLB: one scene, bounded loading and crossfaded rig animations. */
import * as T from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { createKayaAnimator } from './kaya-animation.js';

const MODEL_URL = new URL('../../assets/kaya/kaya-production-v2.glb', import.meta.url);

function disposeScene(scene) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  scene.traverse(obj => {
    if (obj.geometry) geometries.add(obj.geometry);
    if (obj.skeleton) skeletons.add(obj.skeleton);
    for (const material of obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []) materials.add(material);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    material.dispose();
  }
  geometries.forEach(g => g.dispose());
  skeletons.forEach(s => s.dispose());
  textures.forEach(t => { t.dispose(); t.image?.close?.(); });
  scene.clear();
}

async function loadModel(signal) {
  const abort = new AbortController();
  let expired = false, timer, cancel;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { expired = true; abort.abort(); reject(new Error('Kaya loading timed out')); }, 6000);
    cancel = () => { expired = true; abort.abort(); reject(new DOMException('Kaya loading cancelled', 'AbortError')); };
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
  });
  const task = (async () => {
    const response = await fetch(MODEL_URL, { signal: abort.signal });
    if (!response.ok) throw new Error('Kaya model unavailable');
    const data = await response.arrayBuffer();
    if (data.byteLength > 3 * 1024 * 1024 || data.byteLength < 20) throw new Error('Kaya model size invalid');
    const header = new DataView(data);
    if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2) throw new Error('Kaya GLB invalid');
    const jsonLength = header.getUint32(12, true);
    if (jsonLength > data.byteLength - 20) throw new Error('Kaya GLB truncated');
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonLength)));
    if ([...(json.buffers || []), ...(json.images || [])].some(item => item.uri)) throw new Error('Kaya resources must be embedded');
    let textureFailed = false;
    const manager = new T.LoadingManager();
    manager.onError = () => { textureFailed = true; };
    const gltf = await new GLTFLoader(manager).parseAsync(data, new URL('./', MODEL_URL).href);
    if (expired || textureFailed || !gltf.scene || !gltf.animations.some(clip => clip.name === 'idle')) {
      if (gltf.scene) disposeScene(gltf.scene);
      throw new Error('Kaya model incomplete');
    }
    return gltf;
  })();
  try {
    return await Promise.race([task, deadline]);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}

export async function createKaya3D(host, onFailure, { signal } = {}) {
  // The accessible fallback stays visible during loading; no WebGL context waits on a fetch.
  const gltf = await loadModel(signal);
  if (signal?.aborted) { disposeScene(gltf.scene); throw new DOMException('Kaya loading cancelled', 'AbortError'); }
  const scene = new T.Scene();
  scene.add(gltf.scene);
  let renderer;
  try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch (error) { disposeScene(scene); throw error; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const canvas = renderer.domElement;
  canvas.className = 'kaya-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-kaya-canvas', '');
  canvas.dataset.model = 'gltf';
  canvas.dataset.clips = gltf.animations.map(clip => clip.name).join(' ');
  let bones = 0;
  gltf.scene.traverse(obj => { if (obj.isBone) bones++; });
  canvas.dataset.bones = String(bones);
  const box = new T.Box3().setFromObject(gltf.scene);
  const size = box.getSize(new T.Vector3());
  const center = box.getCenter(new T.Vector3());
  const scale = 2.65 / Math.max(size.y, size.x, .1);
  const framing = { bounds: { min: box.min.toArray(), max: box.max.toArray(), size: size.toArray() }, scale };
  gltf.scene.scale.setScalar(scale);
  gltf.scene.position.copy(center.multiplyScalar(-scale));
  const camera = new T.PerspectiveCamera(31, 1, .1, 20);
  camera.position.set(.45, .12, 5.4); camera.lookAt(0, .05, 0);
  // Opt-in review angles, shared by both archived and current assets in the proof harness.
  // Only these local camera presets are accepted; no asset URL or remote resource is configurable.
  const reviewView = new URLSearchParams(location.search).get('kaya-view');
  if (reviewView === 'front') camera.position.set(0, .12, 5.4);
  if (reviewView === 'three-quarter') camera.position.set(3.05, .12, 4.46);
  camera.lookAt(0, .05, 0);
  framing.view = ['front', 'three-quarter'].includes(reviewView) ? reviewView : 'companion';
  framing.camera = camera.position.toArray();
  framing.fov = camera.fov;
  framing.exposure = renderer.toneMappingExposure;
  scene.add(new T.HemisphereLight(0xfff6e7, 0x7d755e, 2.0));
  const key = new T.DirectionalLight(0xfff0d6, 2.6); key.position.set(-3, 5, 4); scene.add(key);
  const fill = new T.DirectionalLight(0xffffff, 1.0); fill.position.set(3, 2, -1); scene.add(fill);
  const animator = createKayaAnimator(gltf.scene, gltf.animations);
  canvas._kayaInspect = () => ({ ...animator.inspect(), framing });
  let destroyed = false;
  const onLost = event => { event.preventDefault(); if (!destroyed) onFailure(); };
  canvas.addEventListener('webglcontextlost', onLost);
  host.append(canvas);
  function resize() {
    if (destroyed) return;
    const width = Math.max(32, Math.min(320, host.clientWidth || 160));
    renderer.setSize(width, width, false);
  }
  resize();
  return {
    update(snapshot, seconds, motion) {
      if (destroyed) return;
      canvas.dataset.clip = animator.update(snapshot, seconds, motion);
      renderer.render(scene, camera);
      canvas.dataset.triangles = String(renderer.info.render.triangles);
    },
    resize,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      canvas.removeEventListener('webglcontextlost', onLost);
      animator.destroy(); delete canvas._kayaInspect;
      disposeScene(scene);
      renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
