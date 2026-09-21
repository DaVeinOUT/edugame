/* ============================================================
   EDUCA.JS — Profil, Hub, Onboarding, Navigation, Cartes
   Règle d'or : un enfant qui ne sait pas lire doit pouvoir
   tout faire à l'oreille — chaque écran et chaque bulle parlent.
   ============================================================ */

class Educa {
  constructor() {
    this.profile  = this._load('educaProfile');
    this._pending = {};
    this._pendingCard    = null;
    this._pendingCardNew = false;
    this._hubSpoken = false;
  }

  /* ---------- STORAGE ---------- */
  _load(key)       { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  _save(key, val)  { localStorage.setItem(key, JSON.stringify(val)); }
  saveProfile()    { this._save('educaProfile', this.profile); }

  /* ---------- PALIERS — 3 chemins de lecture ----------
     L'âge fixe le point de départ, mais la RÉUSSITE pilote la montée.
     Un enfant peut rester au palier 1 aussi longtemps qu'il faut,
     et monter sans stress quand il est prêt. */
  static PALIERS = {
    1: { name:'Découverte',  say:'chemin Découverte',  minAge:'4-6',  cfg:{
      letters:'uppercase', options:2, timer:false, showWordHint:true,
      syllables:false, wordLength:[2,4] } },
    2: { name:'Déchiffreur', say:'chemin Déchiffreur', minAge:'7-9',  cfg:{
      letters:'mixed',     options:3, timer:false, showWordHint:true,
      syllables:true,  wordLength:[3,5] } },
    3: { name:'Lecteur',     say:'chemin Lecteur',     minAge:'10-12', cfg:{
      letters:'mixed',     options:4, timer:true, timeLimit:20, showWordHint:false,
      syllables:true,  wordLength:[4,8] } },
  };

  /* Palier actuel : profil si déjà défini, sinon âge, sinon 1. */
  getPalier() {
    if (this.profile?.palier) return this.profile.palier;
    const byAge = { '4-6':1, '7-9':2, '10-12':3 };
    return byAge[this.profile?.age] || 1;
  }

  /* Enregistre le résultat d'une session et propose la montée si 2
     sessions consécutives ≥80 % sur le palier actuel. */
  recordPalierSession(accuracy) {
    const p = this.getPalier();
    const stats = this.profile.palierStats = this.profile.palierStats || {};
    stats[p] = stats[p] || { sessions:0, goodStreak:0 };
    stats[p].sessions++;
    stats[p].goodStreak = accuracy >= 80 ? stats[p].goodStreak + 1 : 0;
    this.saveProfile();
    // 2 bonnes sessions = on propose le palier suivant (jamais imposé)
    if (stats[p].goodStreak >= 2 && p < 3) {
      const next = Educa.PALIERS[p + 1];
      Voice.speak(`Tu assures ! Tu veux essayer le ${next.say} ? C'est un peu plus difficile, mais je crois en toi.`, { interrupt:false });
      return { canLevelUp: true, nextPalier: p + 1 };
    }
    return { canLevelUp: false };
  }

  /* L'enfant accepte la montée — ou redescend si c'est trop dur. */
  setPalier(n) {
    this.profile.palier = Math.max(1, Math.min(3, n));
    this.saveProfile();
    const p = Educa.PALIERS[this.profile.palier];
    Voice.speak(`Tu es maintenant sur le ${p.say} !`);
    this.showHub();
  }

  /* ---------- RANKS ---------- */
  static RANKS = [
    { name:'Commun',     xpMin:0   },
    { name:'Rare',       xpMin:100 },
    { name:'Épique',     xpMin:300 },
    { name:'Légendaire', xpMin:700 },
  ];
  getRank(xp)     { return [...Educa.RANKS].reverse().find(r => xp >= r.xpMin) || Educa.RANKS[0]; }
  getNextRank(xp) { return Educa.RANKS.find(r => xp < r.xpMin) || null; }

  /* ---------- SCREEN NAV ---------- */
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // Historique de navigation : le bouton « retour » du téléphone revient
    // à l'écran précédent au lieu de fermer l'app (PWA mono-page).
    if (this._currentScreen !== id) {
      this._currentScreen = id;
      this._exitArmed = false;   // toute navigation désarme la sortie
      if (this._historyReady && history.state?.educaScreen !== id) {
        history.pushState({ educaScreen: id }, '');
      }
    }
  }

