/* ============================================================
   DATA/CURRICULUM.JS — Le parcours de lecture de Kaya
   Une méthode explicite et systématique : on apprend le SON des
   lettres (pas seulement leur nom), une correspondance à la fois,
   des voyelles et consonnes qu'on peut prolonger (« mmm », « sss »)
   vers les graphèmes complexes (ou, on, an, oi, eau, gn…).
   Ordre inspiré des recommandations françaises (guide « Pour enseigner
   la lecture et l'écriture au CP », MEN 2019) : fréquence, facilité de
   la fusion, et lettres qui se ressemblent (b/d, p/q, m/n, f/v)
   jamais introduites l'une juste après l'autre.

   Notation des mots : voir js/core/seg.js ("ch-a-t°", "m-ai|s:z-on").
   Dans les textes de Kaya : [x] = jouer le son x, «mot» = dire le mot
   lentement (et montrer son image si elle existe).
   ============================================================ */

/* kind : voyelle | longue (consonne qu'on peut prolonger) | courte
          (consonne brève) | complexe (plusieurs lettres, un son) | regle */
export const STEPS = [
  { id: 'a', show: 'a', gpcs: ['a>a', 'à>a', 'â>a'], ph: 'a', kind: 'voyelle', anchor: 'ananas',
    intro: 'Voici la lettre a. Elle fait le son [a]. Comme au début de «ananas» ! Dis avec moi : [a] !' },
  { id: 'i', show: 'i', gpcs: ['i>i', 'î>i', 'ï>i'], ph: 'i', kind: 'voyelle', anchor: 'île',
    intro: 'Voici la lettre i, avec son petit point. Elle fait le son [i]. Comme au début de «île» ! Dis avec moi : [i] !' },
  { id: 'l', show: 'l', gpcs: ['l>l', 'll>l'], ph: 'l', kind: 'longue', anchor: 'lion',
    intro: 'Voici la lettre l. Son nom, c\'est «l». Mais dans les mots, elle chante [l]. Comme au début de «lion» ! Écoute : «la», «li» !' },
  { id: 'o', show: 'o', gpcs: ['o>o', 'ô>o'], ph: 'o', kind: 'voyelle', anchor: 'os',
    intro: 'Voici la lettre o, toute ronde. Elle fait le son [o]. Comme dans «os» ! Avec l : «lo» !' },
  { id: 'r', show: 'r', gpcs: ['r>r', 'rr>r'], ph: 'r', kind: 'longue', anchor: 'robot',
    intro: 'Voici la lettre r. Dans les mots, elle gronde tout doucement : [r]. Comme au début de «robot» ! Écoute : «ra», «ri», «ro» !' },
  { id: 'u', show: 'u', gpcs: ['u>u', 'û>u', 'ù>u'], ph: 'u', kind: 'voyelle', anchor: 'usine',
    intro: 'Voici la lettre u. Elle fait le son [u], la bouche en rond comme pour un bisou. Comme au début de «usine» ! Écoute : «lu», «ru» !' },
  { id: 'm', show: 'm', gpcs: ['m>m', 'mm>m'], ph: 'm', kind: 'longue', anchor: 'moto',
    intro: 'Voici la lettre m, avec ses deux bosses. Elle chante [m], la bouche fermée. Comme au début de «moto» ! Écoute : «ma», «mi», «mo» !' },
  { id: 'é', show: 'é', gpcs: ['é>é'], ph: 'é', kind: 'voyelle', anchor: 'éléphant',
    intro: 'Voici é, avec son accent qui monte. Il fait le son [é]. Comme au début de «éléphant» ! Écoute : «mé», «ré», «lé» !' },
  { id: 's', show: 's', gpcs: ['s>s', 'ss>s'], ph: 's', kind: 'longue', anchor: 'soleil',
    intro: 'Voici la lettre s, comme un petit serpent. Elle siffle [s]. Comme au début de «soleil» ! Écoute : «sa», «si», «so» !' },
  { id: 'e', show: 'e', gpcs: ['e>e'], ph: 'e', kind: 'voyelle', anchor: 'renard',
    intro: 'Voici la lettre e, sans accent. Elle fait le son [e], tout doux. On l\'entend dans «renard» : re… nard. Écoute : «le», «me», «re» !' },
  { id: 'f', show: 'f', gpcs: ['f>f', 'ff>f'], ph: 'f', kind: 'longue', anchor: 'fusée',
    intro: 'Voici la lettre f. Elle souffle [f], comme le vent. Comme au début de «fusée» ! Écoute : «fa», «fi», «fo» !' },
  { id: 'ch', show: 'ch', gpcs: ['ch>ch'], ph: 'ch', kind: 'complexe', anchor: 'chat',
    intro: 'Regarde : c et h, ensemble. Ils font UN seul son : [ch], comme quand on dit chut ! Comme au début de «chat» ! Écoute : «cha», «chi», «cho» !' },
  { id: 'v', show: 'v', gpcs: ['v>v'], ph: 'v', kind: 'longue', anchor: 'vélo',
    intro: 'Voici la lettre v. Elle vibre [v]. Comme au début de «vélo» ! Écoute : «va», «vi», «vo» ! Attention : f souffle, v vibre.' },
  { id: 'n', show: 'n', gpcs: ['n>n', 'nn>n'], ph: 'n', kind: 'longue', anchor: 'nuage',
    intro: 'Voici la lettre n, avec une seule bosse. Elle chante [n], dans le nez. Comme au début de «nuage» ! Écoute : «na», «ni», «no» ! Attention : m a deux bosses, n n\'en a qu\'une.' },
  { id: 'j', show: 'j', gpcs: ['j>j'], ph: 'j', kind: 'longue', anchor: 'jus',
    intro: 'Voici la lettre j. Elle fait [j]. Comme au début de «jus» ! Écoute : «ja», «ji», «jo» ! Attention : ch souffle, j vibre.' },
  { id: 'ou', show: 'ou', gpcs: ['ou>ou', 'où>ou', 'oû>ou'], ph: 'ou', kind: 'complexe', anchor: 'ours',
    intro: 'Regarde : o et u, ensemble. Ils font UN seul son : [ou], comme un loup qui chante. Comme au début de «ours» ! Écoute : «lou», «mou», «chou» !' },
  { id: 'p', show: 'p', gpcs: ['p>p', 'pp>p'], ph: 'p', kind: 'courte', anchor: 'pomme',
    intro: 'Voici la lettre p. Elle fait un petit bruit tout court : [p], comme une bulle qui éclate. Écoute : «pa», «pi», «po» ! Comme au début de «pomme» !' },
  { id: 't', show: 't', gpcs: ['t>t', 'tt>t'], ph: 't', kind: 'courte', anchor: 'tortue',
    intro: 'Voici la lettre t. Elle fait un petit bruit court : [t], comme une goutte qui tombe. Écoute : «ta», «ti», «to» ! Comme au début de «tortue» !' },
  { id: 'on', show: 'on', gpcs: ['on>on', 'om>on'], ph: 'on', kind: 'complexe', anchor: 'mouton',
    intro: 'Regarde : o et n, ensemble. Ils font UN seul son : [on]. Comme à la fin de «mouton» ! Écoute : «lon», «ron», «mon» !' },
  { id: 'd', show: 'd', gpcs: ['d>d', 'dd>d'], ph: 'd', kind: 'courte', anchor: 'dinosaure',
    intro: 'Voici la lettre d. Elle fait un petit bruit court : [d]. Écoute : «da», «di», «do» ! Comme au début de «dinosaure» ! Pose ta main sur ta gorge : avec d, elle vibre ; avec t, non.' },
  { id: 'an', show: 'an', gpcs: ['an>an', 'en>an', 'am>an', 'em>an'], ph: 'an', kind: 'complexe', anchor: 'enfant',
    intro: 'Regarde : a et n, ensemble. Ils font UN seul son : [an]. Comme au début de «enfant» ! Ce son s\'écrit aussi e, n. Écoute : «lan», «man», «ran» !' },
  { id: 'z', show: 'z', gpcs: ['z>z'], ph: 'z', kind: 'longue', anchor: 'zèbre',
    intro: 'Voici la lettre z. Elle bourdonne [z], comme une abeille. Comme au début de «zèbre» ! Écoute : «za», «zi», «zo» ! Attention : s siffle, z bourdonne.' },
  { id: 'b', show: 'b', gpcs: ['b>b', 'bb>b'], ph: 'b', kind: 'courte', anchor: 'ballon',
    intro: 'Voici la lettre b. Elle fait un petit bruit court : [b]. Écoute : «ba», «bi», «bo» ! Comme au début de «ballon» ! Attention : b a son ventre à droite, d a son ventre à gauche.' },
  { id: 'è', show: 'è', gpcs: ['è>è', 'ê>è', 'ë>è', 'e>è'], ph: 'è', kind: 'voyelle', anchor: 'chèvre',
    intro: 'Voici è, avec son accent qui descend. Il fait le son [è]. Comme dans «chèvre» ! On le trouve aussi avec un chapeau, ê, comme dans «fête», et parfois e tout seul, comme dans «mer».' },
  { id: 'k', show: 'c', gpcs: ['c>k', 'k>k', 'q>k', 'qu>k', 'cc>k'], ph: 'k', kind: 'courte', anchor: 'canard',
    intro: 'Le son [k] s\'écrit de plusieurs façons : c comme dans «canard», k comme dans «koala», et q, u comme dans «quatre». Écoute : «ca», «co», «cu» !' },
  { id: 'in', show: 'in', gpcs: ['in>in', 'im>in', 'ain>in', 'aim>in', 'ein>in', 'un>in', 'um>in', 'yn>in', 'ym>in'], ph: 'in', kind: 'complexe', anchor: 'lapin',
    intro: 'Regarde : i et n, ensemble. Ils font UN seul son : [in]. Comme à la fin de «lapin» ! Ce son s\'écrit aussi a, i, n comme dans «pain», et u, n comme dans «un».' },
  { id: 'g', show: 'g', gpcs: ['g>g', 'gu>g'], ph: 'g', kind: 'courte', anchor: 'gâteau',
    intro: 'Voici la lettre g. Devant a, o et u, elle fait [g]. Comme au début de «gâteau» ! Écoute : «ga», «go», «gu» ! Pour faire [g] devant e ou i, on écrit g, u : «guitare».' },
  { id: 'oi', show: 'oi', gpcs: ['oi>oi', 'oî>oi'], ph: 'oi', kind: 'complexe', anchor: 'roi',
    intro: 'Regarde : o et i, ensemble. Ils font le son [oi]. Comme dans «roi» ! Écoute : «moi», «toi», «loi» !' },
  { id: 'ai', show: 'ai', gpcs: ['ai>è', 'aî>è', 'ei>è'], ph: 'è', kind: 'complexe', anchor: 'lait',
    intro: 'Regarde : a et i, ensemble. Ils font le son [è]. Comme dans «lait» ! On l\'écrit aussi e, i, comme dans «reine».' },
  { id: 'eu', show: 'eu', gpcs: ['eu>eu', 'œu>eu'], ph: 'eu', kind: 'complexe', anchor: 'feu',
    intro: 'Regarde : e et u, ensemble. Ils font le son [eu]. Comme dans «feu» ! On le trouve aussi dans «cœur».' },
  { id: 'au', show: 'au', gpcs: ['au>o', 'eau>o'], ph: 'o', kind: 'complexe', anchor: 'bateau',
    intro: 'Regarde : a et u, ensemble. Ils font le son [o]. Comme dans «jaune» ! Et e, a, u font aussi [o], comme dans «bateau».' },
  { id: 'gn', show: 'gn', gpcs: ['gn>gn'], ph: 'gn', kind: 'complexe', anchor: 'montagne',
    intro: 'Regarde : g et n, ensemble. Ils font le son [gn]. Comme dans «montagne» ! Écoute : «gna», «gnon» !' },
  { id: 'c-s', show: 'ce ci ç', gpcs: ['c>s', 'ç>s'], ph: 's', kind: 'regle', anchor: 'citron',
    intro: 'Devant e, i et y, la lettre c siffle [s]. Comme au début de «citron» ! Avec une cédille, ç siffle toujours : «garçon».' },
  { id: 'g-j', show: 'ge gi', gpcs: ['g>j'], ph: 'j', kind: 'regle', anchor: 'girafe',
    intro: 'Devant e, i et y, la lettre g fait [j]. Comme au début de «girafe» ! Écoute : «page», «neige».' },
  { id: 's-z', show: 's = z', gpcs: ['s>z'], ph: 'z', kind: 'regle', anchor: 'maison',
    intro: 'Entre deux voyelles, la lettre s bourdonne [z]. Comme dans «maison» ! Écoute : «rose», «valise».' },
  { id: 'x', show: 'x', gpcs: ['x>ks', 'x>gz', 'x>s'], ph: 'ks', kind: 'regle', anchor: 'taxi',
    intro: 'Voici la lettre x. Le plus souvent, elle fait deux sons à la fois : [ks]. Comme dans «taxi» ! Dans «six» et «dix», elle siffle [s].' },
  { id: 'ill', show: 'ill', gpcs: ['ill>y', 'il>y', 'll>y', 'y>y', 'y>i'], ph: 'y', kind: 'complexe', anchor: 'papillon',
    intro: 'Regarde : i, l, l. Ensemble, ils font souvent le son [y]. Comme dans «papillon» ! On le trouve aussi dans «soleil», et avec la lettre y : «yoyo».' },
  { id: 'er', show: 'er ez', gpcs: ['er>é', 'ez>é', 'ed>é'], ph: 'é', kind: 'regle', anchor: 'panier',
    intro: 'À la fin d\'un mot, e, r et e, z font souvent le son [é]. Comme dans «panier» et dans «nez» !' },
  { id: 'ph', show: 'ph', gpcs: ['ph>f'], ph: 'f', kind: 'complexe', anchor: 'dauphin',
    intro: 'Regarde : p et h, ensemble. Ils font [f], comme la lettre f ! Comme dans «dauphin» et «éléphant».' },
  { id: 'w', show: 'w', gpcs: ['w>w', 'w>v'], ph: 'w', kind: 'regle', anchor: 'kiwi',
    intro: 'Voici la lettre w, qu\'on appelle double v. Dans «kiwi», elle fait [w]. Et la lettre h ? Elle ne fait aucun bruit : «hibou» !' },
];

