/* ============================================================
   LETTERS.JS — Mini-jeu : Reconnais les lettres
   Pensé pour les enfants qui ne savent pas encore lire :
   chaque lettre est prononcée, chaque mot a son image,
   et la bonne réponse est toujours montrée et expliquée.
   ============================================================ */

/* Chaque mot COMMENCE par sa lettre (phonétique française correcte)
   et possède une image-emoji lisible sans savoir lire. */
const LETTER_ASSOC = {
  A:{word:'Avion',     emoji:'✈️'},  B:{word:'Ballon',    emoji:'🎈'},
  C:{word:'Chat',      emoji:'🐱'},  D:{word:'Dinosaure', emoji:'🦖'},
  E:{word:'Éléphant',  emoji:'🐘'},  F:{word:'Fleur',     emoji:'🌸'},
  G:{word:'Girafe',    emoji:'🦒'},  H:{word:'Hibou',     emoji:'🦉'},
  I:{word:'Île',       emoji:'🏝️'},  J:{word:'Jungle',    emoji:'🌴'},
  K:{word:'Koala',     emoji:'🐨'},  L:{word:'Lion',      emoji:'🦁'},
  M:{word:'Maison',    emoji:'🏠'},  N:{word:'Nuage',     emoji:'☁️'},
  O:{word:'Ours',      emoji:'🐻'},  P:{word:'Perroquet', emoji:'🦜'},
  Q:{word:'Quille',    emoji:'🎳'},  R:{word:'Robot',     emoji:'🤖'},
  S:{word:'Soleil',    emoji:'☀️'},  T:{word:'Tortue',    emoji:'🐢'},
  U:{word:'Univers',   emoji:'🌌'},  V:{word:'Vélo',      emoji:'🚲'},
  W:{word:'Wagon',     emoji:'🚃'},  X:{word:'Xylophone', emoji:'🎶'},
  Y:{word:'Yeux',      emoji:'👀'},  Z:{word:'Zèbre',     emoji:'🦓'},
};

/* hideTarget : la lettre est cachée, l'enfant doit la reconnaître
   À L'OREILLE — c'est la vraie compétence de lecture. */
const DIFFICULTIES = {
  easy:   { name:'Explorateur', letters:'uppercase', timer:false, options:3, hideTarget:false },
  medium: { name:'Aventurier',  letters:'lowercase', timer:false, options:3, hideTarget:false },
  hard:   { name:'Expert',      letters:'mixed',     timer:true,  timeLimit:15, options:4, hideTarget:true },
  master: { name:'Maitre',      letters:'order',     timer:true,  timeLimit:10, options:4, hideTarget:true },
};

const PRAISE = ['Bravo !', 'Super !', 'Parfait !', 'Génial !', 'Champion !'];

/* Confusions visuelles classiques des 4-6 ans : si l'enfant se trompe
   entre deux lettres d'une même paire, on le détecte et on propose
   un exercice ciblé (jamais une sanction). */
const CONFUSION_PAIRS = {
  B:'D', D:'B', P:'Q', Q:'P', I:'J', J:'I', M:'N', N:'M',
};

