/* ============================================================
   UI/CARDS.JS — Les cartes à collectionner
   Les cartes se MÉRITENT, jamais au hasard :
   • une carte « son » par étape réussie du chemin (40) ;
   • des cartes d'exploit (première leçon, série, régularité,
     sans faute, persévérance, chemin complet) ;
   • une carte de titre à chaque promotion d'échecs ;
   • un diplôme par contrôle de niveau réussi (CE1 → 3e).
   La révélation est en 3D : la carte suit le doigt ou l'inclinaison
   du téléphone, et son reflet holographique glisse dessus.
   ============================================================ */

import { h } from './dom.js';
import { openOverlay } from './overlay.js';
import { TITLES } from '../core/elo.js';

const THEME_BY_KIND = { voyelle: 'theme-blue', longue: 'theme-teal', courte: 'theme-red', complexe: 'theme-purple', regle: 'theme-amber' };
const AURA = { 'theme-blue': '#4a90ff', 'theme-teal': '#1adfcc', 'theme-red': '#ff5060', 'theme-purple': '#a060ff', 'theme-amber': '#ffb830', 'theme-gold': '#ffb830' };

/* Dessins des cartes d'exploit (repris de la v1). */
const ART = {
  first: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><circle cx="70" cy="65" r="48" fill="${c}" fill-opacity=".06" stroke="${c}" stroke-width=".5" stroke-opacity=".2"/><rect x="32" y="45" width="30" height="38" rx="4" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="1.2"/><rect x="78" y="45" width="30" height="38" rx="4" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="1.2"/><line x1="70" y1="46" x2="70" y2="82" stroke="${c}" stroke-width="1.2"/><polygon points="100,21 103,28 111,28 105,33 107,41 100,36 93,41 95,33 89,28 97,28" fill="${c}" fill-opacity=".8"/></svg>`,
  streak: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">${[0, 1, 2, 3, 4].map(i => { const x = 22 + i * 24; const y = 58 - Math.abs(2 - i) * 8; return `<circle cx="${x}" cy="${y}" r="${7 + (2 - Math.abs(2 - i)) * 3}" fill="${c}" fill-opacity="${0.4 + i * 0.12}"/>`; }).join('')}<text x="70" y="102" text-anchor="middle" font-family="Orbitron, sans-serif" font-size="12" font-weight="900" fill="${c}">× 5</text></svg>`,
  check: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><circle cx="70" cy="60" r="34" fill="${c}" fill-opacity=".1" stroke="${c}" stroke-width="1.5"/><polyline points="50,60 63,74 90,44" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  calendar: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><rect x="34" y="30" width="72" height="66" rx="8" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="1.5"/><line x1="34" y1="48" x2="106" y2="48" stroke="${c}" stroke-width="1.5"/>${[0, 1, 2].map(i => `<circle cx="${50 + i * 20}" cy="70" r="6" fill="${c}" fill-opacity=".85"/>`).join('')}</svg>`,
  shield: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><path d="M70,18 L100,28 L100,58 Q100,90 70,105 Q40,90 40,58 L40,28 Z" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="1.5"/><text x="70" y="72" text-anchor="middle" font-family="Orbitron, sans-serif" font-size="18" font-weight="900" fill="${c}">100%</text></svg>`,
  retry: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><path d="M70,24 A38,38 0 1,1 38,56" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><polygon points="30,42 38,60 50,50" fill="${c}"/></svg>`,
  diploma: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><rect x="26" y="28" width="88" height="60" rx="6" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="1.5"/><line x1="40" y1="46" x2="100" y2="46" stroke="${c}" stroke-width="1.5" stroke-opacity=".6"/><line x1="40" y1="58" x2="90" y2="58" stroke="${c}" stroke-width="1.5" stroke-opacity=".6"/><line x1="40" y1="70" x2="74" y2="70" stroke="${c}" stroke-width="1.5" stroke-opacity=".6"/><polygon points="86,96 80,118 94,110 108,118 102,96" fill="${c}" fill-opacity=".7"/><circle cx="94" cy="88" r="14" fill="${c}" fill-opacity=".9"/></svg>`,
  torch: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none"><line x1="70" y1="42" x2="70" y2="100" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-opacity=".5"/><path d="M70,16 Q60,24 62,34 Q65,26 70,30 Q75,26 78,34 Q80,24 70,16Z" fill="${c}"/>${[38, 102].map(x => `<line x1="${x}" y1="65" x2="${x + (x < 70 ? 10 : -10)}" y2="65" stroke="${c}" stroke-width="1.5"/>`).join('')}</svg>`,
};

