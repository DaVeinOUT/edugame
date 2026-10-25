/* ============================================================
   SCREENS/ADULT.JS — L'espace des grands (parents, enseignants)
   Protégé par un petit défi de lecture (des chiffres écrits en
   lettres) : un enfant qui ne lit pas encore ne peut pas entrer.
   • Progrès : force de lecture honnête (avec sa courbe), sons
     maîtrisés, confusions, temps, activités hors écran, impression.
   • Réglages de l'enfant : police, espacement, coloration, voix…
   • Appareil : voix, mode silencieux, étape de la classe, temps max.
   • Données : export, import, effacement — rien ne quitte l'appareil.
   ============================================================ */

import { h, append } from '../ui/dom.js';
import { display, toPoints, titleFor } from '../core/elo.js';
import { isMastered } from '../core/srs.js';
import { localDay } from '../core/time.js';
import { openLevels, moduleRecord, controlePassed } from '../core/levels.js';
import { classRows, toCSV, CLASS_COLUMNS } from '../core/report.js';
import { AVATARS, UNIVERSES, AGES, cleanName } from '../core/schema.js';
import { toast } from '../ui/fx.js';
import { hashPin, checkPin, isPin, PIN_LENGTH } from '../core/pin.js';
import { recordingSupported, startRecording, saveRecording, deleteRecording, loadRecordings, clearRecordings } from '../services/recordings.js';
import { OFFLINE_LABELS } from '../services/offline.js';

/* Sons que l'adulte peut enregistrer (consonnes d'abord : ce sont elles que
   la synthèse vocale prononce mal). */
const RECORDABLE = [
  ['m', 'moto'], ['n', 'nuage'], ['l', 'lion'], ['r', 'robot'], ['s', 'soleil'], ['z', 'zèbre'], ['f', 'fusée'],
  ['v', 'vélo'], ['ch', 'chat'], ['j', 'jus'], ['p', 'pomme'], ['t', 'tortue'], ['k', 'canard'], ['b', 'ballon'],
  ['d', 'dinosaure'], ['g', 'gâteau'], ['gn', 'montagne'], ['y', 'papillon'],
  ['a', 'ananas'], ['i', 'île'], ['o', 'os'], ['u', 'usine'], ['ou', 'ours'], ['e', 'renard'], ['é', 'éléphant'],
  ['è', 'chèvre'], ['eu', 'feu'], ['on', 'mouton'], ['an', 'panda'], ['in', 'lapin'], ['oi', 'roi'],
];

function soundsSection(ctx) {
  const { voice, router } = ctx;
  const intro = h('p', { class: 'note' },
    'Pour apprendre à lire, il faut des sons PURS : « mmm », « sss », jamais « me » ou « se ». Kaya utilise une synthèse de secours. '
    + 'Pour un son plus naturel, enregistrez votre voix : 2 secondes, sans voyelle (pour p, t, k, b, d, g : un petit bruit très court). '
    + 'Les enregistrements restent sur cet appareil et servent à tous les enfants.');
  if (!recordingSupported()) return section('Les sons de Kaya', intro, h('p', { class: 'note' }, 'Ce navigateur ne permet pas d\'enregistrer.'));
  const rows = RECORDABLE.map(([ph, example]) => {
    const has = voice.hasRecording(ph);
    const rec = btn('● Enregistrer', async () => {
      rec.disabled = true;
      rec.textContent = '🎙️ Parlez…';
      try {
        const session = await startRecording();
        const blob = await session.done;
        await saveRecording(ph, blob);
        voice.setRecordings(await loadRecordings());
        toast(`Son « ${ph} » enregistré`);
        router.refresh();
      } catch {
        toast('Micro indisponible ou refusé');
        rec.disabled = false;
        rec.textContent = '● Enregistrer';
      }
    });
    const del = has ? btn('🗑️', async () => {
      await deleteRecording(ph);
      voice.setRecordings(await loadRecordings());
      router.refresh();
    }) : null;
    return h('tr', null, h('td', { class: 'read' }, ph), h('td', null, `comme dans « ${example} »`),
      h('td', null, h('div', { class: 'row wrap' }, btn('▶', () => voice.sound(ph)), rec, del)),
      h('td', { class: 'note' }, has ? 'votre voix ✓' : 'synthèse'));
  });
  return section('Les sons de Kaya', intro, h('table', { class: 'mini' }, h('tbody', null, rows)));
}

const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const UNLOCK_MS = 10 * 60 * 1000;
let unlockedUntil = 0;
export const adultUnlocked = () => Date.now() <= unlockedUntil;
export const lockAdult = () => { unlockedUntil = 0; };

