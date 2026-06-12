/* ============================================================
   CARDS.JS — Données, rendu SVG (lettres + cartes spéciales)
   ============================================================ */

const CARDS_DATA = [
  /* ── Commun — 26 lettres ── */
  /* name = le même mot simple que dans le jeu (commence par la lettre) */
  { id:'A', letter:'A', word:'Araignée',   n:'01', theme:'blue',   clr:'#4a90ff', pw:40,  name:'Avion',          rarity:'common',    category:'lettre'   },
  { id:'B', letter:'B', word:'Bouclier',   n:'02', theme:'purple', clr:'#a060ff', pw:45,  name:'Ballon',         rarity:'common',    category:'lettre'   },
  { id:'C', letter:'C', word:'Cristal',    n:'03', theme:'teal',   clr:'#1adfcc', pw:42,  name:'Chat',           rarity:'common',    category:'lettre'   },
  { id:'D', letter:'D', word:'Dragon',     n:'04', theme:'red',    clr:'#ff5060', pw:55,  name:'Dinosaure',      rarity:'common',    category:'lettre'   },
  { id:'E', letter:'E', word:'Éclair',     n:'05', theme:'amber',  clr:'#ffb830', pw:48,  name:'Éléphant',       rarity:'common',    category:'lettre'   },
  { id:'F', letter:'F', word:'Foudre',     n:'06', theme:'green',  clr:'#40c840', pw:50,  name:'Fleur',          rarity:'common',    category:'lettre'   },
  { id:'G', letter:'G', word:'Gardien',    n:'07', theme:'blue',   clr:'#4a90ff', pw:52,  name:'Girafe',         rarity:'common',    category:'lettre'   },
  { id:'H', letter:'H', word:'Héros',      n:'08', theme:'purple', clr:'#a060ff', pw:58,  name:'Hibou',          rarity:'common',    category:'lettre'   },
  { id:'I', letter:'I', word:'Infini',     n:'09', theme:'teal',   clr:'#1adfcc', pw:44,  name:'Île',            rarity:'common',    category:'lettre'   },
  { id:'J', letter:'J', word:'Joyau',      n:'10', theme:'amber',  clr:'#ffb830', pw:46,  name:'Jungle',         rarity:'common',    category:'lettre'   },
  { id:'K', letter:'K', word:'Kaijū',      n:'11', theme:'red',    clr:'#ff5060', pw:60,  name:'Koala',          rarity:'common',    category:'lettre'   },
  { id:'L', letter:'L', word:'Lame',       n:'12', theme:'green',  clr:'#40c840', pw:53,  name:'Lion',           rarity:'common',    category:'lettre'   },
  { id:'M', letter:'M', word:'Météore',    n:'13', theme:'blue',   clr:'#4a90ff', pw:57,  name:'Maison',         rarity:'common',    category:'lettre'   },
  { id:'N', letter:'N', word:'Nébuleuse',  n:'14', theme:'purple', clr:'#a060ff', pw:49,  name:'Nuage',          rarity:'common',    category:'lettre'   },
  { id:'O', letter:'O', word:'Orbital',    n:'15', theme:'teal',   clr:'#1adfcc', pw:43,  name:'Ours',           rarity:'common',    category:'lettre'   },
  { id:'P', letter:'P', word:'Phénix',     n:'16', theme:'red',    clr:'#ff5060', pw:62,  name:'Perroquet',      rarity:'common',    category:'lettre'   },
  { id:'Q', letter:'Q', word:'Quantum',    n:'17', theme:'amber',  clr:'#ffb830', pw:47,  name:'Quille',         rarity:'common',    category:'lettre'   },
  { id:'R', letter:'R', word:'Rune',       n:'18', theme:'green',  clr:'#40c840', pw:54,  name:'Robot',          rarity:'common',    category:'lettre'   },
  { id:'S', letter:'S', word:'Spectre',    n:'19', theme:'blue',   clr:'#4a90ff', pw:56,  name:'Soleil',         rarity:'common',    category:'lettre'   },
  { id:'T', letter:'T', word:'Titan',      n:'20', theme:'purple', clr:'#a060ff', pw:61,  name:'Tortue',         rarity:'common',    category:'lettre'   },
  { id:'U', letter:'U', word:'Ultime',     n:'21', theme:'teal',   clr:'#1adfcc', pw:51,  name:'Univers',        rarity:'common',    category:'lettre'   },
  { id:'V', letter:'V', word:'Vortex',     n:'22', theme:'red',    clr:'#ff5060', pw:59,  name:'Vélo',           rarity:'common',    category:'lettre'   },
  { id:'W', letter:'W', word:'Wraith',     n:'23', theme:'amber',  clr:'#ffb830', pw:63,  name:'Wagon',          rarity:'common',    category:'lettre'   },
  { id:'X', letter:'X', word:'Xenon',      n:'24', theme:'green',  clr:'#40c840', pw:64,  name:'Xylophone',      rarity:'common',    category:'lettre'   },
  { id:'Y', letter:'Y', word:'Yggdrasil',  n:'25', theme:'blue',   clr:'#4a90ff', pw:65,  name:'Yeux',           rarity:'common',    category:'lettre'   },
  { id:'Z', letter:'Z', word:'Zénith',     n:'26', theme:'purple', clr:'#a060ff', pw:70,  name:'Zèbre',          rarity:'common',    category:'lettre'   },

  /* ── Rare — Exploits (tier visuel : commun/purple) ── */
  { id:'r_first',   n:'27', tier:'commun', theme:'purple', svgFn:'exploit1', pw:80,  name:'Première Lettre', desc:'Le voyage commence ici', rarity:'rare', category:'exploit' },
  { id:'r_streak',  n:'28', tier:'commun', theme:'purple', svgFn:'exploit2', pw:100, name:'5 en Série',       desc:"5 bonnes réponses d'affilée", rarity:'rare', category:'exploit' },
  { id:'r_session', n:'29', tier:'commun', theme:'purple', svgFn:'exploit3', pw:120, name:'Session Complète', desc:'Tout accompli sans abandon', rarity:'rare', category:'exploit' },

  /* ── Épique — Héros (tier visuel : rare/teal) ── */
  { id:'e_speed',   n:'30', tier:'rare',   theme:'teal',   svgFn:'rare1',    pw:280, name:'Lecteur Rapide',  desc:'Terminé en moins de 60s', rarity:'epic', category:'heros' },
  { id:'e_perfect', n:'31', tier:'rare',   theme:'teal',   svgFn:'rare2',    pw:320, name:'Sans Faute',      desc:'Précision absolue 100%',  rarity:'epic', category:'heros' },
  { id:'e_persist', n:'32', tier:'rare',   theme:'teal',   svgFn:'rare3',    pw:260, name:'Persévérant',     desc:'Recommencé après erreur', rarity:'epic', category:'heros' },

  /* ── Légendaire — Légendes (tier visuel : epic/amber) ── */
  { id:'l_alphabet',n:'33', tier:'epic',   theme:'amber',  svgFn:'legend1',  pw:850, name:"Maître Alphabet", desc:'26 lettres maîtrisées',   rarity:'legendary', category:'titre'     },
  { id:'l_builder', n:'34', tier:'epic',   theme:'amber',  svgFn:'legend2',  pw:750, name:'Constructeur',    desc:"10 mots d'affilée",       rarity:'legendary', category:'titre'     },
  { id:'l_kaya',    n:'35', tier:'epic',   theme:'amber',  svgFn:'legend3',  pw:800, name:'Kaya Légendaire', desc:'Compagnon au niveau max', rarity:'legendary', category:'compagnon' },
  { id:'l_educa',   n:'36', tier:'epic',   theme:'amber',  svgFn:'legend4',  pw:999, name:'Sauveur EDUCA',   desc:'Mission EDUCA accomplie', rarity:'legendary', category:'titre'     },
];