const EXPLOITS = [
  { id: 'r_first', art: 'first', name: 'Première leçon', desc: 'Le voyage commence ici', theme: 'theme-purple' },
  { id: 'r_streak', art: 'streak', name: '5 d\'affilée', desc: '5 bonnes réponses de suite', theme: 'theme-purple' },
  { id: 'e_regular', art: 'calendar', name: 'Régulier', desc: 'Venu lire 3 jours différents', theme: 'theme-teal' },
  { id: 'e_perfect', art: 'shield', name: 'Sans faute', desc: 'Une séance parfaite', theme: 'theme-teal' },
  { id: 'e_persist', art: 'retry', name: 'Persévérant', desc: 'A réessayé et réussi', theme: 'theme-teal' },
  { id: 'l_educa', art: 'torch', name: 'Lecteur EDUCA', desc: 'Tout le chemin parcouru', theme: 'theme-gold' },
];

/**
 * Catalogue complet, dans l'ordre de la collection.
 * @param {object} cur parcours des sons
 * @param {{ id: string, name: string, grade: string }[]} [levels] niveaux des grands (diplômes)
 */
export function catalogue(cur, levels = []) {
  const sounds = cur.steps.map((s, i) => ({
    id: `son-${s.id}`, kind: 'son', n: i + 1, show: s.show, emoji: cur.word(s.anchor)?.emoji || '',
    name: `Le son ${s.show}`, desc: `comme dans « ${s.anchor} »`, theme: THEME_BY_KIND[s.kind] || 'theme-blue',
  }));
  const exploits = EXPLOITS.map((e, i) => ({ ...e, kind: 'exploit', n: sounds.length + i + 1 }));
  const titles = TITLES.slice(1).map((t, i) => ({
    id: `titre-${t.id}`, kind: 'titre', n: sounds.length + exploits.length + i + 1, piece: t.icon,
    name: t.name, desc: `Élo ${t.min} atteint`, theme: 'theme-gold',
  }));
  const diplomas = levels.map((l, i) => ({
    id: `diplome-${l.id}`, kind: 'diplome', art: 'diploma', n: sounds.length + exploits.length + titles.length + i + 1,
    name: `Diplôme ${l.grade}`, desc: `Contrôle « ${l.name} » réussi`, theme: 'theme-gold',
  }));
  return [...sounds, ...exploits, ...titles, ...diplomas];
}

function frame(card, total, art) {
  const tag = { son: 'Son', exploit: 'Exploit', titre: 'Titre', diplome: 'Diplôme' }[card.kind];
  const dots = card.kind === 'titre' || card.kind === 'diplome' ? 3 : card.kind === 'exploit' ? 2 : 1;
  return `<div class="card ${card.theme}">
  <div class="card-glow"></div><div class="holo"></div><div class="glare-fx"></div>
  <div class="corner-tl"></div><div class="corner-br"></div>
  <div class="card-top"><div class="cat-tag">${tag}</div><div class="card-num">${String(card.n).padStart(2, '0')}/${total}</div></div>
  <div class="art-zone">${art}</div>
  <div class="divider"></div>
  <div class="card-bottom">
    <div class="letter-name">${card.name}</div>
    <div class="letter-word">${card.desc}</div>
    <div class="card-footer"><div class="rarity">${[0, 1, 2].map(i => `<div class="dot${i < dots ? ' on' : ''}"></div>`).join('')}</div>
    <div class="xp-badge">EDUCA</div></div>
  </div></div>`;
}

/** HTML de la face avant (données internes uniquement : rien de saisi par l'utilisateur). */
export function cardHtml(card, total) {
  if (card.kind === 'son') {
    const long = card.show.length > 2 ? ' long' : '';
    return frame(card, total, `<div class="sound-art"><span class="g${long}">${card.show}</span><span class="e">${card.emoji}</span></div>`);
  }
  if (card.kind === 'titre') return frame(card, total, `<div class="title-art"><span class="piece">${card.piece}︎</span></div>`);
  const color = AURA[card.theme] || '#a060ff';
  return frame(card, total, (ART[card.art] || ART.check)(color));
}