const btn = (label, onclick, cls = 'btn btn-soft btn-sm') => h('button', { type: 'button', class: cls, onclick }, label);
const section = (title, ...children) => h('section', { class: 'panel stack' }, h('h2', null, title), ...children);

/* Le code de l'adulte : 5 erreurs de suite → 30 secondes d'attente. */
const PIN_MAX_FAILS = 5;
const PIN_COOLDOWN_MS = 30 * 1000;
let pinFails = 0;
let pinBlockedUntil = 0;

function pinGate(ctx, saved) {
  const { router } = ctx;
  let typed = '';
  const shown = h('p', { class: 'h2 center', 'aria-live': 'polite' }, '');
  const press = async d => {
    if (Date.now() < pinBlockedUntil) { toast('Patientez quelques secondes avant de réessayer'); return; }
    typed += d;
    shown.textContent = '● '.repeat(typed.length).trim();
    if (typed.length < PIN_LENGTH) return;
    const code = typed;
    typed = '';
    if (await checkPin(code, saved)) { pinFails = 0; unlockedUntil = Date.now() + UNLOCK_MS; router.refresh(); return; }
    pinFails += 1;
    if (pinFails >= PIN_MAX_FAILS) { pinFails = 0; pinBlockedUntil = Date.now() + PIN_COOLDOWN_MS; }
    shown.textContent = '';
    toast('Ce n\'est pas le bon code');
  };
  const pad = h('div', { class: 'gate-pad' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map(d => h('button', { type: 'button', onclick: () => press(String(d)) }, String(d))));
  return [h('p', null, 'Entrez le code de l\'espace des grands :'), shown, pad,
    h('p', { class: 'note' }, 'Code oublié ? Il n\'existe que sur cet appareil : pour l\'effacer, il faut effacer les données du site dans le navigateur (les progrès aussi). Exportez une sauvegarde de temps en temps.')];
}

/* Le code (2 fois les mêmes 4 chiffres) : jamais gardé en clair, jamais exporté. */
function pinForm(ctx, label = 'Enregistrer le code') {
  const field = aria => h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'off', maxlength: String(PIN_LENGTH), class: 'input pin-input', 'aria-label': aria });
  const a = field('Code à 4 chiffres');
  const b = field('Le même code, une seconde fois');
  const save = btn(label, async () => {
    if (!isPin(a.value) || a.value !== b.value) { toast('Tapez deux fois le même code de 4 chiffres'); return; }
    const adultPin = await hashPin(a.value);
    ctx.store.updateDevice(x => ({ ...x, adultPin }));
    ctx.store.flush();
    toast('Code enregistré : il sera demandé à chaque entrée');
    ctx.router.refresh();
  }, 'btn btn-primary btn-sm');
  return h('div', { class: 'row wrap' }, a, b, save);
}

function pinSection(ctx) {
  if (!ctx.store.device().adultPin) return null;
  return section('Code de l\'espace des grands',
    h('p', { class: 'note' }, 'Un code à 4 chiffres protège cet espace.'),
    pinForm(ctx, 'Changer le code'),
    btn('Retirer le code', () => {
      ctx.store.updateDevice(x => ({ ...x, adultPin: null }));
      ctx.router.refresh();
    }, 'btn btn-soft btn-sm'));
}

function gate(view, ctx) {
  const { voice, router, store } = ctx;
  const saved = store.device().adultPin;
  if (saved) {
    view.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Espace des grands')),
      h('div', { class: 'panel stack center' }, pinGate(ctx, saved)));
    voice.say('Cet espace est pour les grands ! Demande à un adulte.');
    return;
  }
  const digits = Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 9));
  let typed = [];
  const shown = h('p', { class: 'h2 center', 'aria-live': 'polite' }, '');
  const pad = h('div', { class: 'gate-pad' });
  for (let d = 1; d <= 9; d++) {
    pad.append(h('button', { type: 'button', onclick: () => {
      typed = [...typed, d];
      shown.textContent = typed.map(() => '●').join(' ');
      if (typed.length < 3) return;
      if (typed.join('') === digits.join('')) { unlockedUntil = Date.now() + UNLOCK_MS; router.refresh(); }
      else { toast('Ce n\'est pas la bonne suite'); router.refresh(); }
    } }, String(d)));
  }
  view.append(
    h('div', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
      h('h1', { class: 'title' }, 'Espace des grands')),
    h('div', { class: 'panel stack center' },
      h('p', null, 'Pour entrer, touchez ces chiffres dans l\'ordre :'),
      h('p', { class: 'h1' }, digits.map(d => WORDS[d]).join(', ')),
      shown, pad));
  voice.say('Cet espace est pour les grands ! Demande à un adulte.');
}

