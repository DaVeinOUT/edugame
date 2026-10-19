/* ============================================================
   SCREENS/HUB.JS — L'accueil
   Un seul gros bouton « Jouer » : Kaya choisit la bonne séance
   (le son du jour, ou des révisions quand beaucoup de choses sont
   à revoir). Autour : le chemin, les cartes, les jeux libres,
   la force de lecture (Élo) et les étoiles gagnées.
   ============================================================ */

import { h } from '../ui/dom.js';
import { kayaEl } from '../ui/kaya.js';
import { eloBadge } from '../ui/elo.js';
import { toast } from '../ui/fx.js';
import { display } from '../core/elo.js';
import { isDue } from '../core/srs.js';
import { phonicsDone, nextModule, openLevels, moduleRecord, dueReviews, hasReviewable } from '../core/levels.js';
import { captionOf } from '../services/voice.js';

const greeted = new Set();   // une salutation par enfant et par ouverture de l'app
let warnedStorage = false;
const REST_SAY = 'On a bien travaillé aujourd\'hui ! Kaya se repose. À demain !';

/** Ce que propose le bouton « Jouer ». L : niveaux des grands (core/levels.js). */
export function nextActivity(profile, cur, now = Date.now(), L = null) {
  // Chemin des sons fini (ou déjà su d'après le positionnement) : on monte de niveau en niveau.
  if (L?.levels.length && phonicsDone(profile, cur)) {
    // Beaucoup de choses à revoir après un module : on révise d'abord (répétition espacée).
    if (profile.path.lastKind === 'module' && dueReviews(L, profile, now) >= 8) {
      return { mode: 'review', label: 'Révisions', parts: ['On révise un peu ce que tu as appris dans les niveaux ? Touche le gros bouton !'] };
    }
    const m = nextModule(L, profile, cur, display(profile.elo));
    if (m?.isControle) {
      const { grade } = L.level(m.level);
      const started = L.modulesOf(m.level).some(x => moduleRecord(profile, x.id));
      return { mode: 'module', module: m.id, label: `Contrôle ${grade}`,
               parts: [started
                 ? `Tu as fini les modules du niveau ${grade}. Prêt pour le contrôle ? Touche le gros bouton !`
                 : `Pour commencer le niveau ${grade}, un petit contrôle : si tu le réussis, tu montes tout de suite ! Touche le gros bouton !`] };
    }
    if (m) return { mode: 'module', module: m.id, label: m.title, parts: [`Aujourd'hui : ${m.title}.`, 'Touche le gros bouton !'] };
    // Tout fini : on révise les niveaux (pas les sons du CP).
    return { mode: hasReviewable(L, profile) ? 'review' : 'practice', label: 'Révisions',
             parts: ['Tu as fini tous les niveaux, bravo ! On révise ? Touche le gros bouton !'] };
  }
  const step = cur.step(profile.path.open);
  const due = Object.values(profile.mem).filter(r => r.b > 0 && isDue(r, now)).length;
  if (profile.stats.sessions > 0 && profile.path.lastKind === 'lesson' && due >= 8) {
    return { mode: 'practice', label: 'Révisions', parts: ['On révise un peu ce que tu as appris ? Touche le gros bouton !'] };
  }
  return { mode: 'lesson', step: step.index, label: `Le son « ${step.show} »`, parts: todayParts(step) };
}

/* Ce que Kaya annonce pour la leçon du jour (jamais un son vide). */
function todayParts(step) {
  const end = 'Touche le gros bouton !';
  if (step.kind === 'contraste') return ['Aujourd\'hui, on apprend à ne plus confondre b, d, p et q !', end];
  if (!step.ph) return [`Aujourd'hui, on découvre : ${step.show}.`, end];
  if (step.show === step.ph) return ['Aujourd\'hui, on apprend le son', { sound: step.ph }, '.', end];
  // Graphème de plusieurs lettres ou règle : on montre l'écriture ET le son.
  return ['Aujourd\'hui, on apprend à lire', { word: step.show.split(' ')[0] }, ', qui fait le son', { sound: step.ph }, '.', end];
}

