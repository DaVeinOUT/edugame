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
    this.state     = { letters, index: 0, quit: false, strokes: 0 };

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
  _halt() { this.state.quit = true; Voice.stop(); }

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

  nextLetter() {
    if (this.state.quit) return;
    Sfx.correct();
    Voice.speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    this.state.index++;
    this._next();
  }

  _end() {
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