/* Petite courbe (record affiché et estimation honnête) en SVG. */
function curve(history) {
  const pts = history.slice(-30);
  if (pts.length < 2) return h('p', { class: 'note' }, 'La courbe apparaîtra après quelques séances.');
  const W = 320; const H = 150; const pad = 10;
  const vals = pts.flatMap(([, peak, theta]) => [peak, toPoints(theta)]);
  const min = Math.min(...vals) - 20; const max = Math.max(...vals) + 20;
  const x = i => pad + (i * (W - 2 * pad)) / (pts.length - 1);
  const y = v => H - pad - ((v - min) * (H - 2 * pad)) / (max - min || 1);
  const line = (sel, color, dash) => `<polyline fill="none" stroke="${color}" stroke-width="3" ${dash ? 'stroke-dasharray="6 5"' : ''} points="${pts.map((e, i) => `${x(i).toFixed(1)},${y(sel(e)).toFixed(1)}`).join(' ')}"/>`;
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution de la force de lecture">
    ${line(e => e[1], '#d97706', false)}${line(e => toPoints(e[2]), '#6366f1', true)}</svg>`;
  return h('div', null, h('div', { html: svg }),
    h('p', { class: 'note' }, 'Trait plein : Élo affiché à l\'enfant (record, ne baisse jamais). Pointillés : estimation du moment, qui sert à choisir les exercices.'));
}

function daysBars(days) {
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);   // jours du calendrier local (changement d'heure compris)
    out.push(Math.round((days?.[localDay(d.getTime())] || 0) / 60));
  }
  const max = Math.max(10, ...out);
  const bars = out.map((m, i) => `<rect x="${i * 22 + 4}" y="${100 - (m / max) * 90}" width="16" height="${(m / max) * 90}" rx="4" fill="#7c3aed"/>`).join('');
  return h('div', { html: `<svg class="chart" viewBox="0 0 312 104" role="img" aria-label="Minutes de jeu par jour, 14 derniers jours">${bars}</svg>` });
}

/* Les niveaux des grands : ce qui est ouvert, les étoiles des modules, les contrôles. */
function levelsSection(p, ctx, points) {
  const L = ctx.levels;
  if (!L.levels.length) return null;
  const open = openLevels(L, p, ctx.cur, points);
  if (!open.length) {
    return section('Niveaux des grands (CE1 → 3e)',
      h('p', null, `Pas encore ouverts : ils s'ouvrent à la fin du chemin des sons, ou à ${L.levels[0].unlockElo} points d'Élo.`));
  }
  return section('Niveaux des grands (CE1 → 3e)', open.map(lv => h('div', { class: 'stack' },
    h('h3', null, `${lv.grade} — ${lv.name}${controlePassed(p, lv.id) ? ' · contrôle réussi 🎓' : ''}`),
    h('ul', null, L.modulesOf(lv.id).filter(m => !m.isControle).map(m => {
      const rec = moduleRecord(p, m.id);
      return h('li', null, `${m.title} : ${rec ? `${'★'.repeat(rec.stars)}${'☆'.repeat(3 - rec.stars)} (${rec.tries} essai${rec.tries > 1 ? 's' : ''})` : 'pas encore fait'}`);
    })))),
    h('p', { class: 'note' }, 'Chaque niveau suit les programmes officiels de français en vigueur. Le contrôle (70 % de réussite) ouvre le niveau suivant ; il se retente à volonté.'));
}

function progressTab(p, ctx) {
  const { cur } = ctx;
  const shown = display(p.elo);
  const { title } = titleFor(shown);
  const sigma = Math.sqrt(p.elo.v);
  const step = cur.step(p.path.open);
  const grid = h('div', { class: 'mastery' }, cur.steps.map(s => {
    const rec = p.mem[`snd:${s.id}`] || p.mem[`pa:${s.ph}`];
    const cls = !rec ? '' : isMastered(rec) ? 'm3' : rec.b >= 2 ? 'm2' : 'm1';
    return h('span', { class: cls, title: s.show }, s.show);
  }));
  const conf = Object.entries(p.stats.confusions || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const readable = cur.readableAt(p.path.open).slice(-3).map(w => w.text);
  const minutes = Math.round((p.stats.seconds || 0) / 60);
  return [
    section('Force de lecture (Élo)',
      h('p', null, `Affiché à l'enfant : ${shown} — ${title.name}. Estimation actuelle : ${toPoints(p.elo.theta)} (± ${Math.round(sigma * 174)}).`),
      curve(p.elo.history || [])),
    section('Le chemin',
      h('p', null, `Étape ${p.path.open + 1} sur ${cur.steps.length} : le son « ${step.show} ». Étoiles : ${Object.values(p.path.stars).reduce((a, b) => a + b, 0)}.`),
      grid,
      h('p', { class: 'note' }, 'Vert : maîtrisé (réussi plusieurs jours de suite) · Jaune : en cours · Orange : à revoir · Gris : pas encore vu.')),
    levelsSection(p, ctx, shown),
    section('Points de vigilance',
      conf.length
        ? h('ul', null, conf.map(([k, n]) => h('li', null, `${k.replace('/', ' ↔ ')} : ${n} fois`)))
        : h('p', null, 'Aucune confusion répétée pour l\'instant.'),
      h('p', { class: 'note' }, 'Les lettres qui se ressemblent (b/d, p/q, m/n) et les sons proches (f/v, ch/j, on/an) sont travaillés ensemble automatiquement. À la maison : tracez-les en grand, dites leur son, cherchez des mots.')),
    section('Temps de jeu', h('p', null, `${minutes} minutes au total, ${p.stats.sessions} séances.`), daysBars(p.stats.days)),
    section('Idées hors écran (étape actuelle)',
      h('ul', null,
        h('li', null, `Cherchez ensemble des objets de la maison qui contiennent le son « ${step.show} ».`),
        h('li', null, `Tracez « ${step.show} » en grand dans le sable, la farine, ou du doigt dans le dos de l'enfant.`),
        readable.length ? h('li', null, `Lisez ensemble : ${readable.join(', ')}.`) : null)),
    h('div', { class: 'row centered no-print' }, btn('🖨️ Imprimer le bilan', () => print(), 'btn btn-primary btn-sm')),
  ];
}