/* ════════════════════════════════════════════
   RENDU LETTRE — SVG avec runes hexagonales
════════════════════════════════════════════ */

function _makeRunes(clr) {
  const dots = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const r = 54, x = 70 + Math.cos(angle) * r, y = 65 + Math.sin(angle) * r;
    dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${clr}" opacity="0.35"/>`);
  }
  return dots.join('');
}

function _makeLetterCard(d) {
  const catLabel   = 'Lettre';
  const activeDot  = `dot-active-${d.theme}`;
  let dotsHtml = '';
  for (let i = 0; i < 4; i++) {
    dotsHtml += `<div class="dot ${i < 1 ? activeDot : 'dot-off'}"></div>`;
  }
  return `<div class="card theme-${d.theme}">
  <div class="card-glow"></div><div class="holo"></div><div class="glare-fx"></div>
  <div class="corner-tl"></div><div class="corner-br"></div>
  <div class="card-top"><div class="cat-tag">${catLabel}</div><div class="card-num">${d.n}/36</div></div>
  <div class="art-zone">
    <svg class="letter-svg" viewBox="0 0 140 130" fill="none">
      <circle cx="70" cy="65" r="50" fill="${d.clr}" fill-opacity="0.06" stroke="${d.clr}" stroke-width="0.5" stroke-opacity="0.25"/>
      <circle cx="70" cy="65" r="38" fill="${d.clr}" fill-opacity="0.04" stroke="${d.clr}" stroke-width="0.5" stroke-opacity="0.15"/>
      ${_makeRunes(d.clr)}
      <text x="70" y="95" text-anchor="middle" font-size="80" font-weight="900"
        font-family="'Orbitron',monospace" fill="${d.clr}" fill-opacity="0.9"
        filter="url(#glow-${d.n})">${d.letter}</text>
      <defs>
        <filter id="glow-${d.n}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <line x1="70"  y1="8"   x2="70"  y2="16"  stroke="${d.clr}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <line x1="70"  y1="114" x2="70"  y2="122" stroke="${d.clr}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <line x1="12"  y1="65"  x2="20"  y2="65"  stroke="${d.clr}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <line x1="120" y1="65"  x2="128" y2="65"  stroke="${d.clr}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    </svg>
  </div>
  <div class="divider"></div>
  <div class="card-bottom">
    <div class="letter-name">${d.letter} — ${d.word}</div>
    <div class="letter-word">Lettre · #${parseInt(d.n)}</div>
    <div class="card-footer">
      <div class="rarity">${dotsHtml}</div>
      <div class="pwr-badge">PWR <span style="color:rgba(255,255,255,0.55)">${d.pw}</span></div>
      <div class="xp-badge">XP <span>+20</span></div>
    </div>
  </div>
</div>`;
}

