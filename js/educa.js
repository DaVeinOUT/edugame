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
  }

  /* ---------- START ---------- */
  start() {
    if (!this.profile) {
      this.show('screenOnboard');
      this._showStep('step1');
    } else {
      this.applyTheme();
      this.showHub();
    }
  }

  /* Le choix de l'enfant (jungle / espace / océan) colore tout son monde */
  applyTheme() {
    document.body.classList.remove('universe-jungle','universe-space','universe-ocean');
    const u = this.profile?.universe;
    if (u) document.body.classList.add(`universe-${u}`);
  }

  /* ---------- ONBOARDING ---------- */
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
    this.profile = {
      name: p.name,
      age:  p.age,
      universe: p.universe,
      xp: 0,
      cards: [],
      firstTimes: {},
    };
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
    document.getElementById('hubRank').textContent  = `${rank.name} · ${p.xp} XP`;
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
  showDifficulty() {
    this.show('screenDifficulty');
    // Niveau conseillé selon l'âge donné à l'accueil
    const reco = { '4-6':'easy', '7-9':'medium', '10-12':'hard' }[this.profile?.age] || 'easy';
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
    document.getElementById('cardOverlay').classList.add('hidden');
    if (this._closeTarget === 'collection') this.showCollection(true);
    else this.showHub();
    this._closeTarget = 'hub';
  }

  _spawnParticles(count = 8) {
    const overlay = document.getElementById('cardOverlay');
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement('span');
        p.className = 'particle';
        p.style.left  = Math.random() * 80 + 10 + '%';
        p.style.top   = Math.random() * 60 + 20 + '%';
        overlay.appendChild(p);
        setTimeout(() => p.remove(), 900);
      }, i * 70);
    }
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

  exitToHub() { this.showHub(); }
}

let educa;