function settingsTab(p, ctx) {
  const { voice } = ctx;
  const set = patch => { ctx.store.updateProfile(p.id, x => ({ ...x, ...patch(x) })); ctx.applyTheme(); ctx.router.refresh(); };
  const toggle = (key, label, sayOn) => h('button', {
    type: 'button', class: 'toggle', 'aria-pressed': p.comfort[key] ? 'true' : 'false',
    onclick: () => { set(x => ({ comfort: { ...x.comfort, [key]: !x.comfort[key] } })); if (!p.comfort[key] && sayOn) voice.say(sayOn); },
  }, label, h('span', { class: 'state' }, p.comfort[key] ? 'Oui' : 'Non'));
  const seg = (key, options) => h('div', { class: 'seg' }, options.map(([v, label]) => h('button', {
    type: 'button', 'aria-pressed': p.comfort[key] === v ? 'true' : 'false',
    onclick: () => set(x => ({ comfort: { ...x.comfort, [key]: v } })),
  }, label)));
  const nameInput = h('input', { class: 'input', type: 'text', maxlength: '20', value: p.name, 'aria-label': 'Prénom' });
  return [
    section(`Réglages de ${p.name || 'cet enfant'} ${p.avatar}`,
      h('p', { class: 'note' }, 'Chaque enfant a ses propres réglages : ils suivent l\'enfant sur une tablette partagée.'),
      h('h3', null, 'Police des lettres'), seg('font', [['andika', 'Andika (conseillée)'], ['opendyslexic', 'OpenDyslexic'], ['nunito', 'Nunito']]),
      h('p', { class: 'read center', style: { fontSize: '1.8rem' } }, 'lune · moto · b d p q'),
      h('h3', null, 'Espacement des lettres'), seg('spacing', [['normal', 'Normal'], ['wide', 'Large'], ['xwide', 'Très large']]),
      toggle('syllableColors', 'Coloration syllabique (lettres muettes en gris)'),
      toggle('softBg', 'Fond doux (crème)'),
      toggle('slowVoice', 'Voix plus lente', 'Je parle plus doucement.'),
      toggle('captions', 'Sous-titres de Kaya'),
      toggle('reducedMotion', 'Moins d\'animations'),
      toggle('screenReader', 'L\'enfant utilise un lecteur d\'écran (Kaya se tait)')),
    section('Profil',
      h('label', null, 'Prénom', nameInput),
      btn('Enregistrer le prénom', () => set(() => ({ name: cleanName(nameInput.value) }))),
      h('h3', null, 'Animal'), h('div', { class: 'pick-grid' }, AVATARS.map(a => h('button', {
        type: 'button', class: `pick${p.avatar === a ? ' selected' : ''}`, onclick: () => set(() => ({ avatar: a })),
      }, a))),
      h('h3', null, 'Âge'), h('div', { class: 'seg' }, AGES.map(a => h('button', { type: 'button', 'aria-pressed': p.age === a ? 'true' : 'false', onclick: () => set(() => ({ age: a })) }, `${a} ans`))),
      h('h3', null, 'Univers'), h('div', { class: 'seg' }, UNIVERSES.map(u => h('button', { type: 'button', 'aria-pressed': p.universe === u ? 'true' : 'false', onclick: () => set(() => ({ universe: u })) }, { jungle: '🌴 Jungle', ocean: '🌊 Océan', space: '🚀 Espace' }[u])))),
    section('Commencer plus loin',
      h('p', { class: 'note' }, 'Pour un enfant qui connaît déjà ses premiers sons : ouvrez le chemin jusqu\'à une étape. Les révisions vérifieront les acquis.'),
      h('div', { class: 'seg' }, ctx.cur.steps.map((s, i) => h('button', {
        type: 'button', 'aria-pressed': p.path.open === i ? 'true' : 'false', class: 'read',
        onclick: () => set(x => ({ path: { ...x.path, open: i } })),
      }, s.show)))),
  ];
}