  /* ---------- START ---------- */
  start() {
    // Point d'ancrage de l'historique : l'écran courant devient la base,
    // les écrans suivants sont empilés. La première pression sur « retour »
    // du téléphone demande confirmation avant de vraiment quitter.
    this._historyReady = true;
    window.addEventListener('popstate', e => {
      const overlay = document.getElementById('cardOverlay');
      // L'overlay de récompense n'est pas un écran : « retour » le ferme
      // d'abord, l'enfant reste sur sa page de résultats.
      if (overlay && !overlay.classList.contains('hidden')) {
        this._clearParticles();
        overlay.classList.add('hidden');
        history.pushState({ educaScreen: this._currentScreen }, '');
        return;
      }
      const target = e.state?.educaScreen;
      if (target) {
        // Un jeu interrompu par « retour » doit stopper timers et voix
        // sans forcer la navigation (c'est l'historique qui pilote).
        const prev = this._currentScreen;
        if (prev === 'screenGame')    lettersGame?._halt();
        if (prev === 'screenBuilder') builderGame?._halt();
        if (prev === 'screenTrace')   traceGame?._halt();
        this._currentScreen = target;
        this.show(target);
      } else {
        // Plus rien dans la pile : on est au point de sortie de l'app.
        this._confirmExit();
      }
    });
    if (!this.profile) {
      this.show('screenOnboard');
      this._showStep('step1');
    } else {
      this.applyTheme();
      this.showHub();
    }
  }

  /* Retour au bord de l'app : la 1re pression avertit et arme la sortie,
     la 2e (sans navigation entre-temps) laisse réellement quitter. */
  _confirmExit() {
    if (this._exitArmed) return;   // armé : on ne repousse pas, l'app peut sortir
    this._exitArmed = true;
    Voice.speak('Tu veux vraiment partir ? Appuie encore une fois sur retour pour quitter.');
    this._flash('Appuie encore sur retour pour quitter');
    // Repousse l'écran courant pour garder une chance d'annuler.
    history.pushState({ educaScreen: this._currentScreen }, '');
  }

  /* Le choix de l'enfant (jungle / espace / océan) colore tout son monde */
  applyTheme() {
    document.body.classList.remove('universe-jungle','universe-space','universe-ocean');
    const u = this.profile?.universe;
    if (u) document.body.classList.add(`universe-${u}`);
  }

  /* ---------- PROFIL : MODIFIER ---------- */
  /* Relance l'onboarding pré-rempli : l'enfant peut corriger son prénom,
     son âge ou son univers SANS perdre ses cartes ni ses points. */
  editProfile() {
    const p = this.profile;
    if (!p) return;
    this._editing = true;
    this._pending = { name: p.name, age: p.age, universe: p.universe };
    this.show('screenOnboard');
    this._showStep('step1');
    // Pré-remplissage : champ prénom + pastilles déjà sélectionnées
    document.getElementById('inputName').value = p.name === 'Champion' ? '' : p.name;
    document.querySelectorAll('[data-age]').forEach(b =>
      b.classList.toggle('selected', b.dataset.age === p.age));
    document.querySelectorAll('[data-universe]').forEach(b =>
      b.classList.toggle('selected', b.dataset.universe === p.universe));
    document.getElementById('bubble2').textContent =
      `Salut ${p.name} ! Dans quel monde veux-tu apprendre ?`;
    Voice.speak('On change ton profil ! Tes cartes et tes points sont gardés, promis.');
  }

