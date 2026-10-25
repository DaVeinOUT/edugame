/* Reproducible original whole-body procedural jaguar, EDUCA, MIT.
   This articulated primitive model is a prototype, not a production GLB/skin. */
import * as T from '../vendor/three/three.module.js';

export function createJaguar() {
  const root = new T.Group();
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512; textureCanvas.height = 256;
  const ctx = textureCanvas.getContext('2d');
  if (!ctx) throw new Error('Kaya: Canvas2D unavailable for the local fur texture');
  ctx.fillStyle = '#edaa3e'; ctx.fillRect(0, 0, 512, 256);
  let seed = 1931;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let row = 0; row < 7; row++) for (let col = 0; col < 14; col++) {
    const x = 14 + col * 37 + (row % 2) * 15 + random() * 8;
    const y = 10 + row * 37 + random() * 8;
    ctx.strokeStyle = '#58351f'; ctx.lineWidth = 4 + random() * 2;
    ctx.beginPath(); ctx.ellipse(x, y, 8 + random() * 4, 6 + random() * 3, random(), .2, 5.7); ctx.stroke();
    ctx.fillStyle = '#58351f'; ctx.beginPath(); ctx.arc(x + 1, y, 2, 0, Math.PI * 2); ctx.fill();
  }
  const furTexture = new T.CanvasTexture(textureCanvas); furTexture.colorSpace = T.SRGBColorSpace;
  const fur = new T.MeshStandardMaterial({ map: furTexture, roughness: .86 });
  const gold = new T.MeshStandardMaterial({ color: '#edaa3e', roughness: .86 });
  const cream = new T.MeshStandardMaterial({ color: '#fff0cc', roughness: .9 });
  const dark = new T.MeshStandardMaterial({ color: '#50311e', roughness: .75 });
  const pink = new T.MeshStandardMaterial({ color: '#c78b67', roughness: .9 });
  const white = new T.MeshStandardMaterial({ color: '#fffaf0', roughness: .55 });
  const amber = new T.MeshStandardMaterial({ color: '#9b5517', roughness: .35 });
  const black = new T.MeshStandardMaterial({ color: '#16130e', roughness: .18 });
  const shine = new T.MeshBasicMaterial({ color: '#ffffff' });
  const sphere = new T.SphereGeometry(1, 28, 20);
  const mesh = (parent, mat, position, scale) => {
    const m = new T.Mesh(sphere, mat); m.position.set(...position); m.scale.set(...scale); parent.add(m); return m;
  };
  const body = mesh(root, fur, [0, .72, -.06], [.56, .64, .43]);
  mesh(root, cream, [0, .75, .335], [.32, .46, .12]);
  // Haunches and both back feet remain visible beneath the smaller front paws.
  for (const side of [-1, 1]) {
    mesh(root, fur, [side * .45, .28, -.03], [.3, .32, .32]);
    mesh(root, gold, [side * .43, .12, .25], [.3, .15, .37]);
    for (let toe = 0; toe < 2; toe++) mesh(root, dark, [side * .43 + (toe - .5) * .12, .126, .584], [.013, .04, .012]);
  }
  const tail = new T.Group(); tail.position.set(.35, .24, -.25); root.add(tail);
  const curve = new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(.65, -.03, -.12), new T.Vector3(.88, .36, -.08), new T.Vector3(.75, .67, -.02)]);
  const tailMesh = new T.Mesh(new T.TubeGeometry(curve, 32, .085, 8, false), fur); tail.add(tailMesh);
  mesh(tail, dark, [.75, .67, -.02], [.09, .12, .09]);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * .46, 1.05, .16); root.add(arm); arms.push(arm);
    mesh(arm, fur, [side * .01, -.26, 0], [.17, .35, .18]);
    mesh(arm, gold, [side * .02, -.53, .08], [.2, .17, .24]);
    mesh(arm, cream, [side * .02, -.55, .247], [.14, .1, .03]);
  }
  const head = new T.Group(); head.position.set(0, 1.7, .07); root.add(head);
  mesh(head, fur, [0, 0, 0], [.76, .67, .59]);
  for (const side of [-1, 1]) {
    mesh(head, dark, [side * .57, .48, -.015], [.27, .29, .14]);
    mesh(head, gold, [side * .57, .49, .025], [.22, .24, .14]);
    mesh(head, pink, [side * .57, .49, .151], [.145, .16, .025]);
  }
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new T.Group(); eye.position.set(side * .29, .055, .505); head.add(eye); eyes.push(eye);
    mesh(eye, dark, [0, 0, -.005], [.235, .274, .115]);
    mesh(eye, white, [0, 0, .025], [.218, .252, .11]);
    mesh(eye, amber, [-side * .015, -.012, .112], [.148, .193, .065]);
    mesh(eye, black, [-side * .015, -.012, .16], [.105, .151, .03]);
    mesh(eye, shine, [-.052, .072, .186], [.043, .048, .012]);
    mesh(eye, shine, [.034, -.075, .188], [.017, .019, .008]);
  }
  mesh(head, cream, [0, -.32, .48], [.4, .24, .22]);
  for (const side of [-1, 1]) mesh(head, cream, [side * .14, -.25, .615], [.2, .14, .13]);
  const jaw = mesh(head, dark, [0, -.385, .663], [.115, .038, .022]);
  mesh(head, dark, [0, -.213, .737], [.115, .063, .045]);
  mesh(head, pink, [0, -.198, .773], [.067, .023, .015]);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) mesh(head, dark, [side * (.18 + (i % 2) * .065), -.27 - Math.floor(i / 2) * .055, .733 - (i % 2) * .025], [.012, .012, .009]);
  return { root, body, head, eyes, arms, jaw, tail };
}

export function poseJaguar(model, snapshot, seconds, motion = true) {
  const { root, body, head, eyes, arms, jaw, tail } = model;
  const state = snapshot.state;
  const active = motion && !snapshot.paused && !snapshot.hidden;
  const t = active ? seconds : 0;
  const amount = snapshot.quiet ? .32 : 1;
  body.scale.y = .64 * (1 + (active ? Math.sin(t * 1.65) * .014 : 0));
  root.position.y = state === 'celebrating' && active ? Math.max(0, Math.sin(t * 10)) * .085 * amount : 0;
  root.rotation.z = state === 'celebrating' && active ? Math.sin(t * 6) * .04 * amount : 0;
  head.rotation.set(state === 'resting' ? .15 : 0, state === 'helping' ? -.08 : 0, state === 'attentive' || state === 'helping' ? .035 : 0);
  if (state === 'greeting' && active) head.rotation.z = Math.sin(t * 3) * .04;
  const phase = t % 5.3;
  const blink = active && phase > 4.9 && phase < 5.12 ? Math.max(.07, Math.abs(phase - 5.01) / .11) : 1;
  eyes.forEach(eye => { eye.scale.y = state === 'resting' ? .12 : blink; });
  arms[0].rotation.z = 0;
  arms[1].rotation.z = state === 'greeting' ? -1.9 + (active ? Math.sin(t * 9) * .25 : 0)
    : state === 'celebrating' ? -.45 : state === 'helping' ? -.2 : 0;
  jaw.scale.y = snapshot.speaking && active ? .045 + Math.abs(Math.sin(t * 15)) * .075 : .025;
  jaw.scale.x = state === 'celebrating' ? .145 : .115;
  tail.rotation.y = active ? Math.sin(t * 1.1) * .1 * amount : 0;
}