export const hub = {
  mount(view, params, ctx) {
    const { store, voice, router, cur } = ctx;
    const p = ctx.profile();
    if (!p) { ctx.home(); return undefined; }
    const points = display(p.elo);
    const L = ctx.levels;
    const next = nextActivity(p, cur, Date.now(), L);
    const reached = openLevels(L, p, cur, points);
    const rested = ctx.rested();
    const name = p.name ? ` ${p.name}` : '';

    let parts;
    if (rested) parts = [REST_SAY];
    else if (params.first) parts = [`Bienvenue${name} ! Je suis tellement content de lire avec toi.`, ...next.parts];
    else if (params.migrated) parts = [`Te revoilà${name} ! J'ai gardé toutes tes cartes. Maintenant, on apprend le SON des lettres !`, ...next.parts];
    else parts = [`Salut${name} !`, ...next.parts];
    const caption = captionOf(parts);

    const kaya = kayaEl();
    const bubble = h('button', { class: 'bubble', type: 'button', onclick: () => voice.seq(parts) }, caption);
    const play = h('button', {
      class: 'btn btn-gold btn-play', type: 'button', 'data-autofocus': true, disabled: rested || null,
      onclick: () => router.go('lesson', { mode: next.mode, step: next.step, module: next.module }),
    }, h('span', { class: 'play-icon', 'aria-hidden': 'true' }, rested ? '😴' : '▶'),
      h('span', { class: 'stack', style: { gap: '0', alignItems: 'flex-start' } },
        h('span', null, rested ? 'À demain !' : 'Jouer'),
        rested ? null : h('span', { style: { fontSize: '1rem', opacity: '.8' } }, next.label)));

    const tile = (ico, label, sub, go) => h('button', { type: 'button', class: 'tile', onclick: go },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, ico), label, sub ? h('span', { class: 'sub' }, sub) : null);
    const several = store.profiles().length > 1;

    view.append(
      h('div', { class: 'hub-head' },
        h('button', { class: 'avatar', type: 'button', 'aria-label': several ? 'Changer d\'enfant' : 'Mon profil',
          onclick: () => router.go(several ? 'profiles' : 'ladder') }, p.avatar),
        h('div', { class: 'grow' }, h('div', { class: 'hub-name' }, p.name || 'Bonjour !'),
          h('span', { class: 'wallet', 'aria-label': `${p.wallet} étoiles` }, '⭐ ', String(p.wallet))),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Espace des grands', onclick: () => router.go('adult') }, '⚙️')),
      h('div', { class: 'row centered' }, eloBadge(points, () => router.go('ladder'))),
      h('div', { class: 'kaya-row' }, kaya, bubble),
      play,
      h('div', { class: 'tiles' },
        tile('🗺️', 'Le chemin', `${p.path.open + 1} / ${cur.steps.length}`, () => router.go('path')),
        tile('🃏', 'Mes cartes', `${p.cards.length}`, () => router.go('collection')),
        tile('🎮', 'Jeux', 'libres', () => router.go('games')),
        L.levels.length ? tile('📚', 'Niveaux', reached.length ? reached[reached.length - 1].grade : 'CE1 → 3e', () => router.go('levels')) : null));

    // params.rest : on arrive d'un jeu refusé par le plafond quotidien — Kaya l'explique.
    if (!greeted.has(p.id) || params.first || params.migrated || params.rest) {
      greeted.add(p.id);
      voice.seq(parts);
    }
    if (store.degraded && !warnedStorage) {
      warnedStorage = true;
      toast('Attention : ce navigateur ne garde pas la progression (navigation privée ?)', { ms: 6000 });
    }
    ctx.offerUpdate();
    return () => voice.stop();
  },
};