  /* ---------- PROFIL : TOUT RECOMMENCER ---------- */
  /* Double garde contre les tapotements : 1er appui arme + parle,
     2e appui (dans la bannière) exécute. Désarmé après 8 s sans suite. */
  resetAll() {
    Voice.speak('Attention ! Ça efface TOUT : les cartes, les points, le prénom. Si tu es vraiment sûr, appuie sur le bouton rouge.');
    const banner = document.getElementById('resetBanner');
    banner.classList.remove('hidden');
    clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(() => this.cancelReset(), 8000);
  }
  cancelReset() {
    clearTimeout(this._resetTimer);
    document.getElementById('resetBanner')?.classList.add('hidden');
    Voice.speak('Ouf ! Rien n\'est effacé.');
  }
  confirmReset() {
    ['educaProfile','educaLetterStats','educaVoiceName','educaMuted','educaComfort']
      .forEach(k => localStorage.removeItem(k));
    location.reload();   // repart vraiment à zéro, mémoire comprise
  }
  _showStep(id) {
    document.querySelectorAll('.onboard-step').forEach(s => s.classList.remove('active'));
    const step = document.getElementById(id);
    step.classList.add('active');
    // Kaya lit sa bulle à voix haute — l'enfant n'a pas besoin de savoir lire
    const bubble = step.querySelector('.speech-bubble');
    if (bubble) setTimeout(() => this.speakBubble(bubble), 300);
  }

  speakBubble(el) {
    Voice.speak(el.textContent.replace(/\s+/g, ' ').trim());
  }

  selectAge(val, el) {
    this._pending.age = val;
    document.querySelectorAll('[data-age]').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    Sfx.tap();
    Voice.speak(el.dataset.say || el.textContent.trim());
  }

  goStep2() {
    // Le prénom est facultatif : taper au clavier est trop dur pour un non-lecteur
    const name = document.getElementById('inputName').value.trim() || 'Champion';
    if (!this._pending.age) { this._flash('Choisis ton âge !'); return; }
    this._pending.name = name;
    document.getElementById('bubble2').textContent =
      `Salut ${name} ! Dans quel monde veux-tu apprendre ?`;
    this._showStep('step2');
  }

  selectUniverse(val, el) {
    this._pending.universe = val;
    document.querySelectorAll('[data-universe]').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    Sfx.tap();
    Voice.speak(el.dataset.say || el.textContent.trim());
  }

  goStep3() {
    if (!this._pending.universe) { this._flash('Choisis un univers !'); return; }
    this._showStep('step3');
  }

  finishOnboard() {
    const p = this._pending;
    if (!p.name || !p.age || !p.universe) return;
    if (this._editing && this.profile) {
      // Édition : seuls prénom/âge/univers changent, le reste est sacré
      Object.assign(this.profile, { name: p.name, age: p.age, universe: p.universe });
    } else {
      this.profile = {
        name: p.name,
        age:  p.age,
        universe: p.universe,
        xp: 0,
        cards: [],
        firstTimes: {},
      };
    }
    this._editing = false;
    this.saveProfile();
    this.applyTheme();
    Sfx.correct();
    this.showHub();
  }

  /* ---------- HUB ---------- */
  showHub() {
    this.show('screenHub');
    const p    = this.profile;
    const rank = this.getRank(p.xp);
    const next = this.getNextRank(p.xp);
    const pct  = next
      ? Math.min(100, ((p.xp - rank.xpMin) / (next.xpMin - rank.xpMin)) * 100)
      : 100;
    document.getElementById('hubName').textContent  = p.name;
    const palier = Educa.PALIERS[this.getPalier()];
    document.getElementById('hubRank').textContent  = `${rank.name} · ${p.xp} XP · ${palier.name}`;
    document.getElementById('hubXpFill').style.width = pct + '%';
    document.getElementById('hubCardCount').textContent =
      `${p.cards.length}/${CARDS_DATA.length}`;
    // Accueil parlé une seule fois par session (pas de radotage)
    if (!this._hubSpoken) {
      this._hubSpoken = true;
      Voice.speak(`Salut ${p.name} ! Choisis ton aventure !`);
    }
  }

  addXP(amount) {
    this.profile.xp += amount;
    this.saveProfile();
  }

