/* ============================================================
   BUILDER.JS — Mini-jeu : Le Constructeur
   Pas de clavier : un enfant qui ne sait pas encore lire ne peut
   pas taper sur un clavier AZERTY. Il construit le mot en tapant
   sur des tuiles-lettres, dans l'ordre. Le mot est prononcé,
   et chaque mot a son image.
   ============================================================ */

const BUILDER_WORDS = [
  { w:'maman',   e:'👩' }, { w:'papa',    e:'👨' }, { w:'eau',     e:'💧' },
  { w:'feu',     e:'🔥' }, { w:'vent',    e:'💨' }, { w:'bleu',    e:'🔵' },
  { w:'lac',     e:'🏞️' }, { w:'mer',     e:'🌊' }, { w:'île',     e:'🏝️' },
  { w:'ami',     e:'😊' }, { w:'chat',    e:'🐱' }, { w:'lune',    e:'🌙' },
  { w:'rose',    e:'🌹' }, { w:'arbre',   e:'🌳' }, { w:'soleil',  e:'☀️' },
  { w:'étoile',  e:'⭐' }, { w:'jardin',  e:'🌷' }, { w:'rivière', e:'💦' },
  { w:'forêt',   e:'🌲' }, { w:'nuage',   e:'☁️' },
];

const BLOCK_COLORS = ['#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2'];
const TILE_DECOYS  = 2;   // lettres pièges ajoutées au tas de tuiles

class BuilderGame {
  constructor() { this.state = {}; }

  start() {
    const words = [...BUILDER_WORDS].sort(() => Math.random() - 0.5).slice(0, 10);
    this.state = { words, index:0, score:0, placed:0, pos:0, locked:false };

    document.getElementById('builderWorld').innerHTML = '';
    document.getElementById('builderScore').textContent = '0 pts';
    document.getElementById('builderFeedback').className = 'feedback-toast hidden';

    educa.show('screenBuilder');
    Voice.speak('Le Constructeur ! Tape sur les lettres dans le bon ordre pour construire le mot.');
    this._nextWord();
  }

  _current() { return this.state.words[this.state.index]; }

  /* Quitter proprement : stoppe voix et enchaînements */
  quit() {
    this.state.quit = true;
    Voice.stop();
    educa.showHub();
  }

  _nextWord() {
    if (this.state.quit) return;
    if (this.state.index >= this.state.words.length) { this._end(); return; }
    const { w, e } = this._current();
    this.state.pos    = 0;
    this.state.locked = false;
    document.getElementById('builderWordDisplay').innerHTML =
      `<span class="hint-emoji">${e}</span>${w}`;
    this._renderSlots(w);
    this._renderBank(w);
    document.getElementById('builderProgressText').textContent =
      `${this.state.placed}/10`;
    document.getElementById('builderProgressFill').style.width =
      (this.state.placed / 10 * 100) + '%';
    document.getElementById('builderScore').textContent = this.state.score + ' pts';
    setTimeout(() => this.replayWord(), 600);
  }

  /* Le mot parle quand on le touche */
  replayWord() {
    const cur = this._current();
    if (cur) Voice.speak(cur.w);
  }

  _renderSlots(word) {
    const slots = document.getElementById('builderSlots');
    slots.innerHTML = '';
    word.split('').forEach(() => {
      const s = document.createElement('div');
      s.className = 'slot';
      slots.appendChild(s);
    });
  }

  _renderBank(word) {
    const letters = word.split('');
    const pool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => !letters.includes(l));
    for (let i = 0; i < TILE_DECOYS; i++) {
      letters.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    const bank = document.getElementById('builderBank');
    bank.innerHTML = '';
    letters
      .map(l => ({ l, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .forEach(({ l }) => {
        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'tile';
        t.textContent = l;
        t.onclick = () => this._tapTile(t, l);
        bank.appendChild(t);
      });
  }

  _tapTile(tile, letter) {
    if (this.state.locked || tile.classList.contains('used')) return;
    const word = this._current().w;
    if (letter === word[this.state.pos]) {
      tile.classList.add('used');
      tile.disabled = true;
      const slot = document.querySelectorAll('#builderSlots .slot')[this.state.pos];
      slot.textContent = letter;
      slot.classList.add('filled');
      this.state.pos++;
      Sfx.tap();
      if (this.state.pos >= word.length) this._wordComplete();
    } else {
      Sfx.wrong();
      tile.classList.add('shake');
      setTimeout(() => tile.classList.remove('shake'), 400);
    }
  }

  _wordComplete() {
    this.state.locked = true;
    this.state.score += 15;
    this.state.placed++;
    this.state.index++;
    document.getElementById('builderScore').textContent = this.state.score + ' pts';
    const { w } = this.state.words[this.state.index - 1];
    this._addBlock(w);
    Sfx.correct();
    Voice.speak(`${w} ! Bravo !`);
    const fb = document.getElementById('builderFeedback');
    fb.textContent = 'Parfait !';
    fb.className   = 'feedback-toast success';
    setTimeout(() => {
      fb.className = 'feedback-toast hidden';
      this._nextWord();
    }, 1100);
  }

  _addBlock(word) {
    const world = document.getElementById('builderWorld');
    const block = document.createElement('div');
    const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    block.className        = 'world-block';
    block.style.background = color;
    block.style.color      = 'white';
    block.textContent      = word;
    world.appendChild(block);
  }

  _end() {
    const accuracy = (this.state.placed / this.state.words.length) * 100;
    educa.addXP(Math.round(this.state.score / 3));
    educa.show('screenResults');

    const name = educa.profile?.name || 'Champion';
    document.getElementById('resultTitle').textContent   = `Bravo, ${name} !`;
    document.getElementById('resFinalScore').textContent = this.state.score;
    document.getElementById('resCorrect').textContent    = `${this.state.placed}/10`;
    document.getElementById('resTotalTime').textContent  = '—';
    document.getElementById('reviewBtn').style.display   = 'none';

    const stars  = document.querySelectorAll('.results-star');
    const earned = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
    stars.forEach((s,i) => s.classList.toggle('earned', i < earned));

    Sfx.star();
    Voice.speak(`Bravo, ${name} ! Tu as construit ${this.state.placed} mots !`);

    const flags = { builderComplete: this.state.placed === 10, sessionComplete: true };
    // Les lettres des mots construits (sans accents) peuvent devenir des cartes
    const lettersUsed = [...new Set(
      this.state.words.map(x => x.w).join('')
        .normalize('NFD')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .split('')
    )];
    setTimeout(() => educa.triggerCard(accuracy, flags, lettersUsed), 2200);
  }
}

let builderGame;