/* Lexique illustré : [notation, émoji]. L'étape où chaque mot devient
   LISIBLE est calculée (toutes ses correspondances déjà apprises) ;
   avant, le mot sert aux jeux d'écoute, qui ne demandent pas de lire. */
export const LEXICON = [
  // animaux
  ['ch-a-t°', '🐱'], ['ch-i-en:in', '🐶'], ['l-a|p-in', '🐰'], ['l-i|on', '🦁'], ['l-ou-p°', '🐺'],
  ['ou-r-s', '🐻'], ['r-a-t°', '🐀'], ['s-ou|r-i-s°', '🐭'], ['v-a|ch-e°', '🐄'], ['ch-e|v-a-l', '🐴'],
  ['m-ou|t-on', '🐑'], ['c-o|ch-on', '🐷'], ['p-ou|l-e°', '🐔'], ['c-o-q', '🐓'], ['c-a|n-a-r-d°', '🦆'],
  ['p-oi|ss-on', '🐟'], ['b-a|l-ei|n-e°', '🐋'], ['r-e|qu-in', '🦈'], ['d-au|ph-in', '🐬'], ['c-r-a|b-e°', '🦀'],
  ['t-o-r|t-u-e°', '🐢'], ['l-é|z-a-r-d°', '🦎'], ['s-e:è-r|p-en-t°', '🐍'], ['z-è|b-r-e°', '🦓'], ['g:j-i|r-a|f-e°', '🦒'],
  ['é|l-é|ph-an-t°', '🐘'], ['s-in|g:j-e°', '🐒'], ['g-o|r-i-ll:y-e°', '🦍'], ['k-o|a|l-a', '🐨'], ['p-an|d-a', '🐼'],
  ['t-i|g-r-e°', '🐯'], ['r-e|n-a-r-d°', '🦊'], ['h°-i|b-ou', '🦉'], ['h°-é|r-i|ss-on', '🦔'], ['h°-a-m|s-t-e:è-r', '🐹'],
  ['ch-a|m-eau', '🐫'], ['ch-è|v-r-e°', '🐐'], ['c:s-y-gn-e°', '🦢'], ['a|b-e:è-ill-e°', '🐝'], ['p-a|p-i|ll:y-on', '🦋'],
  ['e:è-s|c-a-r|g-o-t°', '🐌'], ['g-r-e|n-ou-ill-e°', '🐸'], ['oi|s:z-eau', '🐦'], ['p-in|g-ou-in', '🐧'], ['k-an|g-ou|r-ou', '🦘'],
  ['c-r-o|c-o|d-i|l-e°', '🐊'], ['p-ou|ss-in', '🐤'], ['l-a|m-a', '🦙'], ['f-ou-r|m-i', '🐜'], ['a|r-ai|gn-é-e°', '🕷️'],
  ['p-ou-l|p-e°', '🐙'], ['é|c-u|r-eu-il', '🐿️'], ['h°-i|pp-o|p-o|t-a|m-e°', '🦛'], ['r-h°-i|n-o|c:s-é|r-o-s', '🦏'],
  ['l-ou|t-r-e°', '🦦'], ['m-ou-s|t-i|qu-e°', '🦟'], ['d-i|n-o|s:z-au|r-e°', '🦕'], ['d-r-a|g-on', '🐉'],
  // à manger
  ['a|n-a|n-a-s°', '🍍'], ['p-o|mm-e°', '🍎'], ['p-oi|r-e°', '🍐'], ['b-a|n-a|n-e°', '🍌'], ['c:s-i|t-r-on', '🍋'],
  ['o|r-an|g:j-e°', '🍊'], ['f-r-ai|s:z-e°', '🍓'], ['c:s-e|r-i|s:z-e°', '🍒'], ['r-ai|s:z-in', '🍇'], ['m-e|l-on', '🍈'],
  ['p-a-s|t-è|qu-e°', '🍉'], ['p-ê|ch-e°', '🍑'], ['k-i|w-i', '🥝'], ['c-a|r-o|tt-e°', '🥕'], ['t-o|m-a|t-e°', '🍅'],
  ['p-a|t-a|t-e°', '🥔'], ['p-ain', '🍞'], ['f-r-o|m-a|g:j-e°', '🧀'], ['l-ai-t°', '🥛'], ['œu-f', '🥚'],
  ['r-i-z°', '🍚'], ['s-e:è-l', '🧂'], ['m-i-e:è-l', '🍯'], ['g-â|t-eau', '🎂'], ['b-on|b-on', '🍬'],
  ['ch-o|c-o|l-a-t°', '🍫'], ['c-a|f-é', '☕'], ['f-r-i|t-e°', '🍟'], ['c-r-ê|p-e°', '🥞'], ['s-a|l-a|d-e°', '🥗'],
  ['s-ou|p-e°', '🍲'], ['j-u-s°', '🧃'], ['eau', '💧'], ['ch-ou', '🥬'], ['b-r-o|c-o|l-i', '🥦'],
  ['p-i|m-en-t°', '🌶️'], ['c-o|c-o', '🥥'], ['a|v-o|c-a-t°', '🥑'], ['ch-am|p-i|gn-on', '🍄'], ['b-i|b-e|r-on', '🍼'],
  ['m-a|ï-s', '🌽'], ['g-l-a|ç-on', '🧊'], ['g-l-a|c:s-e°', '🍦'], ['b-eu|rr-e°', '🧈'], ['c-o|qu-i|ll:y-a|g:j-e°', '🐚'],
  // objets, lieux, nature
  ['b-a|ll-on', '🎈'], ['m-o|t-o', '🏍️'], ['v-é|l-o', '🚲'], ['b-u-s', '🚌'], ['t-r-ain', '🚂'],
  ['a|v-i|on', '✈️'], ['b-a|t-eau', '⛵'], ['f-u|s:z-é-e°', '🚀'], ['v-oi|t-u|r-e°', '🚗'], ['c-a|m-i|on', '🚚'],
  ['t-a|x-i', '🚕'], ['r-o|b-o-t°', '🤖'], ['m-ai|s:z-on', '🏠'], ['é|c-o|l-e°', '🏫'], ['ch-â|t-eau', '🏰'],
  ['t-en|t-e°', '⛺'], ['l-u|n-e°', '🌙'], ['s-o|l-e:è-il', '☀️'], ['é|t-oi|l-e°', '⭐'], ['n-u|a|g:j-e°', '☁️'],
  ['n-ei|g:j-e°', '❄️'], ['f-eu', '🔥'], ['m-e:è-r', '🌊'], ['î-l-e°', '🏝️'], ['f-o|r-ê-t°', '🌲'],
  ['s-a|p-in', '🎄'], ['m-on|t-a|gn-e°', '⛰️'], ['v-o-l|c-an', '🌋'], ['f-l-eu-r', '🌸'], ['r-o|s:z-e°', '🌹'],
  ['t-u|l-i|p-e°', '🌷'], ['c-a-c|t-u-s', '🌵'], ['f-eu|ill-e°', '🍁'], ['a-r|b-r-e°', '🌳'], ['p-l-a|g:j-e°', '🏖️'],
  ['u|s:z-i|n-e°', '🏭'], ['t-ou-r|n-e|s-o-l', '🌻'], ['l-i-t°', '🛏️'], ['p-o-r|t-e°', '🚪'], ['ch-ai|s:z-e°', '🪑'],
  ['l-am|p-e°', '💡'], ['c-l-é', '🔑'], ['l-i|v-r-e°', '📖'], ['c-a|h°-i-er', '📓'], ['s-t-y|l-o', '🖊️'],
  ['c-r-a:è|y:y-on', '✏️'], ['c:s-i|s:z-eau-x°', '✂️'], ['r-è|g-l-e°', '📏'], ['s-a-c', '🎒'], ['v-a|l-i|s:z-e°', '🧳'],
  ['p-a|r-a|p-l-u-i-e°', '☂️'], ['ch-a|p-eau', '👒'], ['c-ou|r-o|nn-e°', '👑'], ['b-a|gu-e°', '💍'], ['l-u|n-e:è|tt-e°-s°', '👓'],
  ['r-o|b-e°', '👗'], ['ch-au|ss-u|r-e°', '👞'], ['ch-au|ss-e:è|tt-e°', '🧦'], ['c-a|d-eau', '🎁'], ['b-ou|g:j-i-e°', '🕯️'],
  ['gu-i|t-a|r-e°', '🎸'], ['t-am|b-ou-r', '🥁'], ['p-i|a|n-o', '🎹'], ['v-i|o|l-on', '🎻'], ['t-r-om|p-e:è|tt-e°', '🎺'],
  ['s-a|x-o|ph-o|n-e°', '🎷'], ['m-u|s:z-i|qu-e°', '🎵'], ['ph-o|t-o', '📷'], ['t-é|l-é|ph-o|n-e°', '☎️'],
  ['h°-é|l-i|c-o-p|t-è|r-e°', '🚁'], ['m-a-r|t-eau', '🔨'], ['v-i-s', '🔩'], ['l-ou|p-e°', '🔍'], ['b-oî|t-e°', '📦'],
  ['p-i|l-e°', '🔋'], ['l-e:è|tt-r-e°', '✉️'], ['p-a|g:j-e°', '📄'], ['p-a|n-i-er', '🧺'], ['s-a|v-on', '🧼'],
  ['b-a|l-ai', '🧹'], ['é|p-on|g:j-e°', '🧽'], ['c-l-o|ch-e°', '🔔'], ['d-r-a|p-eau', '🚩'], ['c-ou|t-eau', '🔪'],
  ['f-ou-r|ch-e:è|tt-e°', '🍴'], ['b-o-l', '🥣'], ['t-r-o|tt-i|n-e:è|tt-e°', '🛴'], ['p-a|t-in', '⛸️'], ['s-k-i', '🎿'],
  ['y:y-o|y:y-o', '🪀'], ['d-é', '🎲'], ['n-ou|n-ou-r-s°', '🧸'], ['f-i-l', '🧵'], ['f-u|m-é-e°', '💨'],
  ['s-o|f-a', '🛋️'], ['j-eu', '🎮'], ['j-u|d-o', '🥋'], ['b-o|x-e°', '🥊'], ['f-ê|t-e°', '🎉'],
  ['c:s-i-r|qu-e°', '🎪'], ['m-é|d-a-ill-e°', '🏅'], ['c-ou|p-e°', '🏆'], ['d-an|s-e°', '💃'], ['r-a|d-i|o', '📻'],
  ['t-é|l-é', '📺'], ['é|p-é-e°', '🗡️'], ['h°-ô|p-i|t-a-l', '🏥'], ['r-ou|t-e°', '🛣️'],
  // les gens, le corps, les émotions
  ['b-é|b-é', '👶'], ['m-a|m-an', '👩'], ['p-a|p-a', '👨'], ['p-a|p-i', '👴'], ['m-a|m-i-e°', '👵'],
  ['r-oi', '🤴'], ['r-ei|n-e°', '👸'], ['f-é-e°', '🧚'], ['f-i-ll:y-e°', '👧'], ['g-a-r|ç-on', '👦'],
  ['en|f-an-t°', '🧒'], ['p-i|r-a|t-e°', '🏴‍☠️'], ['p-o|l-i|c:s-e°', '👮'], ['c-l-ow:ou-n', '🤡'], ['f-an|t-ô|m-e°', '👻'],
  ['s-o-r|c:s-i|è-r-e°', '🧙'], ['m-ain', '✋'], ['n-ez', '👃'], ['b-ou|ch-e°', '👄'], ['p-i-ed:é', '🦶'],
  ['d-en-t°', '🦷'], ['c-œu-r', '❤️'], ['j-am|b-e°', '🦵'], ['p-ou|c:s-e°', '👍'], ['b-r-a-s°', '💪'],
  ['o-s', '🦴'], ['r-i|r-e°', '😂'], ['d-o|d-o', '😴'], ['b-i|s:z-ou', '😘'], ['c-â|l-in', '🤗'],
  ['f-â|ch-é', '😠'],
  // nombres et couleurs
  ['z-é|r-o', '0️⃣'], ['un', '1️⃣'], ['d-eu-x°', '2️⃣'], ['t-r-oi-s°', '3️⃣'], ['qu-a|t-r-e°', '4️⃣'],
  ['c:s-in-q', '5️⃣'], ['s-i-x:s', '6️⃣'], ['s-e:è-p°-t', '7️⃣'], ['h°-u-i-t', '8️⃣'], ['n-eu-f', '9️⃣'],
  ['d-i-x:s', '🔟'], ['b-l-eu', '🔵'], ['r-ou|g:j-e°', '🔴'], ['v-e:è-r-t°', '🟢'], ['j-au|n-e°', '🟡'],
  ['n-oi-r', '⚫'], ['b-l-an-c°', '⚪'],
];