  /* ---------- DIFFICULTÉ ---------- */
  /* Fait correspondre l'ancien système (easy/medium/hard/master) au
     palier courant : 1=Découverte, 2=Déchiffreur, 3=Lecteur. */
  showDifficulty() {
    this.show('screenDifficulty');
    // L'étoile suit le palier de l'enfant (pas seulement son âge) :
    // Découverte → visuel, Déchiffreur → à l'oreille doux, Lecteur → expert.
    const reco = { 1:'easy', 2:'medium', 3:'hard' }[this.getPalier()] || 'easy';
    document.querySelectorAll('.diff-card').forEach(c => {
      c.classList.toggle('recommended', c.dataset.level === reco);
    });
    Voice.speak('Choisis ton niveau ! L\'étoile, c\'est le niveau parfait pour toi.');
  }

  /* ---------- CARD REVEAL ---------- */
  /* La couleur du halo dit la rareté — lisible sans savoir lire */
  static AURA = { common:'#7C3AED', rare:'#a060ff', epic:'#1adfcc', legendary:'#ffb830' };

  triggerCard(accuracy, flags = {}, sessionLetters = []) {
    const card  = pickCardForScore(accuracy, flags, this.profile.cards, sessionLetters);
    const isNew = !this.profile.cards.includes(card.id);
    if (isNew) {
      this.profile.cards.push(card.id);
      this.saveProfile();
    }
    this._pendingCard    = card;
    this._pendingCardNew = isNew;
    this._closeTarget    = 'hub';
    this._showCardOverlay(card, 'Nouvelle carte');
    Voice.speak('Tu as gagné une carte ! Appuie dessus pour la retourner !');
  }

  /* Revoir une carte de sa collection (et frimer avec) */
  inspectCard(id) {
    const card = getCardById(id);
    if (!card) return;
    this._pendingCard    = card;
    this._pendingCardNew = false;
    this._closeTarget    = 'collection';
    this._showCardOverlay(card, 'Ta carte');
    Sfx.tap();
    Voice.speak('Appuie sur la carte pour la retourner !');
  }

  _showCardOverlay(card, title) {
    const front = document.getElementById('cardFront');
    front.className = 'card-face card-front';
    front.innerHTML = makeCard(card);
    const overlay = document.getElementById('cardOverlay');
    // Halo et rayons selon la rareté
    overlay.style.setProperty('--aura', card.letter ? card.clr : (Educa.AURA[card.rarity] || '#7C3AED'));
    overlay.classList.toggle('legendary', card.rarity === 'legendary');
    document.getElementById('cardOverlayTitle').textContent = title || 'Nouvelle carte';
    document.getElementById('cardInner').classList.remove('flipped');
    document.getElementById('cardContinueBtn').style.display = 'none';
    document.getElementById('cardHint').style.display = '';
    overlay.classList.remove('hidden');
    Card3D.fresh();
    // Amène le focus sur la carte (navigation clavier / switch)
    setTimeout(() => document.querySelector('.card-wrap')?.focus(), 100);
  }

  flipCard() {
    document.getElementById('cardInner').classList.add('flipped');
    document.getElementById('cardHint').style.display        = 'none';
    document.getElementById('cardContinueBtn').style.display = '';
    Sfx.card();
    Card3D.reveal();
    const c = this._pendingCard;
    if (c) {
      const label = c.letter
        ? `La carte de la lettre ${c.letter} ! ${c.name} !`
        : `${c.name} !`;
      Voice.speak(this._pendingCardNew
        ? `Nouvelle carte ! ${label}`
        : `${label} Tu l'avais déjà dans ta collection.`);
      const count = { legendary:22, epic:14, rare:10 }[c.rarity] || 8;
      this._spawnParticles(count);
    }
  }

  closeCard() {
    this._clearParticles();
    document.getElementById('cardOverlay').classList.add('hidden');
    if (this._closeTarget === 'collection') this.showCollection(true);
    else this.showHub();
    this._closeTarget = 'hub';
  }