/* Le Constructeur aussi en profite : Fisher-Yates est partagé. */
function fisherYates(arr) {
  const a = [...arr];
  const rand = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
    : Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class LettersGame {
  constructor() {
    this.state  = {};
    this._timer = null;
    this._speakTimer = null;
    this._lastMistakes = [];
    this.stats  = this._loadStats();
    this._loadMute();
  }

  showDifficulty() { educa.showDifficulty(); }

  /* Délégation d'événements : un seul écouteur sur la grille d'options,
     posé une fois à l'init — plus robuste que des onclick par bouton
     sur les petits téléphones. */
  _bindDelegation() {
    if (this._delegated) return;
    this._delegated = true;
    document.getElementById('optionsGrid').addEventListener('click', e => {
      const btn = e.target.closest('.option-btn');
      if (!btn || btn.disabled || this.state.answered) return;
      const letter = this.state.letters?.[this.state.index];
      if (letter) this._answer(btn.textContent, letter);
    });
  }

  /* ---------- INIT ---------- */
  start(difficulty, customLetters = null) {
    const cfg = DIFFICULTIES[difficulty];
    let letters = customLetters ? [...customLetters] : this._buildLetters(cfg);
    // Le mode Maître suit le vrai ordre alphabétique ; les autres mélangent
    if (cfg.letters !== 'order' || customLetters) letters = fisherYates(letters);

    this.state = {
      difficulty, letters,
      index: 0, score: 0, correct: 0,
      mistakes: [], correctLetters: [],
      streak: 0, bestStreak: 0,
      isReview: !!customLetters,
      answered: false,
      startTime: Date.now(),
      timeLeft: cfg.timeLimit || 0,
    };

    document.getElementById('gameTitle').textContent =
      this.state.isReview ? 'Révision' : cfg.name;
    document.getElementById('gameScore').textContent = '0 pts';
    document.getElementById('timerBadge').style.display = cfg.timer ? '' : 'none';
    const label = cfg.hideTarget ? 'Trouve la lettre que tu entends' : 'Trouve la même lettre';
    document.getElementById('targetLabel').textContent = label;

    educa.show('screenGame');
    this._bindDelegation();
    Voice.speak(this.state.isReview ? 'On révise tes lettres ! Tu vas y arriver !' : label);
    this._next();
  }

  /* Rejoue les lettres ratées à la dernière partie.
     S'il y a eu des confusions visuelles (b/d, p/q…), la révision
     porte sur les DEUX lettres de chaque paire : c'est la distinction
     qui est difficile, pas une lettre isolée.
     La casse suit la difficulté : en mode Aventurier (minuscules),
     on révise des minuscules — les paires sont stockées en majuscules. */
  startReview() {
    if (!this._lastMistakes.length) return;
    let letters = [...this._lastMistakes];
    (this.state.confusions || []).forEach(pair => {
      pair.split('/').forEach(l => { if (!letters.includes(l)) letters.push(l); });
    });
    const cfg = DIFFICULTIES[this.state.difficulty];
    if (cfg.letters === 'lowercase') letters = letters.map(l => l.toLowerCase());
    this.start(this.state.difficulty, letters);
  }

  _buildLetters(cfg) {
    const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const LO = 'abcdefghijklmnopqrstuvwxyz'.split('');
    if (cfg.letters === 'uppercase') return UP;
    if (cfg.letters === 'lowercase') return LO;
    if (cfg.letters === 'mixed')     return [...UP, ...LO];
    if (cfg.letters === 'order')     return UP;
    return UP;
  }

  /* Quitter proprement : stoppe chrono, voix, enchaînements et particules */
  quit() {
    this._halt();
    educa.showHub();
  }

  /* Arrête tout SANS naviguer — utilisé quand le bouton « retour » du
     téléphone pilote déjà la navigation via l'historique. */
  _halt() {
    this.state.quit = true;
    this._stopTimer();
    clearTimeout(this._speakTimer);
    (this._particleTimers || []).forEach(t => clearTimeout(t));
    this._particleTimers = [];
    Voice.stop();
  }

  /* ---------- QUESTION ---------- */
  _next() {
    if (this.state.quit) return;
    if (this.state.index >= this.state.letters.length) { this._end(); return; }
    const letter = this.state.letters[this.state.index];
    this._render(letter);
    this._updateProgress();
    if (DIFFICULTIES[this.state.difficulty].timer) this._startTimer();
  }

  _render(letter) {
    const cfg    = DIFFICULTIES[this.state.difficulty];
    const assoc  = LETTER_ASSOC[letter.toUpperCase()];
    const target = document.getElementById('targetLetter');
    // En mode audio la lettre est cachée : l'enfant écoute, le 🔊 invite à rejouer le son
    target.textContent = cfg.hideTarget ? '🔊' : letter;
    target.classList.toggle('audio-mode', !!cfg.hideTarget);
    // L'indice-image ne montre jamais la lettre en mode audio (sinon c'est triché)
    document.getElementById('wordHint').innerHTML = cfg.hideTarget
      ? `<span class="hint-emoji">${assoc.emoji}</span>`
      : `<span class="hint-emoji">${assoc.emoji}</span>${letter.toUpperCase()} comme ${assoc.word}`;
    this.state.answered = false;
    this._renderOptions(letter);
    this._clearFeedback();
    // La toute première lettre attend la fin de la consigne parlée
    this._speakLetter(letter, this.state.index === 0);
  }

  _renderOptions(correct) {
    const cfg  = DIFFICULTIES[this.state.difficulty];
    const pool = this._getPool();
    const wrong = fisherYates(pool.filter(l => l !== correct)).slice(0, cfg.options - 1);
    const opts  = fisherYates([correct, ...wrong]);

    const container = document.getElementById('optionsGrid');
    container.innerHTML = '';
    opts.forEach(letter => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className  = 'option-btn';
      btn.textContent = letter;
      // Le clic est géré par délégation sur #optionsGrid (_bindDelegation)
      container.appendChild(btn);
    });
  }

  _getPool() {
    const cfg = DIFFICULTIES[this.state.difficulty];
    const UP  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const LO  = 'abcdefghijklmnopqrstuvwxyz'.split('');
    if (cfg.letters === 'uppercase' || cfg.letters === 'order') return UP;
    if (cfg.letters === 'lowercase') return LO;
    return [...UP, ...LO];
  }

  /* ---------- ANSWER ---------- */
  _answer(selected, correct) {
    if (this.state.answered) return;   // verrou anti double-clic
    this.state.answered = true;
    this._stopTimer();
    clearTimeout(this._speakTimer);

    const isCorrect = selected === correct;
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === selected) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      // La bonne réponse s'illumine toujours : l'enfant apprend, même en se trompant
      if (!isCorrect && btn.textContent === correct) btn.classList.add('reveal');
    });

    // Révèle la lettre cible (essentiel en mode audio)
    const targetEl = document.getElementById('targetLetter');
    targetEl.textContent = correct;
    targetEl.classList.remove('audio-mode');

    const word = LETTER_ASSOC[correct.toUpperCase()].word;
    const tgt  = correct.toUpperCase();
    if (isCorrect) {
      this.state.correct++;
      this.state.correctLetters.push(tgt);
      this.state.streak++;
      this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
      this.state.score += this._scoreFor();
      const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      Sfx.correct();
      Voice.speak(praise);
      this._showFeedback(praise, 'success');
      this._particles();
    } else {
      this.state.streak = 0;
      this.state.mistakes.push({ letter: correct, selected });
      // Confusion visuelle classique (b/d, p/q, i/j, m/n) : message ciblé
      // + mémorisée pour la révision et les stats parents.
      const sel = (selected || '').toUpperCase();
      const isConfusion = CONFUSION_PAIRS[tgt] === sel;
      if (isConfusion) {
        this.state.confusions = this.state.confusions || [];
        this.state.confusions.push(`${tgt}/${sel}`);
        this._recordConfusion(tgt, sel);
      }
      Sfx.wrong();
      const msg = isConfusion
        ? `Presque ! ${tgt} et ${sel} se ressemblent beaucoup. Regarde bien : c'était ${tgt}, comme ${word}.`
        : `Presque ! La bonne réponse, c'était ${tgt}, comme ${word}.`;
      Voice.speak(msg);
      this._showFeedback(`C'était ${correct}`, 'error', 2400);
    }
    this._recordLetter(tgt, isCorrect);
    document.getElementById('gameScore').textContent = this.state.score + ' pts';
    setTimeout(() => { this.state.index++; this._next(); }, isCorrect ? 1200 : 2400);
  }

  _scoreFor() {
    const base = { easy:10, medium:15, hard:20, master:30 }[this.state.difficulty] || 10;
    const cfg  = DIFFICULTIES[this.state.difficulty];
    const timeBonus = cfg.timer && this.state.timeLeft > cfg.timeLimit / 2 ? 1.5 : 1;
    return Math.round(base * timeBonus);
  }

  /* ---------- TIMER ---------- */
  _startTimer() {
    const cfg = DIFFICULTIES[this.state.difficulty];
    this.state.timeLeft = cfg.timeLimit;
    this._updateTimer();
    this._timer = setInterval(() => {
      this.state.timeLeft--;
      this._updateTimer();
      if (this.state.timeLeft <= 0) this._timeout();
    }, 1000);
  }
  _stopTimer()  { clearInterval(this._timer); this._timer = null; }
  _updateTimer() {
    const el = document.getElementById('timerBadge');
    el.textContent = `⏱ ${this.state.timeLeft}s`;
    el.classList.toggle('urgent', this.state.timeLeft <= 5);
  }
  _timeout() {
    if (this.state.answered) return;
    this.state.answered = true;
    this._stopTimer();
    const letter = this.state.letters[this.state.index];
    this.state.mistakes.push({ letter, selected:'TIMEOUT' });
    this.state.streak = 0;
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === letter) btn.classList.add('reveal');
    });
    const targetEl = document.getElementById('targetLetter');
    targetEl.textContent = letter;
    targetEl.classList.remove('audio-mode');
    Sfx.wrong();
    Voice.speak(`Le temps est écoulé ! C'était ${letter.toUpperCase()}, comme ${LETTER_ASSOC[letter.toUpperCase()].word}.`);
    this._showFeedback('⌛ Temps écoulé !', 'error', 2200);
    setTimeout(() => { this.state.index++; this._next(); }, 2400);
  }

  /* ---------- END ---------- */
  _end() {
    this._stopTimer();
    const totalTime = Math.round((Date.now() - this.state.startTime) / 1000);
    const total     = this.state.letters.length;
    const accuracy  = (this.state.correct / total) * 100;
    // Exploits réellement accomplis → cartes méritées
    const flags = {
      firstGame:       this.stats.gamesPlayed === 0,
      sessionComplete: true,
      streak5:         this.state.bestStreak >= 5,
      perfect:         accuracy === 100,
      fast:            totalTime < 60 && accuracy >= 70,
      alphabetMaster:  this.state.difficulty === 'master' && !this.state.isReview && accuracy === 100,
      retry:           this.state.isReview,
    };
    this._lastMistakes = [...new Set(this.state.mistakes.map(m => m.letter))];
    this._updateStats();
    this._renderResults(accuracy, totalTime);
    educa.show('screenResults');
    educa.addXP(Math.round(this.state.score / 5));
    setTimeout(() => educa.triggerCard(accuracy, flags, this.state.correctLetters), 2200);
  }

  _renderResults(accuracy, totalTime) {
    const name = educa.profile?.name || 'Champion';
    document.getElementById('resultTitle').textContent =
      accuracy === 100 ? `Parfait, ${name} !` : `Bravo, ${name} !`;
    document.getElementById('resFinalScore').textContent = this.state.score;
    document.getElementById('resCorrect').textContent    =
      `${this.state.correct}/${this.state.letters.length}`;
    document.getElementById('resTotalTime').textContent  = `${totalTime}s`;
    const stars  = document.querySelectorAll('.results-star');
    const earned = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
    stars.forEach((s,i) => s.classList.toggle('earned', i < earned));

    // Propose de revoir les lettres ratées
    const reviewBtn = document.getElementById('reviewBtn');
    const n = this._lastMistakes.length;
    reviewBtn.style.display = n ? '' : 'none';
    reviewBtn.textContent = n === 1 ? '🔁 Revoir mon erreur' : `🔁 Revoir mes ${n} erreurs`;

    Sfx.star();
    Voice.speak(`Bravo, ${name} ! ${this.state.correct} bonnes réponses sur ${this.state.letters.length} !`);

    // Message contextuel : la POSITION des erreurs compte.
    // Rater en fin de partie ≠ erreurs dispersées — la fatigue se nomme,
    // une difficulté précise se cible. Jamais de reproche.
    if (n) {
      const wrongIdx = this.state.letters
        .map((l, i) => this.state.mistakes.some(m => m.letter === l) ? i : -1)
        .filter(i => i >= 0);
      const lateErrors = wrongIdx.length && wrongIdx.every(i => i >= this.state.letters.length * 0.6);
      const nConfusions = (this.state.confusions || []).length;
      if (lateErrors && this.state.correct >= this.state.letters.length * 0.6) {
        Voice.speak('Tu as été très fort au début ! Les dernières étaient fatigantes. On les revoit ensemble ?', { interrupt:false });
      } else if (nConfusions) {
        Voice.speak('Certaines lettres se ressemblent et te jouent des tours. Un petit entraînement spécial ?', { interrupt:false });
      } else {
        Voice.speak('Tu veux revoir tes erreurs ? Appuie sur le bouton orange.', { interrupt:false });
      }
    }
  }

  /* ---------- PROGRESS ---------- */
  _updateProgress() {
    const cur = this.state.index;
    const tot = this.state.letters.length;
    document.getElementById('progressText').textContent = `${cur}/${tot}`;
    document.getElementById('progressFill').style.width = (cur / tot * 100) + '%';
  }

  /* ---------- FEEDBACK ---------- */
  _showFeedback(msg, type, duration = 1100) {
    const el = document.getElementById('feedbackToast');
    el.textContent = msg;
    el.className   = `feedback-toast ${type}`;
    clearTimeout(this._fbTimer);
    this._fbTimer = setTimeout(() => el.className = 'feedback-toast hidden', duration);
  }
  _clearFeedback() {
    document.getElementById('feedbackToast').className = 'feedback-toast hidden';
  }

  /* ---------- VOIX ---------- */
  /* Rejoue la lettre en cours (bouton 🔊 et lettre cliquable) */
  replay() {
    const letter = this.state.letters?.[this.state.index];
    if (letter && !this.state.answered) this._speakLetter(letter);
  }

  _speakLetter(letter, afterIntro = false) {
    clearTimeout(this._speakTimer);
    this._speakTimer = setTimeout(() => {
      const assoc = LETTER_ASSOC[letter.toUpperCase()];
      Voice.speak(`${letter.toUpperCase()} ! ${letter.toUpperCase()}, comme ${assoc.word}.`,
                  { interrupt: !afterIntro });
    }, afterIntro ? 400 : 250);
  }

  /* ---------- PARTICLES ---------- */
  /* Les timers sont enregistrés pour être annulés dans quit() —
     sinon ils continuaient à créer des éléments après la sortie. */
  _particles() {
    const zone = document.getElementById('screenGame');
    this._particleTimers = this._particleTimers || [];
    for (let i = 0; i < 4; i++) {
      const t = setTimeout(() => {
        if (this.state.quit) return;
        const p = document.createElement('span');
        p.className = 'particle';
        p.style.left  = Math.random() * 80 + 10 + '%';
        p.style.top   = '40%';
        zone.appendChild(p);
        const rm = setTimeout(() => p.remove(), 900);
        this._particleTimers.push(rm);
      }, i * 100);
      this._particleTimers.push(t);
    }
  }

  /* ---------- STATS ---------- */
  _loadStats() {
    const def = { gamesPlayed:0, bestScore:0, totalLetters:0, letters:{}, confusions:{}, playSeconds:0 };
    try { return { ...def, ...(JSON.parse(localStorage.getItem('educaLetterStats')) || {}) }; }
    catch { return { ...def }; }
  }
  /* Suivi par lettre : réussies / vues — base de l'espace parents. */
  _recordLetter(letter, ok) {
    const l = this.stats.letters[letter] || { ok:0, seen:0 };
    l.seen++;
    if (ok) l.ok++;
    this.stats.letters[letter] = l;
    localStorage.setItem('educaLetterStats', JSON.stringify(this.stats));
  }
  /* Compteur de confusions visuelles (b/d, p/q, i/j, m/n). */
  _recordConfusion(target, selected) {
    const key = `${target}/${selected}`;
    this.stats.confusions[key] = (this.stats.confusions[key] || 0) + 1;
    localStorage.setItem('educaLetterStats', JSON.stringify(this.stats));
  }
  _updateStats() {
    this.stats.gamesPlayed++;
    this.stats.bestScore    = Math.max(this.stats.bestScore, this.state.score);
    this.stats.totalLetters += this.state.correct;
    this.stats.playSeconds += Math.round((Date.now() - this.state.startTime) / 1000);
    localStorage.setItem('educaLetterStats', JSON.stringify(this.stats));
  }
  showStats() {
    const s = this.stats;
    document.getElementById('statGames').textContent   = s.gamesPlayed;
    document.getElementById('statBest').textContent    = s.bestScore;
    document.getElementById('statLetters').textContent = s.totalLetters;
    this._renderMastery();
    this._renderMuteBtn();
    this._renderVoicePicker();
    educa.show('screenStats');
    Voice.speak(`Tes statistiques ! ${s.gamesPlayed} parties jouées, et ${s.totalLetters} lettres réussies !`);
  }

  /* Grille visuelle de maîtrise par lettre (espace parents léger) :
     apprise ≥80% après 3 vues · en cours si vue · grise sinon. */
  _renderMastery() {
    const grid = document.getElementById('lettersMastery');
    if (!grid) return;
    grid.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
      const d = this.stats.letters[l];
      let cls = 'mastery-unseen';
      if (d && d.seen >= 3 && d.ok / d.seen >= 0.8) cls = 'mastery-ok';
      else if (d && d.seen > 0)                     cls = 'mastery-wip';
      const cell = document.createElement('span');
      cell.className = `mastery-cell ${cls}`;
      cell.textContent = l;
      cell.title = d ? `${l} : ${d.ok}/${d.seen} réussies` : `${l} : pas encore vue`;
      grid.appendChild(cell);
    });
  }

  /* ---------- MODE SILENCIEUX ---------- */
  /* Classe / bibliothèque : coupe voix et effets. Les consignes restent
     affichées à l'écran — pensé pour ceux qui commencent à déchiffrer. */
  toggleMute() {
    this._muted = !this._muted;
    localStorage.setItem('educaMuted', this._muted ? '1' : '');
    if (this._muted) Voice.stop();
    Voice.muted = this._muted;
    Sfx.muted   = this._muted;
    this._renderMuteBtn();
    if (!this._muted) Voice.speak('La voix de Kaya est de retour !');
  }
  _loadMute() {
    this._muted = localStorage.getItem('educaMuted') === '1';
    Voice.muted = this._muted;
    Sfx.muted   = this._muted;
  }
  _renderMuteBtn() {
    const b = document.getElementById('muteBtn');
    if (b) b.textContent = this._muted ? '🔊 Remettre la voix' : '🔇 Couper la voix';
  }

  /* Sélecteur de voix (pour les parents) — touche = écoute + choix */
  _renderVoicePicker() {
    const list = document.getElementById('voiceList');
    if (!list) return;
    list.innerHTML = '';
    const voices = Voice.choices();
    if (!voices.length) {
      list.innerHTML = '<p class="muted text-center">Voix en cours de chargement…</p>';
      return;
    }
    const current = Voice.current();
    voices.forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      const active = v.name === current;
      b.className = 'btn btn-ghost btn-sm voice-btn' + (active ? ' voice-active' : '');
      const label = v.name.replace(/\(.*\)/g, '').trim();
      b.textContent = (active ? '✓ ' : '') + label + ' · ' + v.lang;
      b.onclick = () => { Voice.use(v.name); this._renderVoicePicker(); };
      list.appendChild(b);
    });
  }

}

let lettersGame;
