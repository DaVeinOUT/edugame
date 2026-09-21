/* ============================================================
   TRACE.JS — Écris la lettre au doigt
   Approche multisensorielle validée pour la dyslexie : l'enfant
   TRACE la lettre (mouvement + toucher) en entendant son son
   (voix) — l'équivalent numérique de la lettre en relief.

   Zéro jugement : ce n'est pas un test. Kaya nomme la lettre,
   l'enfant la trace sur le fantôme géant, et chaque coup de
   doigt est encouragé.
   ============================================================ */

const TRACE_COLORS = ['#F59E0B', '#7C3AED', '#10B981', '#0891B2', '#DC2626', '#2563EB'];

class TraceGame {
  constructor() { this.state = {}; this._drawing = false; }

  start() {
    const palier   = educa?.getPalier?.() || 1;
    const pool     = palier === 1 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                                  : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const letters  = fisherYates(pool.split('')).slice(0, 10);
    this.state     = { letters, index: 0, quit: false, strokes: 0, startedAt: Date.now() };
    this._partialCounted = false;

    document.getElementById('traceProgress').textContent = '1/10';
    educa.show('screenTrace');
    Voice.speak('Écris la lettre avec ton doigt ! Suis le modèle.');
    this._next();
  }

  quit() {
    this.state.quit = true;
    Voice.stop();
    educa.showHub();
  }
  _halt() {
    this.state.quit = true;
    // Chaque lettre réellement tracée avant l'abandon compte
    if (!this._partialCounted && this.state.index > 0) {
      this._partialCounted = true;
      educa?.recordActivity({ items: this.state.index,
        seconds: Math.round((Date.now() - (this.state.startedAt || Date.now())) / 1000) });
    }
    Voice.stop();
  }

  _current() { return this.state.letters[this.state.index]; }

  _next() {
    if (this.state.quit) return;
    if (this.state.index >= this.state.letters.length) { this._end(); return; }
    const letter = this._current();
    this.state.strokes = 0;
    document.getElementById('traceProgress').textContent =
      `${this.state.index + 1}/${this.state.letters.length}`;
    const fill = document.getElementById('traceFill');
    if (fill) fill.style.width = (this.state.index / this.state.letters.length * 100) + '%';
    this._setup(letter);
    // Kaya dit la lettre pendant qu'elle apparaît
    const assoc = (typeof LETTER_ASSOC !== 'undefined') ? LETTER_ASSOC[letter.toUpperCase()] : null;
    Voice.speak(assoc ? `${letter.toUpperCase()} ! Comme ${assoc.word}.` : `${letter.toUpperCase()} !`);
  }

  _setup(letter) {
    const ghost  = document.getElementById('traceGhost');
    const canvas = document.getElementById('traceCanvas');
    ghost.textContent = letter;
    // Le fantôme suit le réglage police adaptée si actif
    ghost.style.fontFamily = document.body.classList.contains('comfort-dyslexic-font')
      ? "'OpenDyslexic','Nunito',sans-serif" : "'Nunito',sans-serif";
    // Écrans denses : le canvas physique suit le devicePixelRatio,
    // sinon le trait est flou sur les bons téléphones.
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== 440 * dpr) {
      canvas.width  = 440 * dpr;
      canvas.height = 440 * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 440, 440);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this._ctx = ctx;
    this._colorIdx = 0;
  }

  _pos(e) {
    // Coordonnées dans le repère logique 440×440 (le CSS peut réduire
    // l'affichage) ; le dpr est géré par setTransform dans _setup.
    const canvas = document.getElementById('traceCanvas');
    const r = canvas.getBoundingClientRect();
    const sx = 440 / r.width;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sx };
  }

  /* Branché une fois au DOMContentLoaded */
  init() {
    const canvas = document.getElementById('traceCanvas');
    if (!canvas) return;
    const begin = e => {
      if (this.state.quit) return;
      this._drawing = true;
      const { x, y } = this._pos(e);
      this._ctx.beginPath();
      this._ctx.moveTo(x, y);
      this._ctx.strokeStyle = TRACE_COLORS[this._colorIdx % TRACE_COLORS.length];
      this._ctx.lineWidth = 18;
      e.preventDefault();
    };
    const move = e => {
      if (!this._drawing) return;
      const { x, y } = this._pos(e);
      this._ctx.lineTo(x, y);
      this._ctx.stroke();
      e.preventDefault();
    };
    const end = () => {
      if (!this._drawing) return;
      this._drawing = false;
      this.state.strokes++;
      // Chaque coup de doigt = un encouragement discret + changement de couleur
      this._colorIdx++;
      if (this.state.strokes % 3 === 0) Sfx.tap();
    };
    canvas.addEventListener('pointerdown', begin);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  clearCanvas() {
    this._setup(this._current());
    Sfx.tap();
  }

  replay() {
    const letter = this._current();
    const assoc = (typeof LETTER_ASSOC !== 'undefined') ? LETTER_ASSOC[letter.toUpperCase()] : null;
    Voice.speak(assoc ? `${letter.toUpperCase()} ! Comme ${assoc.word}.` : `${letter.toUpperCase()} !`);
  }

  /* Validation réelle du tracé : on compte les pixels dessinés, le
   bouton « C'est fait ! » ne valide que si l'enfant a vraiment tracé.
   Tolérance très généreuse — c'est un jeu, pas un examen. */
  _pixelCount() {
    if (!this._ctx) return 0;
    // Dimensions PHYSIQUES du canvas (× dpr) : setTransform ne change
    // pas les coordonnées lues par getImageData.
    const c = document.getElementById('traceCanvas');
    const data = this._ctx.getImageData(0, 0, c.width, c.height).data;
    const dpr = window.devicePixelRatio || 1;
    let n = 0;
    for (let i = 3; i < data.length; i += 64) {   // échantillonnage léger
      if (data[i] > 0) n++;
    }
    return n / (dpr * dpr);   // ramené au repère 440×440
  }

  nextLetter() {
    if (this.state.quit) return;
    const drawn = this._pixelCount();
    if (drawn < 60) {   // presque rien tracé : on encourage à essayer
      Voice.speak('Essaie de tracer la lettre avec ton doigt d\'abord ! Le grand dessin t\'aide.');
      Sfx.tap();
      return;
    }
    Sfx.correct();
    Voice.speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    this.state.index++;
    this._next();
  }

  _end() {
    // Même compteur global que les autres jeux
    if (!this._partialCounted) {
      this._partialCounted = true;
      educa.recordActivity({ items: this.state.letters.length,
        seconds: Math.round((Date.now() - (this.state.startedAt || Date.now())) / 1000),
        completed: true });
    }
    educa.show('screenResults');
    const name = educa.profile?.name || 'Champion';
    document.getElementById('resultTitle').textContent = `Bravo, ${name} !`;
    document.getElementById('resFinalScore').textContent = '✍️';
    document.getElementById('resCorrect').textContent    = `${this.state.letters.length} lettres`;
    document.getElementById('resTotalTime').textContent  = '—';
    document.getElementById('reviewBtn').style.display   = 'none';
    document.getElementById('levelUpBtn').style.display  = 'none';
    document.querySelectorAll('.results-star').forEach(s => s.classList.add('earned'));
    Sfx.star();
    Voice.speak(`Bravo ${name} ! Tu as écrit ${this.state.letters.length} lettres avec ton doigt !`);
  }
}

let traceGame;
document.addEventListener('DOMContentLoaded', () => {
  traceGame = new TraceGame();
  traceGame.init();
});