/* Mots-outils : très fréquents, appris comme des mots entiers à partir
   de l'étape indiquée (même s'ils contiennent un son pas encore vu). */
export const TOOL_WORDS = [
  { seg: 'a', step: 'a' }, { seg: 'à', step: 'a' }, { seg: 'l-a', step: 'l' }, { seg: 'i-l', step: 'l' },
  { seg: 'l-e', step: 'e' }, { seg: 'l-e:é-s°', step: 'e' }, { seg: 's-u-r', step: 's' },
  { seg: 'un', step: 'n' }, { seg: 'u|n-e°', step: 'n' }, { seg: 'e:é-t°', step: 't' },
  { seg: 'e:è-s°-t°', step: 't' }, { seg: 'd-e', step: 'd' }, { seg: 'd-e:é-s°', step: 'd' },
  { seg: 'd-u', step: 'd' }, { seg: 'd-an-s°', step: 'an' }, { seg: 'e:è-ll-e°', step: 'è' },
  { seg: 'au', step: 'au' }, { seg: 'a|v-e:è-c', step: 'k' },
];

/* Phrases : lire, puis choisir l'image (une seule correspond exactement :
   les autres changent UN détail, il faut donc lire chaque mot). */
export const SENTENCES = [
  { words: ['l-e', 'ch-a-t°', 'd-o-r-t°'], pic: '🐱😴', alt: ['🐶😴', '🐱🍽️'] },
  { words: ['p-a|p-a', 'l-i-t°', 'un', 'l-i|v-r-e°'], pic: '👨📖', alt: ['👩📖', '👨⚽'] },
  { words: ['l-a', 'v-a|ch-e°', 'e:è-s°-t°', 'd-an-s°', 'l-e', 'p-r-é'], pic: '🐄🌿', alt: ['🐄🏠', '🐴🌿'] },
  { words: ['l-e', 'b-é|b-é', 'a', 'un', 'b-a|ll-on'], pic: '👶🎈', alt: ['👶🧸', '👧🎈'] },
  { words: ['l-a', 't-o-r|t-u-e°', 'e:è-s°-t°', 's-u-r', 'l-e', 's-a|b-l-e°'], pic: '🐢🏖️', alt: ['🐢🌊', '🦀🏖️'] },
  { words: ['l-e', 'l-a|p-in', 'a', 'u|n-e°', 'c-a|r-o|tt-e°'], pic: '🐰🥕', alt: ['🐰🍎', '🐭🥕'] },
  { words: ['l-e', 'l-ou-p°', 'a', 'f-aim'], pic: '🐺🍽️', alt: ['🐺😴', '🦊🍽️'] },
  { words: ['l-e', 'r-oi', 'a', 'u|n-e°', 'c-ou|r-o|nn-e°'], pic: '🤴👑', alt: ['👸👑', '🤴🗡️'] },
  { words: ['p-a|p-i', 'f-ai-t°', 'd-u', 'v-é|l-o'], pic: '👴🚲', alt: ['👴🚗', '👦🚲'] },
  { words: ['m-a|m-an', 'a', 'un', 'ch-a|p-eau'], pic: '👩👒', alt: ['👩👓', '👨👒'] },
  { words: ['m-a|m-i-e°', 'a', 'un', 'g-â|t-eau'], pic: '👵🎂', alt: ['👴🎂', '👵🎁'] },
  { words: ['l-e', 's-in|g:j-e°', 'a', 'u|n-e°', 'b-a|n-a|n-e°'], pic: '🐒🍌', alt: ['🐒🍎', '🐯🍌'] },
  { words: ['l-e', 'p-oi|ss-on', 'n-a|g:j-e°'], pic: '🐟🌊', alt: ['🐢🌊', '🦆🌊'] },
  { words: ['l-a', 'r-ei|n-e°', 'm-an|g:j-e°', 'u|n-e°', 'p-o|mm-e°'], pic: '👸🍎', alt: ['👸🍌', '🤴🍎'] },
  { words: ['l-a', 'f-u|s:z-é-e°', 'v-a', 's-u-r', 'l-a', 'l-u|n-e°'], pic: '🚀🌙', alt: ['🚀☀️', '✈️🌙'] },
  { words: ['i-l', 'p-l-eu-t°', 's-u-r', 'l-a', 'm-ai|s:z-on'], pic: '🌧️🏠', alt: ['☀️🏠', '🌧️🌳'] },
];

/* Lettres qui se ressemblent (à l'œil ou à l'oreille) : on les fait
   travailler ENSEMBLE, c'est la distinction qui est difficile. */
export const CONFUSABLE = {
  b: ['d', 'p'], d: ['b', 't'], p: ['b', 'q', 't'], q: ['p'], t: ['d', 'f'],
  m: ['n'], n: ['m', 'u'], u: ['n', 'ou'], f: ['v', 't'], v: ['f'],
  s: ['z', 'ch'], z: ['s'], ch: ['j', 's'], j: ['ch', 'g'], g: ['k', 'j'], c: ['g', 'k'], k: ['g', 'c'],
  l: ['i', 'r'], r: ['l'], i: ['l', 'é'], a: ['o', 'e'], o: ['a', 'ou'], e: ['é', 'è'], 'é': ['è', 'e'], 'è': ['é', 'e'],
  ou: ['u', 'on', 'au'], on: ['an', 'ou', 'in'], an: ['on', 'in'], in: ['an', 'on'], oi: ['on', 'ou'],
  eu: ['ou', 'au'], au: ['ou', 'eu'], ai: ['oi', 'au'], gn: ['n', 'g'], ph: ['f', 'p'],
};