/* Installer EDUCA comme une application : invite du navigateur (Android) ou instructions (iPhone, iPad). */
function installSection(ctx) {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return section('Application', h('p', { class: 'note' }, 'EDUCA est installé sur cet appareil : il s\'ouvre comme une application, même sans internet.'));
  if (ctx.installPrompt) {
    return section('Installer EDUCA', h('p', { class: 'note' }, 'Une icône sur l\'écran d\'accueil, plein écran, et tout fonctionne sans internet.'),
      btn('📲 Installer l\'application', async () => {
        const prompt = ctx.installPrompt;
        ctx.installPrompt = null;
        prompt.prompt();
        await prompt.userChoice.catch(() => null);
        ctx.router.refresh();
      }, 'btn btn-primary'));
  }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return section('Installer EDUCA', h('p', { class: 'note' }, ios
    ? 'Sur iPhone ou iPad (Safari) : touchez Partager, puis « Sur l\'écran d\'accueil ».'
    : 'Dans le menu du navigateur, choisissez « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».'));
}

function deviceTab(ctx) {
  const { store, voice, sfx } = ctx;
  const d = store.device();
  const refresh = () => ctx.router.refresh();
  const voices = voice.choices();
  const statusText = { ok: 'Voix française locale disponible. Les voix distantes sont exclues.', novoice: 'Aucune voix française locale : les mots et sons enregistrés restent audibles, mais les consignes complètes nécessitent une voix française installée sur l’appareil. Les sous-titres restent disponibles.', unsupported: 'Synthèse vocale indisponible : seuls les mots et sons enregistrés sont audibles. Les sous-titres restent disponibles.', unknown: 'Recherche des voix locales…' }[voice.status];
  const offlineText = h('p', { class: 'note', role: 'status' }, OFFLINE_LABELS[ctx.offline?.status || 'unavailable']);
  return [
    installSection(ctx),
    pinSection(ctx),
    section('Disponibilité hors ligne', offlineText,
      btn('Vérifier le téléchargement', async () => {
        offlineText.textContent = OFFLINE_LABELS.checking;
        await ctx.offline?.check();
        offlineText.textContent = OFFLINE_LABELS[ctx.offline?.status || 'unavailable'];
      })),
    section('Voix de Kaya', h('p', { class: 'note' }, statusText),
      h('p', { class: 'note' }, 'Avant de laisser l’enfant seul, testez le son sur cet appareil. Le téléchargement des fichiers ne garantit pas la présence d’une voix système locale.'),
      btn('Tester un son, un mot et une consigne', () => voice.seq([{ sound: 'a' }, { word: 'moto' }, 'Bonjour, on lit ensemble ?'])),
      voices.length ? h('div', { class: 'stack' }, voices.map(v => btn(`${v.name === voice.current() ? '✓ ' : ''}${v.name.replace(/\(.*\)/, '').trim()} · ${v.lang}`, () => {
        store.updateDevice(x => ({ ...x, voice: v.name }));
        voice.configure({ preferred: v.name });
        voice.say('Salut ! Je suis Kaya ! On lit ensemble ?');
        refresh();
      }))) : null,
      h('button', { type: 'button', class: 'toggle', 'aria-pressed': d.muted ? 'true' : 'false', onclick: () => {
        store.updateDevice(x => ({ ...x, muted: !x.muted }));
        voice.configure({ muted: !d.muted });
        sfx.muted = !d.muted;
        ctx.applyTheme();
        refresh();
      } }, 'Mode silencieux (classe, bibliothèque) : sous-titres seulement', h('span', { class: 'state' }, d.muted ? 'Oui' : 'Non'))),
    section('En classe',
      h('p', { class: 'note' }, 'Étape de la classe : autorise l’accès à ce son pour tous les enfants. Le bouton Jouer garde la progression individuelle ; ce réglage n’assigne pas une leçon et ne valide aucun acquis.'),
      h('div', { class: 'seg' }, [h('button', { type: 'button', 'aria-pressed': d.classStep == null ? 'true' : 'false', onclick: () => { store.updateDevice(x => ({ ...x, classStep: null })); refresh(); } }, 'Aucune'),
        ...ctx.cur.steps.map((s, i) => h('button', { type: 'button', class: 'read', 'aria-pressed': d.classStep === i ? 'true' : 'false', onclick: () => { store.updateDevice(x => ({ ...x, classStep: i })); refresh(); } }, s.show))]),
      h('h3', null, 'Temps de jeu maximum par jour'),
      h('div', { class: 'seg' }, [0, 10, 15, 20, 30].map(m => h('button', { type: 'button', 'aria-pressed': (d.dailyMinutes || 0) === m ? 'true' : 'false', onclick: () => { store.updateDevice(x => ({ ...x, dailyMinutes: m })); refresh(); } }, m ? `${m} min` : 'Sans limite')))),
    soundsSection(ctx),
  ];
}