  _spawnParticles(count = 8) {
    const overlay = document.getElementById('cardOverlay');
    this._particleTimers = this._particleTimers || [];
    // Timers enregistrés : si l'enfant ferme la carte avant la fin,
    // closeCard() les annule — plus de fuite d'éléments fantômes.
    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        if (overlay.classList.contains('hidden')) return;
        const p = document.createElement('span');
        p.className = 'particle';
        p.style.left  = Math.random() * 80 + 10 + '%';
        p.style.top   = Math.random() * 60 + 20 + '%';
        overlay.appendChild(p);
        const rm = setTimeout(() => p.remove(), 900);
        this._particleTimers.push(rm);
      }, i * 70);
      this._particleTimers.push(t);
    }
  }

  _clearParticles() {
    (this._particleTimers || []).forEach(t => clearTimeout(t));
    this._particleTimers = [];
  }

  /* ---------- COLLECTION ---------- */
  showCollection(silent = false) {
    this.show('screenCollection');
    const owned = this.profile.cards;
    const grid  = document.getElementById('collectionGrid');
    const count = document.getElementById('collectionCount');
    count.textContent = `${owned.length} / ${CARDS_DATA.length} cartes débloquées`;
    grid.innerHTML = '';
    CARDS_DATA.forEach(card => {
      const el       = document.createElement('div');
      const themeKey = card.tier ? `spc-${card.tier}` : `theme-${card.theme}`;
      const display  = card.letter || card.id.slice(0,2).toUpperCase();
      const has      = owned.includes(card.id);
      el.className   = `coll-item ${themeKey}${has ? '' : ' locked'}`;
      el.innerHTML   = `<div class="coll-letter">${display}</div>
                        <div class="coll-name">${card.name}</div>`;
      // Toucher une carte gagnée = la voir en grand (effet 3D) ;
      // une carte verrouillée = un encouragement parlé
      el.onclick = () => {
        if (has) { this.inspectCard(card.id); return; }
        Sfx.tap();
        el.style.animation = 'wrongShake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
        Voice.speak('Carte mystère ! Continue à jouer pour la gagner !');
      };
      grid.appendChild(el);
    });
    if (!silent) Voice.speak(`Ta collection ! ${owned.length} cartes sur ${CARDS_DATA.length} !`);
  }

  /* ---------- UTILS ---------- */
  /* Message non-bloquant, toujours parlé (remplace alert) */
  _flash(msg) {
    Voice.speak(msg);
    const t = document.getElementById('flashToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------- EXPORT / IMPORT ---------- */
  /* Changement de téléphone ou tablette partagée : la progression
     (profil, XP, cartes, stats lettres) se télécharge en JSON et se
     réimporte — sans serveur, les données restent aux familles. */
  exportProgress() {
    const data = {
      educa: 1,
      exportedAt: new Date().toISOString(),
      profile: this.profile,
      letterStats: this._load('educaLetterStats'),
      voice: localStorage.getItem('educaVoiceName'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `educa-progression-${(this.profile?.name || 'enfant').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    Voice.speak('Progression téléchargée ! Garde le fichier précieusement.');
  }

  importProgress(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.educa !== 1 || !data.profile) throw new Error('bad file');
        this.profile = data.profile;
        this.saveProfile();
        if (data.letterStats) this._save('educaLetterStats', data.letterStats);
        if (data.voice) localStorage.setItem('educaVoiceName', data.voice);
        this.applyTheme();
        Sfx.correct();
        Voice.speak(`Content de te revoir, ${this.profile.name} ! Ta progression est revenue !`);
        this.showHub();
      } catch {
        this._flash('Ce fichier ne fonctionne pas. Essaie le bon fichier EDUCA !');
      }
    };
    reader.readAsText(file);
  }

  /* ---------- STATS GLOBALES ----------
     Partagées par TOUS les jeux : une partie de Lettres, un mot
     construit ou une lettre tracée nourrissent le même total.
     Un abandon en cours de route compte ce qui a été appris. */
  recordActivity({ score = 0, items = 0, seconds = 0, completed = false } = {}) {
    let s;
    try { s = JSON.parse(localStorage.getItem('educaLetterStats')) || {}; }
    catch { s = {}; }
    if (completed) s.gamesPlayed = (s.gamesPlayed || 0) + 1;
    s.bestScore    = Math.max(s.bestScore || 0, score);
    s.totalLetters = (s.totalLetters || 0) + items;
    s.playSeconds  = (s.playSeconds || 0) + seconds;
    localStorage.setItem('educaLetterStats', JSON.stringify(s));
  }

  exitToHub() { this.showHub(); }
}

let educa;
