/* ============================================================
   ACTIVITIES/TRACE.JS — La planche à tracer
   Deux calques : la lettre grise (dessinée par le jeu, donc
   parfaitement alignée) et l'encre de l'enfant. On mesure quelle
   part de la lettre a été couverte par le doigt, et combien d'encre
   est tombée à côté — très généreux : c'est un jeu.
   ============================================================ */

import { h } from '../ui/dom.js';

const SIZE = 420;
const STEP = 7;           // grille d'échantillonnage (px logiques)
const LINE = 30;          // épaisseur du trait : de petits doigts
const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#0891b2', '#e11d48', '#2563eb'];

export function traceBoard(letter, { font = 'Andika, sans-serif' } = {}) {
  const ghost = h('canvas', { 'aria-hidden': 'true' });
  const ink = h('canvas', { role: 'img', 'aria-label': `Trace la lettre ${letter}` });
  const el = h('div', { class: 'trace-wrap paper' }, ghost, ink);
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  for (const c of [ghost, ink]) {
    c.width = SIZE * dpr;
    c.height = SIZE * dpr;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const g = ghost.getContext('2d');
  const k = ink.getContext('2d');
  k.lineCap = 'round';
  k.lineJoin = 'round';
  let mask = [];
  let colorIdx = 0;

  function drawGhost() {
    g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = 'rgba(31, 36, 48, .16)';
    g.font = `700 280px ${font}`;
    g.textAlign = 'center';
    const m = g.measureText(letter);
    const asc = m.actualBoundingBoxAscent || 200;
    const desc = m.actualBoundingBoxDescent || 0;
    g.fillText(letter, SIZE / 2, SIZE / 2 + (asc - desc) / 2);
    const data = g.getImageData(0, 0, SIZE * dpr, SIZE * dpr).data;
    mask = [];
    for (let y = 0; y < SIZE; y += STEP) {
      for (let x = 0; x < SIZE; x += STEP) {
        const i = ((Math.round(y * dpr) * SIZE * dpr) + Math.round(x * dpr)) * 4 + 3;
        if (data[i] > 10) mask.push([x, y]);
      }
    }
  }
  drawGhost();
  document.fonts?.load?.(`700 280px ${font}`).then(drawGhost).catch(() => {});

  const pos = e => {
    const r = ink.getBoundingClientRect();
    return [((e.clientX - r.left) * SIZE) / r.width, ((e.clientY - r.top) * SIZE) / r.height];
  };
  let drawing = false;
  ink.addEventListener('pointerdown', e => {
    drawing = true;
    ink.setPointerCapture?.(e.pointerId);
    const [x, y] = pos(e);
    k.strokeStyle = COLORS[colorIdx % COLORS.length];
    k.lineWidth = LINE;
    k.beginPath();
    k.moveTo(x, y);
    k.lineTo(x + 0.1, y + 0.1);
    k.stroke();
    e.preventDefault();
  });
  ink.addEventListener('pointermove', e => {
    if (!drawing) return;
    const [x, y] = pos(e);
    k.lineTo(x, y);
    k.stroke();
    e.preventDefault();
  });
  const end = () => { if (drawing) { drawing = false; colorIdx += 1; } };
  ink.addEventListener('pointerup', end);
  ink.addEventListener('pointercancel', end);
  ink.addEventListener('pointerleave', end);

  return {
    el,
    clear() { k.clearRect(0, 0, SIZE, SIZE); },
    /** Part de la lettre couverte, et part de l'encre tombée hors de la lettre. */
    coverage() {
      const data = k.getImageData(0, 0, SIZE * dpr, SIZE * dpr).data;
      const inked = (x, y) => data[((Math.round(y * dpr) * SIZE * dpr) + Math.round(x * dpr)) * 4 + 3] > 0;
      const onLetter = new Set(mask.map(([x, y]) => `${x},${y}`));
      let covered = 0;
      for (const [x, y] of mask) if (inked(x, y)) covered += 1;
      let inkTotal = 0;
      let outside = 0;
      for (let y = 0; y < SIZE; y += STEP) {
        for (let x = 0; x < SIZE; x += STEP) {
          if (!inked(x, y)) continue;
          inkTotal += 1;
          if (!onLetter.has(`${x},${y}`)) outside += 1;
        }
      }
      return { cover: mask.length ? covered / mask.length : 0, outside: inkTotal ? outside / inkTotal : 0 };
    },
  };
}