function download(name, data, type = 'application/json') {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function dataTab(ctx) {
  const { store, router } = ctx;
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast('Fichier refusé : maximum 10 Mio.'); file.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const list = store.importAll(JSON.parse(String(reader.result)));
        toast(`${list.length} profil(s) importé(s)`);
        router.refresh();
      } catch (e) {
        toast(`Fichier refusé : ${e.message}`, { ms: 5000 });
      }
    };
    reader.readAsText(f);
    file.value = '';
  });
  let armed = false;
  const wipe = btn('Tout effacer sur cet appareil…', async () => {
    if (!armed) { armed = true; wipe.textContent = 'Confirmer : TOUT effacer (pensez à exporter avant)'; wipe.className = 'btn btn-danger btn-sm'; return; }
    if (Date.now() > unlockedUntil) { router.refresh(); return; }   // verrou revérifié avant tout effacement
    wipe.disabled = true;
    try {
      await clearRecordings();
      ctx.voice.setRecordings(new Map());
      if (!store.wipe()) throw new Error('Les profils n’ont pas pu être effacés.');
      location.reload();
    } catch {
      wipe.disabled = false;
      toast('Effacement incomplet. Les données restantes sont conservées : réessayez avant de fermer.', { ms: 8000 });
    }
  });
  const errors = store.device().errors || [];
  return [
    section('Enfants de cet appareil',
      h('table', { class: 'mini' }, h('tbody', null, store.profiles().map(p => {
        const del = btn('Supprimer', () => {
          if (Date.now() > unlockedUntil) { router.refresh(); return; }
          if (del.dataset.armed) { store.removeProfile(p.id); ctx.applyTheme(); router.refresh(); return; }
          del.dataset.armed = '1'; del.textContent = 'Confirmer ?'; del.className = 'btn btn-danger btn-sm';
        });
        return h('tr', null, h('td', null, `${p.avatar} ${p.name || '(sans prénom)'}`), h('td', null, `étape ${p.path.open + 1}, Élo ${display(p.elo)}`), h('td', null, del));
      }))),
      btn('➕ Ajouter un enfant', () => router.go('welcome', { adding: true }), 'btn btn-primary btn-sm')),
    section('Sauvegarde',
      h('p', { class: 'note' }, 'Aucune donnée ne quitte l\'appareil. Pour changer de tablette, exportez un fichier puis importez-le sur l\'autre appareil.'),
      h('p', { class: 'note' }, 'L’import réunit les cartes et les acquis des profils portant le même identifiant, sans additionner leurs compteurs : le maximum est conservé. Les réglages de cet appareil sont conservés lorsqu’il a déjà des profils. Sur un appareil vide, la limite quotidienne est restaurée. Le code adulte et les sons enregistrés au micro ne sont pas importés.'),
      h('div', { class: 'row wrap' },
        btn('💾 Exporter tout', () => download(`educa-sauvegarde-${localDay()}.json`, store.exportAll())),
        btn('📥 Importer', () => file.click())), file,
      store.degraded ? h('p', { class: 'note' }, '⚠️ Ce navigateur n\'enregistre pas la progression (navigation privée ou stockage plein). Installez EDUCA sur l\'écran d\'accueil.') : null),
    section('Effacer', h('p', { class: 'note' }, 'Supprime tous les profils, réglages, progrès et sons enregistrés au micro. Les fichiers du jeu téléchargés pour le hors ligne restent disponibles.'), wipe),
    section('Confidentialité',
      h('p', null, 'EDUCA fonctionne sans compte, sans serveur, sans publicité ni mesure d\'audience. Tout reste sur cet appareil (stockage local du navigateur). Les voix utilisées sont celles du téléphone.')),
    errors.length ? section('Journal technique', h('ul', { class: 'note' }, errors.slice(-8).reverse().map(e => h('li', null, `${new Date(e.t).toLocaleString('fr-FR')} — ${e.where} — ${e.msg}`)))) : null,
  ];
}

