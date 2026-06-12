/* ============================================================
   CARD3D.JS — La carte vivante
   La carte de récompense suit le doigt (ou le gyroscope du
   téléphone) et son reflet holographique glisse dessus, comme
   une vraie carte brillante qu'on incline sous la lumière.
   Pur CSS transforms — aucune librairie, fluide même sur
   les téléphones modestes.
   ============================================================ */

const Card3D = {
  _wrap: null,
  _overlay: null,

  init() {
    this._wrap    = document.querySelector('.card-wrap');
    this._overlay = document.getElementById('cardOverlay');
    if (!this._wrap || !this._overlay) return;

    // Le doigt / la souris incline la carte (zone = tout l'overlay,
    // plus facile pour de petites mains)
    this._overlay.addEventListener('pointermove', e => {
      if (this._overlay.classList.contains('hidden')) return;
      const r = this._wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top)  / r.height;
      this._apply(x, y);
    });
    this._overlay.addEventListener('pointerleave', () => this.rest());

    // Sur téléphone, incliner l'appareil incline la carte (gyroscope)
    window.addEventListener('deviceorientation', e => {
      if (this._overlay.classList.contains('hidden')) return;
      if (e.gamma == null || e.beta == null) return;
      const x = (e.gamma + 35) / 70;   // gauche / droite
      const y = (e.beta  - 15) / 55;   // avant / arrière
      this._apply(x, y);
    });
  },

  _clamp(v) { return Math.min(1.15, Math.max(-0.15, v)); },

  _apply(x, y) {
    x = this._clamp(x);
    y = this._clamp(y);
    const w = this._wrap;
    w.classList.remove('idle');   // la main prend le relais du flottement
    w.style.setProperty('--rx',   ((0.5 - y) * 22).toFixed(2) + 'deg');
    w.style.setProperty('--ryw',  ((x - 0.5) * 26).toFixed(2) + 'deg');
    w.style.setProperty('--px',   (x * 100).toFixed(1) + '%');
    w.style.setProperty('--py',   (y * 100).toFixed(1) + '%');
    w.style.setProperty('--posx', ((1 - x) * 100).toFixed(1) + '%');
    w.style.setProperty('--posy', ((1 - y) * 100).toFixed(1) + '%');
  },

  /* Recentre la carte et relance le flottement */
  rest() {
    const w = this._wrap;
    if (!w) return;
    ['--rx','--ryw','--px','--py','--posx','--posy'].forEach(p => w.style.removeProperty(p));
    w.classList.add('idle');
  },

  /* Appelé à chaque ouverture de l'overlay */
  fresh() {
    this.rest();
    this._wrap?.classList.remove('revealed');
  },

  /* Appelé quand la carte est retournée */
  reveal() {
    this._wrap?.classList.add('revealed');
  },
};

document.addEventListener('DOMContentLoaded', () => Card3D.init());