/** Petite vignette pour la grille de collection. */
export function cardThumb(card, owned, onOpen) {
  const label = card.kind === 'son' ? card.show : card.kind === 'titre' ? `${card.piece}︎` : card.kind === 'diplome' ? '🎓' : '★';
  return h('button', {
    type: 'button',
    class: `coll-item ${owned ? card.theme : 'locked'}`,
    'aria-label': owned ? card.name : 'Carte mystère',
    onclick: () => onOpen(card, owned),
  }, h('span', { class: 'g' }, owned ? label : '?'), h('span', { class: 'n' }, owned ? card.name : '…'));
}

/* L'inclinaison suit le doigt ou le gyroscope (iOS : permission au 1er toucher). */
function tilt(stage, wrap) {
  const apply = (x, y) => {
    const cx = Math.min(1.15, Math.max(-0.15, x));
    const cy = Math.min(1.15, Math.max(-0.15, y));
    wrap.classList.remove('idle');
    wrap.style.setProperty('--rx', `${((0.5 - cy) * 22).toFixed(2)}deg`);
    wrap.style.setProperty('--ry', `${((cx - 0.5) * 26).toFixed(2)}deg`);
    wrap.style.setProperty('--px', `${(cx * 100).toFixed(1)}%`);
    wrap.style.setProperty('--py', `${(cy * 100).toFixed(1)}%`);
    wrap.style.setProperty('--posx', `${((1 - cx) * 100).toFixed(1)}%`);
    wrap.style.setProperty('--posy', `${((1 - cy) * 100).toFixed(1)}%`);
  };
  stage.addEventListener('pointermove', e => {
    const r = wrap.getBoundingClientRect();
    apply((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  let asked = false;
  stage.addEventListener('pointerdown', () => {
    if (asked || typeof DeviceOrientationEvent === 'undefined') return;
    asked = true;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {});
  });
  const onOrient = e => {
    if (e.gamma == null || e.beta == null) return;
    apply((e.gamma + 35) / 70, (e.beta - 15) / 55);
  };
  addEventListener('deviceorientation', onOrient);
  return () => removeEventListener('deviceorientation', onOrient);
}

/**
 * Révèle une carte : dos d'abord, l'enfant la retourne d'un toucher.
 * @returns {Promise<void>} résolue à la fermeture
 */
export function revealCard({ router, voice, sfx }, card, total, { isNew = true } = {}) {
  const inner = h('div', { class: 'card-inner' },
    h('div', { class: 'card-face card-back' }, h('div', { class: 'card-back-logo' }, 'E'), h('div', { class: 'card-back-text' }, 'EDUCA')),
    h('div', { class: 'card-face card-front', html: cardHtml(card, total) }));
  const wrap = h('button', { class: 'card-wrap idle', type: 'button', 'aria-label': 'Retourner la carte', 'data-autofocus': true }, inner);
  const hint = h('p', { class: 'center' }, 'Touche la carte pour la retourner');
  const next = h('button', { class: 'btn btn-gold', type: 'button', hidden: true }, 'Continuer');
  const stage = h('div', { class: 'card-stage' }, h('div', { class: 'card-halo' }), h('h2', null, isNew ? 'Nouvelle carte !' : 'Ta carte'), wrap, hint, next);
  stage.style.setProperty('--aura', AURA[card.theme] || '#7c3aed');
  const ov = openOverlay(router, { content: stage, label: 'Carte' });
  const untilt = tilt(ov.el, wrap);
  voice.say(isNew ? 'Tu as gagné une carte ! Touche-la pour la retourner !' : 'Touche la carte pour la retourner !');
  let flipped = false;
  wrap.addEventListener('click', () => {
    if (flipped) return;
    flipped = true;
    inner.classList.add('flipped');
    wrap.classList.add('revealed');
    hint.hidden = true;
    next.hidden = false;
    next.focus();
    sfx.card();
    voice.say(card.kind === 'son' ? `${card.name}, ${card.desc} !` : `${card.name} ! ${card.desc}.`);
  });
  next.addEventListener('click', () => ov.close());
  return ov.closed.then(untilt);
}