function helpTab() {
  return [
    section('La méthode',
      h('p', null, 'EDUCA enseigne la lecture de façon explicite et systématique : le SON de chaque lettre (pas seulement son nom), un son à la fois, des voyelles et consonnes qu\'on peut prolonger vers les sons plus complexes (ou, on, an, oi…), puis la fusion en syllabes, la lecture de mots décodables et de phrases.'),
      h('p', null, 'Chaque leçon va de l\'oreille vers l\'écrit : écouter le son, le reconnaître, lire des syllabes, lire des mots, écrire un mot, lire une phrase. Les révisions reviennent au bon moment (répétition espacée).')),
    section('Pensé pour les enfants dyslexiques',
      h('p', null, 'Police Andika conçue pour les lecteurs débutants (ou OpenDyslexic au choix), espacement élargi, coloration syllabique avec lettres muettes en gris, voix et sous-titres, aucun chronomètre, erreurs corrigées tout de suite et sans reproche, lettres qui se ressemblent travaillées ensemble.')),
    section('L\'Élo bienveillant',
      h('p', null, 'Comme aux échecs, chaque exercice a une force et l\'enfant aussi : réussir un exercice difficile fait davantage progresser. Les exercices sont choisis pour réussir environ 4 fois sur 5.'),
      h('p', null, 'L\'enfant voit son RECORD, calculé avec prudence : il ne baisse jamais. L\'estimation du moment (qui peut varier) n\'est visible qu\'ici. Il n\'y a aucun classement entre enfants.')),
    section('En classe',
      h('p', null, 'Une tablette pour plusieurs enfants : chacun touche son animal. Réglez l\'étape de la classe pour aligner le chemin sur votre progression. Séances conseillées : 10 à 15 minutes. Mode silencieux + sous-titres pour les moments calmes.')),
    section('Les niveaux des grands (CE1 → 3e)',
      h('p', null, 'Après le chemin des sons : comprendre, orthographe, grammaire, conjugaison, vocabulaire, d\'après les programmes officiels en vigueur. Chaque niveau se termine par un contrôle (70 % de réussite), qui se retente à volonté. Dès 10 ans, le contrôle d\'un niveau est proposé d\'abord : un enfant qui sait déjà monte tout de suite.')),
    section('Crédits',
      h('p', null, 'Voix des mots : enregistrements de Poslovitch sur Lingua Libre (Wikimédia France), domaine public (CC0). Polices : Andika (SIL), OpenDyslexic, Nunito (licence OFL). Le jeu ne télécharge rien pendant qu\'on joue : tout est sur l\'appareil.'),
      h('p', null, h('a', { href: 'guide.html', target: '_blank', rel: 'noopener' }, 'Guide de l\'enseignant (imprimable)'), ' · ',
        h('a', { href: 'confidentialite.html', target: '_blank', rel: 'noopener' }, 'Politique de confidentialité'))),
  ];
}

const TABS = [['progres', 'Progrès'], ['classe', 'La classe'], ['reglages', 'Réglages'], ['appareil', 'Appareil'], ['donnees', 'Données'], ['aide', 'Aide']];

