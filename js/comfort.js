/* ============================================================
   COMFORT.JS — Réglages confort (dyslexie & handicap)
   Chaque réglage est indépendant, persistant, et parlant :
   l'enfant ou l'adulte entend ce qu'il vient de changer.

   Réglages :
   - dyslexicFont  : police OpenDyslexic (b/d, p/q, n/u distincts)
   - wideSpacing   : lettres et mots plus espacés
   - softBg        : fond crème doux au lieu du fond nuit
   - slowVoice     : voix plus lente
   - noTimer       : le chrono disparaît (le stress n'apprend rien)
   ============================================================ */

const Comfort = {
  /* Définition unique de chaque réglage : clé, classe <body>, libellé,
     version courte pour la voix. */
  SETTINGS: {
    dyslexicFont: { cls:'comfort-dyslexic-font', label:'Lettres spéciales',      say:'Les lettres ont des formes plus faciles à reconnaître.' },
    wideSpacing:  { cls:'comfort-wide-spacing',  label:'Lettres espacées',       say:'Les lettres sont plus espacées, c\'est plus facile à lire.' },
    softBg:       { cls:'comfort-soft-bg',       label:'Fond doux',              say:'Le fond devient doux pour les yeux.' },
    slowVoice:    { cls:null,                    label:'Voix lente',             say:'Je parle plus doucement.' },
    noTimer:      { cls:null,                    label:'Pas de chrono',          say:'Plus de minuteur. Tu as tout ton temps.' },
  },

  _state: null,

  _load() {
    try { return JSON.parse(localStorage.getItem('educaComfort')) || {}; }
    catch { return {}; }
  },
  _save() { localStorage.setItem('educaComfort', JSON.stringify(this._state)); },

  init() {
    this._state = this._load();
    Object.entries(this.SETTINGS).forEach(([key, def]) => {
      if (this._state[key] && def.cls) document.body.classList.add(def.cls);
    });
  },

  isOn(key) { return !!this._state[key]; },

  /* Vitesse de voix effective : le réglage « voix lente » assagit la base. */
  voiceRate() { return this.isOn('slowVoice') ? 0.75 : 0.9; },

  /* Le chrono existe-t-il pour une difficulté donnée ? */
  timerEnabled(cfg) { return !!cfg.timer && !this.isOn('noTimer'); },

  toggle(key) {
    this._state[key] = !this._state[key];
    const def = this.SETTINGS[key];
    if (!def) return;
    if (def.cls) document.body.classList.toggle(def.cls, this._state[key]);
    this._save();
    Sfx.tap();
    const onOff = this._state[key] ? 'activé' : 'désactivé';
    Voice.speak(`${def.label} ${onOff}. ${this._state[key] ? def.say : ''}`);
    this._renderButtons();
  },

  /* Boutons du panneau (écran Stats) — rendu et état à jour. */
  _renderButtons() {
    const grid = document.getElementById('comfortGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(this.SETTINGS).forEach(([key, def]) => {
      const b = document.createElement('button');
      b.type = 'button';
      const active = this.isOn(key);
      b.className = 'comfort-toggle' + (active ? ' active' : '');
      b.innerHTML = `<span>${def.label}</span><span class="comfort-state">${active ? 'ON' : 'off'}</span>`;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.onclick = () => this.toggle(key);
      grid.appendChild(b);
    });
  },

  /* Appelé à chaque affichage de l'écran Stats. */
  renderPanel() { this._renderButtons(); },
};

document.addEventListener('DOMContentLoaded', () => Comfort.init());