/* ════════════════════════════════════════════
   RENDU SPÉCIAL — Art SVG par carte
════════════════════════════════════════════ */

const _TIER_CLR   = { commun:'#a060ff', rare:'#1adfcc', epic:'#ffb830' };
const _TIER_LABEL = { commun:'Exploit',  rare:'Héros',   epic:'Légende' };
const _TIER_XP    = { commun:'+150',     rare:'+350',    epic:'+900'    };

function _starPts(cx, cy, r1, r2) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

const _SVG_ART = {
  exploit1: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="65" r="48" fill="${c}" fill-opacity="0.06" stroke="${c}" stroke-width="0.5" stroke-opacity="0.2"/>
    <rect x="32" y="45" width="30" height="38" rx="4" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-width="1.2" stroke-opacity="0.6"/>
    <rect x="78" y="45" width="30" height="38" rx="4" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-width="1.2" stroke-opacity="0.6"/>
    <line x1="70" y1="46" x2="70" y2="82" stroke="${c}" stroke-width="1.2" stroke-opacity="0.5"/>
    <line x1="38" y1="56" x2="58" y2="56" stroke="${c}" stroke-width="0.8" stroke-opacity="0.35"/>
    <line x1="38" y1="62" x2="58" y2="62" stroke="${c}" stroke-width="0.8" stroke-opacity="0.35"/>
    <line x1="38" y1="68" x2="54" y2="68" stroke="${c}" stroke-width="0.8" stroke-opacity="0.35"/>
    <line x1="82" y1="56" x2="102" y2="56" stroke="${c}" stroke-width="0.8" stroke-opacity="0.35"/>
    <line x1="82" y1="62" x2="102" y2="62" stroke="${c}" stroke-width="0.8" stroke-opacity="0.35"/>
    <line x1="82" y1="68" x2="96"  y2="68" stroke="${c}" stroke-width="0.8" stroke-opacity="0.35"/>
    <circle cx="100" cy="30" r="12" fill="${c}" fill-opacity="0.15" stroke="${c}" stroke-width="1" stroke-opacity="0.5"/>
    <polygon points="100,21 103,28 111,28 105,33 107,41 100,36 93,41 95,33 89,28 97,28" fill="${c}" fill-opacity="0.7" stroke="${c}" stroke-width="0.5"/>
  </svg>`,

  exploit2: c => {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const cx = 22 + i * 24, cy = 58 - Math.abs(2 - i) * 8, s = 8 + (2 - Math.abs(2 - i)) * 3;
      pts.push(`<polygon points="${_starPts(cx,cy,s,s*0.42)}" fill="${c}" fill-opacity="${0.4+i*0.12}" stroke="${c}" stroke-width="0.8"/>`);
    }
    return `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
      <circle cx="70" cy="65" r="48" fill="${c}" fill-opacity="0.05" stroke="${c}" stroke-width="0.5" stroke-opacity="0.18"/>
      ${pts.join('')}
      <text x="70" y="98" text-anchor="middle" font-family="'Orbitron',monospace" font-size="11" font-weight="900" fill="${c}" fill-opacity="0.65">× 5 d'affilée</text>
    </svg>`;
  },

  exploit3: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="60" r="48" fill="${c}" fill-opacity="0.06" stroke="${c}" stroke-width="0.5" stroke-opacity="0.2"/>
    <circle cx="70" cy="60" r="34" fill="${c}" fill-opacity="0.1" stroke="${c}" stroke-width="1.5" stroke-opacity="0.45"/>
    <polyline points="50,60 63,74 90,44" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-opacity="0.9"/>
    <circle cx="70" cy="60" r="2.5" fill="${c}" opacity="0.3"/>
  </svg>`,

  rare1: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="65" r="48" fill="${c}" fill-opacity="0.06" stroke="${c}" stroke-width="0.5" stroke-opacity="0.2"/>
    <polygon points="76,18 56,60 70,60 64,105 90,55 74,55" fill="${c}" fill-opacity="0.55" stroke="${c}" stroke-width="1" stroke-linejoin="round"/>
    <circle cx="28" cy="100" r="14" fill="${c}" fill-opacity="0.12" stroke="${c}" stroke-width="1.2" stroke-opacity="0.5"/>
    <line x1="28" y1="91" x2="28" y2="100" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="28" y1="100" x2="34" y2="104" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <text x="28" y="122" text-anchor="middle" font-family="'Orbitron',monospace" font-size="7" fill="${c}" fill-opacity="0.5">60s</text>
  </svg>`,

  rare2: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="62" r="48" fill="${c}" fill-opacity="0.05" stroke="${c}" stroke-width="0.5" stroke-opacity="0.18"/>
    <path d="M70,18 L100,28 L100,58 Q100,90 70,105 Q40,90 40,58 L40,28 Z" fill="${c}" fill-opacity="0.14" stroke="${c}" stroke-width="1.5" stroke-linejoin="round" stroke-opacity="0.7"/>
    <path d="M70,26 L94,34 L94,58 Q94,82 70,95 Q46,82 46,58 L46,34 Z" fill="${c}" fill-opacity="0.1" stroke="${c}" stroke-width="0.8" stroke-linejoin="round" stroke-opacity="0.4"/>
    <text x="70" y="72" text-anchor="middle" font-family="'Orbitron',monospace" font-size="18" font-weight="900" fill="${c}" fill-opacity="0.9">100%</text>
  </svg>`,

  rare3: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="62" r="48" fill="${c}" fill-opacity="0.05" stroke="${c}" stroke-width="0.5" stroke-opacity="0.18"/>
    <path d="M70,24 A38,38 0 1,1 38,56" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-opacity="0.8"/>
    <polygon points="32,44 38,58 48,50" fill="${c}" fill-opacity="0.85"/>
    <rect x="56" y="68" width="28" height="22" rx="6" fill="${c}" fill-opacity="0.3" stroke="${c}" stroke-width="1" stroke-opacity="0.6"/>
    <rect x="60" y="62" width="8"  height="10" rx="3" fill="${c}" fill-opacity="0.4" stroke="${c}" stroke-width="0.8"/>
    <rect x="70" y="60" width="8"  height="12" rx="3" fill="${c}" fill-opacity="0.4" stroke="${c}" stroke-width="0.8"/>
    <rect x="80" y="63" width="7"  height="9"  rx="3" fill="${c}" fill-opacity="0.4" stroke="${c}" stroke-width="0.8"/>
  </svg>`,

  legend1: c => {
    const dots = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 - Math.PI / 2, r = 46;
      dots.push(`<circle cx="${(70+Math.cos(a)*r).toFixed(1)}" cy="${(65+Math.sin(a)*r).toFixed(1)}" r="2.2" fill="${c}" fill-opacity="${0.3+((i%4)/4)*0.4}"/>`);
    }
    return `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
      ${dots.join('')}
      <circle cx="70" cy="65" r="30" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-width="1" stroke-opacity="0.3"/>
      <path d="M44,78 L50,50 L62,66 L70,42 L78,66 L90,50 L96,78 Z" fill="${c}" fill-opacity="0.3" stroke="${c}" stroke-width="1.4" stroke-linejoin="round" stroke-opacity="0.8"/>
      <rect x="44" y="78" width="52" height="8" rx="3" fill="${c}" fill-opacity="0.4" stroke="${c}" stroke-width="0.8" stroke-opacity="0.6"/>
      <circle cx="70" cy="42" r="4" fill="${c}" opacity="0.85"/>
      <circle cx="50" cy="50" r="3" fill="${c}" opacity="0.7"/>
      <circle cx="90" cy="50" r="3" fill="${c}" opacity="0.7"/>
      <text x="70" y="75" text-anchor="middle" font-family="'Orbitron',monospace" font-size="9" font-weight="900" fill="${c}" fill-opacity="0.7">26</text>
    </svg>`;
  },

  legend2: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="65" r="48" fill="${c}" fill-opacity="0.05" stroke="${c}" stroke-width="0.5" stroke-opacity="0.18"/>
    <rect x="42" y="90" width="20" height="14" rx="3" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="1"/>
    <rect x="66" y="90" width="26" height="14" rx="3" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="1"/>
    <rect x="46" y="74" width="22" height="14" rx="3" fill="${c}" fill-opacity="0.32" stroke="${c}" stroke-width="1"/>
    <rect x="72" y="74" width="18" height="14" rx="3" fill="${c}" fill-opacity="0.32" stroke="${c}" stroke-width="1"/>
    <rect x="52" y="58" width="36" height="14" rx="3" fill="${c}" fill-opacity="0.42" stroke="${c}" stroke-width="1.2"/>
    <rect x="56" y="43" width="28" height="13" rx="3" fill="${c}" fill-opacity="0.55" stroke="${c}" stroke-width="1.2"/>
    <rect x="61" y="29" width="18" height="12" rx="3" fill="${c}" fill-opacity="0.7" stroke="${c}" stroke-width="1.4"/>
    <text x="70" y="39" text-anchor="middle" font-family="'Orbitron',monospace" font-size="8" font-weight="900" fill="${c}" fill-opacity="0.9">10×</text>
  </svg>`,

  legend3: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="60" r="48" fill="${c}" fill-opacity="0.06" stroke="${c}" stroke-width="0.5" stroke-opacity="0.18"/>
    <circle cx="70" cy="50" r="22" fill="${c}" fill-opacity="0.14" stroke="${c}" stroke-width="1.5" stroke-opacity="0.5"/>
    <circle cx="62" cy="46" r="3" fill="${c}" fill-opacity="0.9"/>
    <circle cx="78" cy="46" r="3" fill="${c}" fill-opacity="0.9"/>
    <path d="M63,56 Q70,62 77,56" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round" stroke-opacity="0.8"/>
    <path d="M50,78 Q46,95 50,105 L70,105 L90,105 Q94,95 90,78 Q84,72 70,70 Q56,72 50,78Z" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-width="1" stroke-opacity="0.45"/>
    <circle cx="100" cy="26" r="14" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="1.5" stroke-opacity="0.6"/>
    <text x="100" y="30" text-anchor="middle" font-family="'Orbitron',monospace" font-size="8" font-weight="900" fill="${c}" fill-opacity="0.9">MAX</text>
    <line x1="60" y1="28" x2="56" y2="22" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.5"/>
    <line x1="80" y1="28" x2="84" y2="22" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.5"/>
    <line x1="70" y1="26" x2="70" y2="18" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.5"/>
  </svg>`,

  legend4: c => `<svg class="art-svg" viewBox="0 0 140 130" fill="none">
    <circle cx="70" cy="65" r="48" fill="${c}" fill-opacity="0.06" stroke="${c}" stroke-width="0.5" stroke-opacity="0.2"/>
    <line x1="70" y1="42" x2="70" y2="100" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.5"/>
    <rect x="62" y="88" width="16" height="14" rx="4" fill="${c}" fill-opacity="0.45" stroke="${c}" stroke-width="1"/>
    <path d="M70,16 Q60,24 62,34 Q65,26 70,30 Q75,26 78,34 Q80,24 70,16Z" fill="${c}" fill-opacity="0.85" stroke="${c}" stroke-width="0.5"/>
    <path d="M70,22 Q67,28 68,32 Q70,28 72,32 Q73,28 70,22Z" fill="#fff" fill-opacity="0.3"/>
    <line x1="28"  y1="65" x2="42"  y2="65" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="98"  y1="65" x2="112" y2="65" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="36"  y1="38" x2="47"  y2="49" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="104" y1="38" x2="93"  y2="49" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.4"/>
    <line x1="36"  y1="92" x2="47"  y2="81" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.3"/>
    <line x1="104" y1="92" x2="93"  y2="81" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.3"/>
    <circle cx="52" cy="40" r="3" fill="${c}" fill-opacity="0.4"/>
    <circle cx="88" cy="40" r="3" fill="${c}" fill-opacity="0.4"/>
    <circle cx="44" cy="70" r="2" fill="${c}" fill-opacity="0.3"/>
    <circle cx="96" cy="70" r="2" fill="${c}" fill-opacity="0.3"/>
  </svg>`,
};

function _makeSpecialCard(d) {
  const c    = _TIER_CLR[d.tier];
  const dots = d.tier === 'epic' ? 3 : d.tier === 'rare' ? 2 : 1;
  let dotsHtml = '';
  for (let i = 0; i < 3; i++) {
    dotsHtml += `<div class="dot ${i < dots ? `spc-dot-${d.tier}` : 'dot-off'}"></div>`;
  }
  return `<div class="card spc-${d.tier}">
  <div class="card-glow"></div><div class="holo"></div><div class="glare-fx"></div>
  <div class="corner-tl"></div><div class="corner-br"></div>
  <div class="card-top">
    <div class="cat-tag">${_TIER_LABEL[d.tier]}</div>
    <div class="card-num">${d.n}/36</div>
  </div>
  <div class="art-zone">${(_SVG_ART[d.svgFn] || (() => ''))(c)}</div>
  <div class="divider"></div>
  <div class="card-bottom">
    <div class="letter-name">${d.name}</div>
    <div class="letter-word">${d.desc}</div>
    <div class="card-footer">
      <div class="rarity">${dotsHtml}</div>
      <div class="pwr-badge">PWR <span style="color:rgba(255,255,255,0.55)">${d.pw}</span></div>
      <div class="xp-badge">XP <span>${_TIER_XP[d.tier]}</span></div>
    </div>
  </div>
</div>`;
}

/* ════════════════════════════════════════════
   API PUBLIQUE
════════════════════════════════════════════ */

function makeCard(d) {
  return d.tier ? _makeSpecialCard(d) : _makeLetterCard(d);
}

function getCardById(id) {
  return CARDS_DATA.find(c => c.id === id) || null;
}

/* Les cartes se MÉRITENT : un vrai exploit donne sa carte d'exploit,
   sinon l'enfant gagne la carte d'une lettre qu'il a réussie.
   Priorité aux cartes qu'il ne possède pas encore (collection complétable). */
function pickCardForScore(accuracy, flags = {}, owned = [], sessionLetters = []) {
  // 1) Exploits réellement accomplis pendant la partie
  const achievements = [
    [flags.alphabetMaster,  'l_alphabet'],   // 100% en mode Maître
    [flags.builderComplete, 'l_builder'],    // 10 mots construits
    [flags.perfect,         'e_perfect'],    // précision 100%
    [flags.fast,            'e_speed'],      // terminé en moins de 60s
    [flags.retry,           'e_persist'],    // a refait ses erreurs
    [flags.streak5,         'r_streak'],     // 5 bonnes réponses d'affilée
    [flags.firstGame,       'r_first'],      // toute première partie
    [flags.sessionComplete, 'r_session'],    // session terminée sans abandon
  ];
  for (const [earned, id] of achievements) {
    if (earned && !owned.includes(id)) return getCardById(id);
  }
  // 2) Une lettre réussie pendant cette partie (priorité aux nouvelles)
  const letterCards  = CARDS_DATA.filter(c => c.letter);
  const fromSession  = letterCards.filter(c =>
    sessionLetters.includes(c.letter) && !owned.includes(c.id));
  if (fromSession.length) {
    return fromSession[Math.floor(Math.random() * fromSession.length)];
  }
  // 3) Sinon n'importe quelle lettre manquante, sinon au hasard
  const fresh = letterCards.filter(c => !owned.includes(c.id));
  const pool  = fresh.length ? fresh : letterCards;
  return pool[Math.floor(Math.random() * pool.length)];
}

function rarityLabel(r) {
  return { common:'Commun', rare:'Rare', epic:'Épique', legendary:'Légendaire' }[r] || r;
}