/* Tous les enfants de la tablette d'un coup d'œil (imprimable, exportable en tableur). */
function classTab(ctx, openChild) {
  const rows = classRows(ctx.store.profiles(), ctx.cur, ctx.levels);
  const table = h('div', { class: 'table-wrap' }, h('table', { class: 'class-table' },
    h('thead', null, h('tr', null, CLASS_COLUMNS.map(([, label]) => h('th', { scope: 'col' }, label)))),
    h('tbody', null, rows.map(r => h('tr', null, CLASS_COLUMNS.map(([key]) => (key === 'name'
      ? h('td', null, h('button', { type: 'button', class: 'link-btn', onclick: () => openChild(r.id) }, `${r.avatar} ${r.name}`))
      : h('td', null, String(r[key])))))))));
  return [
    section(`La classe (${rows.length} enfants)`, table,
      h('p', { class: 'note' }, 'Force de lecture : le record de l\'enfant (il ne baisse jamais). « À surveiller » : la confusion la plus fréquente, travaillée automatiquement. Touchez un prénom pour voir ses progrès.'),
      h('div', { class: 'row wrap no-print' },
        btn('🖨️ Imprimer', () => print(), 'btn btn-primary btn-sm'),
        btn('📄 Exporter en tableur (CSV)', () => download(`educa-classe-${localDay()}.csv`, toCSV(rows), 'text/csv;charset=utf-8'), 'btn btn-soft btn-sm'))),
  ];
}

export const adult = {
  mount(view, params, ctx) {
    const { store, router } = ctx;
    ctx.voice.stop();
    if (Date.now() > unlockedUntil) { gate(view, ctx); return undefined; }
    if (params.createProfile) { router.go('welcome', { adding: true }, { replace: true }); return undefined; }
    const tab = params.tab || 'progres';
    const children = store.profiles();
    const child = children.find(p => p.id === params.child) || store.active() || children[0];
    const go = patch => router.go('adult', { ...params, ...patch }, { replace: true });
    const shown = children.length > 1 ? TABS : TABS.filter(([id]) => id !== 'classe');
    const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Espace des grands' }, shown.map(([id, label], index) => h('button', {
      type: 'button', role: 'tab', id: `adult-tab-${id}`, 'aria-controls': `adult-panel-${id}`,
      tabindex: tab === id ? '0' : '-1', 'data-autofocus': tab === id || null,
      'aria-selected': tab === id ? 'true' : 'false', onclick: () => go({ tab: id }),
      onkeydown: event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % shown.length;
        if (event.key === 'ArrowLeft') next = (index + shown.length - 1) % shown.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = shown.length - 1;
        if (next !== undefined) { event.preventDefault(); go({ tab: shown[next][0] }); }
      },
    }, label)));
    const who = children.length > 1 && (tab === 'progres' || tab === 'reglages')
      ? h('div', { class: 'row wrap no-print' }, children.map(p => h('button', {
        type: 'button', class: 'btn btn-sm ' + (p.id === child?.id ? 'btn-primary' : 'btn-soft'), onclick: () => go({ child: p.id }),
      }, `${p.avatar} ${p.name || ''}`)))
      : null;
    let body;
    if (tab === 'appareil') body = deviceTab(ctx);
    else if (tab === 'donnees') body = dataTab(ctx);
    else if (tab === 'aide') body = helpTab();
    else if (tab === 'classe') body = classTab(ctx, id => go({ tab: 'progres', child: id }));
    else if (!child) body = [section('Aucun enfant', btn('➕ Ajouter un enfant', () => router.go('welcome', { adding: true }), 'btn btn-primary'))];
    else body = tab === 'reglages' ? settingsTab(child, ctx) : progressTab(child, ctx);
    // Pas encore de code : les élèves qui lisent passent le défi des chiffres — on propose d'en choisir un.
    const pinBanner = store.device().adultPin ? null : section('🔒 Protégez l\'espace des grands',
      h('p', { class: 'note' }, 'Les élèves qui savent lire peuvent passer le petit défi des chiffres. Choisissez un code à 4 chiffres : il sera demandé à chaque entrée.'),
      pinForm(ctx));
    append(view, [
      h('div', { class: 'topbar' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Retour', onclick: () => router.back() }, '←'),
        h('h1', { class: 'title' }, 'Espace des grands')),
      tabs, pinBanner, who,
      h('div', { class: 'stack', role: 'tabpanel', id: `adult-panel-${tab}`, 'aria-labelledby': `adult-tab-${tab}`, tabindex: '0' }, body),
    ]);
    // En quittant l'espace des grands (pas en changeant d'onglet), on reverrouille.
    return () => setTimeout(() => { if (!['adult', 'welcome'].includes(router.current)) lockAdult(); }, 0);
  },
};
