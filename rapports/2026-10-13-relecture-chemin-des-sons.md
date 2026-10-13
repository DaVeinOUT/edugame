# EDUCA — Relecture orthophonique du chemin des sons (66 étapes)

Date : 2026-10-13 · Relecture : `educa-orthophoniste` (dyslexie-dysorthographie, rééducation de la lecture, méthodes syllabiques explicites ; repères CSEN / Dehaene, guide « Pour enseigner la lecture et l'écriture au CP »).
Objet : `js/data/curriculum.js` (STEPS, SECTIONS, LEXICON, TOOL_WORDS, SENTENCES, CONFUSABLE), lu avec ce que l'enfant voit et entend : `js/core/seg.js`, `js/core/curriculum.js`, `js/core/questions.js`, `js/core/session.js`, `js/activities/{intro,choice,build,common}.js`, `js/services/{voice,phonemes}.js`, `js/data/{sounds,wordaudio}.js`, `js/ui/{word,caption,cards}.js`.
Sources retenues : `rapports/2026-10-12-pedagogie-sources.md` (DHS 2012, Kalulu 2025, Goigoux 2016, guide orange). Aucun fichier du dépôt n'a été modifié, sauf ce rapport.

## Méthode et légende

- Lecture de chaque étape, de chaque mot (notation, sons, syllabes, lettres muettes, émoji), de chaque mot-outil et de chaque phrase, puis rejeu « dans la tête » d'un enfant dyslexique de 5-7 ans : ce qu'il voit (mot coloré, boutons, sous-titres), ce qu'il entend (voix humaine pour les mots, sons enregistrés ou synthétisés, synthèse vocale pour les consignes).
- Contrôles automatiques refaits hors dépôt (scripts dans le dossier temporaire, modules du jeu importés tels quels) : étape de lecture de chaque mot, homophones entre mots, syllabes dites par l'aide, sons jouables, simulation de 6 280 questions « Touche le mot », 10 520 questions « syllabe », toutes les questions « son → lettre » et « Constructeur ».
- **BLOQUANT** : l'exercice enseigne une erreur, a deux bonnes réponses, une réponse attendue fausse, est muet, ou se réussit sans la compétence visée. **IMPORTANT** : gêne réelle pour un enfant dyslexique (charge, confusion évitable, consigne ou image ambiguë). **MINEUR** : confort, cohérence, style.
- Chaque constat donne : où, le problème, la correction prête à copier (données complètes ou code), le fondement.

---

## A. Défauts systématiques confirmés par les contrôles (moteur des exercices et voix)

Ces défauts ne se voient pas en lisant `curriculum.js` : ils naissent de la façon dont les données sont transformées en exercices. Ils touchent toutes les étapes et passent avant les corrections de contenu.

### A1 · BLOQUANT — Les sous-titres écrivent la réponse (5 types d'exercices sur 7)

**Où** : `js/services/voice.js` (`seq` sous-titre toute la séquence : `caption(captionOf(parts))`, mots et sons compris ; `say` et `sound` sous-titrent aussi), `js/activities/choice.js` (`speakPrompt` → `voice.seq(q.prompt)` ; boutons 🔊), `js/activities/build.js` (`voice.seq(q.prompt)`, « Écoute bien : {mot} »). Sous-titres actifs par défaut (`schema.js` : `captions: true`), obligatoires en mode silencieux.

**Problème** : pendant la question, l'enfant lit sous les boutons « Touche la lettre qui fait le son « m ». », « Touche la syllabe ma. », « Touche le mot les. », « Écris le mot pomme. », « Est-ce que tu entends le son « t » dans lit ? ». Il suffit d'apparier la forme écrite du sous-titre au bouton : le Constructeur devient une copie, « son → lettre », « syllabe » et « Touche le mot » se font sans l'oreille, et « tu entends [t] dans lit ? » devient une recherche visuelle de lettre (piégée par les muettes). Un enfant dyslexique, qui compense justement par l'appariement visuel, réussit sans la compétence visée ; l'Élo, les étoiles et le test de positionnement (items « son ») surestiment. Les champs `caption` prévus dans `questions.js` (« Touche la syllabe que tu entends. ») ne sont jamais utilisés.

**Correction** :

1. `js/services/voice.js` — un sous-titre imposé quand on le veut :
```js
async function say(text, opts = {}) {
  // …
  if (!opts.noCaption) caption(opts.caption ?? text);
  // …
}

async function sound(ph, { noCaption = false, caption: shown } = {}) {
  const myGen = st.gen;
  if (!noCaption) caption(shown ?? `« ${ph} »`);
  // …
}

async function seq(parts, { interrupt = true, caption: shown } = {}) {
  if (interrupt) stop();
  const myGen = st.gen;
  caption(shown ?? captionOf(parts));   // pendant une question : le sous-titre ne donne pas la réponse
  // …
}
```
2. `js/activities/choice.js` — `await voice.seq(q.prompt, { caption: q.caption });` dans `speakPrompt` ; boutons 🔊 : `voice.sound(q.ph, { caption: '🔊' })` et `voice.say(q.answer, { slowWord: true, caption: '🔊' })`.
3. `js/activities/build.js` — `voice.seq(q.prompt, { caption: q.caption })` (lecture et « Réécouter ») ; 🔊 : `voice.say(word.text, { slowWord: true, caption: '🔊' })` ; tuile fausse : `voice.seq(['Écoute bien :', { word: word.text }, '.'], { caption: 'Écoute bien.' })`.
4. `js/core/questions.js` — sous-titres sans la réponse :
```js
// soundQuestion
caption: `Touche ${what} ce son.`,
// listenQuestion, mode « initial »
caption: 'Quel mot commence par ce son ?',
// listenQuestion, mode « contains »
caption: 'Tu entends ce son dans ce mot ?',
// buildQuestion
caption: 'Écris le mot que tu entends.',
```
5. Mode silencieux ou appareil sans voix : ces cinq exercices ne peuvent pas se faire à l'oreille. Les retirer du plan (`planLesson`, `planPractice` : ne garder que `read` et `sentence`) plutôt que de les laisser devenir de la copie. La correction affichée après une erreur (`comfort`) peut, elle, montrer la réponse.

**Fondement** : une tâche de discrimination auditive ou d'encodage doit passer par l'oreille ; DHS 2012 P3 (encodage) ; guide orange : dictée de mots décodables, pas copie.

### A2 · BLOQUANT — « Touche le mot que tu entends » propose deux mots qui se disent pareil

**Où** : `hearwordQuestion` (`js/core/questions.js`) : pièges = mêmes premières lettres, puis longueur voisine, sans regarder la prononciation.

**Problème** : simulation sur les mots nouveaux de chaque étape : **143 questions sur 6 280** ont deux réponses identiques à l'oreille : `a`/`à` (étape 0 : dès la toute première leçon, 2 questions sur une dizaine, choix « a » et « à » seulement), `des`/`dé`, `mais`/`mes`, `lait`/`les`, `et`/`est`. Paires présentes dans les données : homophones stricts `a`/`à`, `il`/`île`, `des`/`dé`, `dans`/`dent`, `ce`/`se` ; quasi-homophones `et`/`est`, `les`/`lait`, `mes`/`mais`, `je`/`jeu`, `de`/`deux` (é/è et e/eu ne se distinguent pas chez beaucoup d'enfants, ni dans le Midi, ni en créole). En entraînement (`ctx.open` = étape la plus avancée), toutes ces paires deviennent possibles. L'enfant qui a bien entendu est compté faux une fois sur deux, dès sa première séance.

**Correction** (`js/core/questions.js`) :
```js
/* Deux mots qui se disent pareil (a / à, des / dé, dans / dent) ou presque
   (et / est, les / lait, je / jeu) ne vont jamais ensemble : l'oreille ne peut pas choisir. */
const earKey = parsed => parsed.graphemes.filter(g => !g.mute).map(g => g.p).join('.')
  .replace(/è/g, 'é').replace(/eu/g, 'e');

function hearwordQuestion(item, cur, ctx) {
  const target = item.text;
  const upTo = Math.max(ctx.open ?? item.step, item.step);
  const all = [...cur.tools, ...cur.words];
  const key = earKey(all.find(w => w.text === target).parsed);
  const pool = all.filter(w => w.step <= upTo && w.text !== target && earKey(w.parsed) !== key);
  // … suite inchangée (same, near, others)
}
```
et, dans `itemsForStep` (`js/core/session.js`), pas de « Touche le mot » tant qu'il n'y a pas trois mots lisibles (sinon une question à un seul choix) :
```js
const readable = [...cur.tools, ...cur.words].filter(w => w.step <= s).length;
const heard = readable < 3 ? [] : [...cur.newToolsAt(s), ...words.slice(0, 3)]
  .filter((w, i, list) => list.findIndex(x => x.text === w.text) === i)   // « un » est à la fois mot-outil et mot illustré
  .map(w => ({ kind: 'hearword', key: `hw:${w.text}`, step: s, text: w.text, guess: 1 / 3 }));
```
Test à ajouter : pour toute question « hearword » générée, aucune option n'a la même `earKey` que la réponse.

**Fondement** : une discrimination auditive n'a de sens qu'entre formes sonores différentes ; et/est, a/à, ce/se se distinguent par le sens et l'orthographe, jamais par l'oreille (ce sont des homophones grammaticaux, travaillés plus tard par la morphologie).

### A3 · BLOQUANT — « Est-ce que tu entends le son… ? » : réponses attendues fausses

**Où** : `buildCurriculum` (`js/core/curriculum.js`) : `phonemes` = lectures des graphèmes ; `listenQuestion` (`js/core/questions.js`) tire le « non » dans `withoutSound(ph)`.

**Problème** : `oi`, `oin`, `ui`, `ien`, `x` sont chacun UN « phonème » dans les données, alors que l'oreille entend [w]+[a], [w]+[in], [ɥ]+[i], [j]+[in], [k]+[s]. Résultat : « Est-ce que tu entends le son [a] dans «poisson» ? » attend **non**, et Kaya corrige l'enfant qui a bien entendu : « Écoute bien : dans «poisson», on n'entend pas le son [a]. » Mots touchés : poire, voiture, étoile, roi, trois, noir, poisson, boîte, oiseau (pour [a] et [w]), parapluie et huit (pour [i]), chien (pour [in]), taxi, boxe, saxophone (pour [k] et [s]). Même défaut avec des sons trop proches pour un « non » franc : [e] est joué par la synthèse « eu » (`SOUND_TTS.e`), le même son que [eu] (« eux ») : « tu entends [e] dans «feu» ? » → non attendu ; « tu entends [é] dans «balai» / «lait» ? » → non attendu, mais beaucoup d'enfants disent [bale], [le] ; « tu entends [y] dans «lion», «piano», «chien» ? » → non attendu, alors qu'on y entend un [y] (yod). À l'étape w, [w] est joué « oua » : « tu entends [w] dans «roi» ? » → non attendu, alors que « roi » contient exactement « oua ».

**Correction** :

1. `js/core/curriculum.js` — l'oreille entend les parties des sons composés :
```js
/* Sons composés : l'oreille entend aussi leurs parties (« roi » = [r][w][a]).
   « Tu entends [a] dans roi ? » → oui. */
const HEARD_PARTS = Object.freeze({ oi: ['w', 'a'], oin: ['w', 'in'], ui: ['u', 'i'], ien: ['y', 'in'], ks: ['k', 's'], gz: ['g', 'z'] });
// dans buildCurriculum, objet « words » :
      phonemes: new Set(sounded.flatMap(g => [g.p, ...(HEARD_PARTS[g.p] || [])])),
```
2. `js/core/questions.js` — pas de « non » avec un son voisin instable :
```js
/* Sons qu'on ne peut pas trancher à l'oreille : é/è et e/eu changent selon les régions
   (et Kaya dit [e] comme [eu]) ; [y] s'entend dans « lion ». Un mot qui contient le
   voisin ne sert jamais de « non ». */
const BLURRY = Object.freeze({ 'é': ['è'], 'è': ['é'], e: ['eu'], eu: ['e'], i: ['y'], y: ['i'] });

function listenQuestion(item, cur, ctx) {
  const { rand } = ctx;
  const ph = item.ph;
  const blurry = BLURRY[ph] || [];
  const starters = cur.startingWith(ph);
  const without = cur.withoutSound(ph).filter(w => !blurry.some(n => w.phonemes.has(n)));
  // … suite inchangée (elle utilise déjà « without »)
}
```
3. Tests à ajouter (`tests/unit/curriculum.test.mjs`) : `cur.withSound('a')` contient « roi » et « poisson » ; `cur.withSound('s')` contient « taxi » ; `cur.withSound('i')` contient « parapluie ».

**Fondement** : conscience phonémique = ce que l'oreille entend, pas ce que la notation regroupe (Éduscol, repères de progressivité p.17 ; NRP/Ehri 2001) ; une correction fausse installe l'erreur qu'on veut éviter (DHS P3 : « bonne » et « mauvaise » erreur).

### A4 · BLOQUANT — Syllabes : pièges qui se disent pareil, lettres jamais vues, non-syllabes

**Où** : `syllableDistractors` (`js/core/questions.js`).

**Problème** : simulation : **762 questions sur 10 520** proposent une syllabe qui se dit exactement comme la bonne : `ca`/`ka`, `co`/`ko`, `cu`/`ku`, `cou`/`kou`, `coi`/`koi`, `can`/`kan`, `cau`/`kau` (dès l'étape c, où « ka » est montré alors que k n'est pas appris), toutes les syllabes de l'étape k, `cai`/`kai`, `zau`/`zo`, `zai`/`zè` (et `mau`/`mo`, `mai`/`mè` en révision). À l'étape k, « ci », « cé », « ce » sont proposés comme pièges de « ki », « ké », « ke » : pour un enfant qui ne connaît encore que c = [k], ce sont les mêmes syllabes. En outre, **262 cas distincts** (syllabe, étape) montrent une lettre pas encore apprise : « za », « cha » à l'étape s, « va », « ta » à l'étape f, « ja » à l'étape ch, « ba » à l'étape d, « na » à l'étape m, « ra » à l'étape l… et des suites qui ne sont pas des syllabes : « ia », « ii », « ua », « iou », « uou ». Causes : le filtre `twinC.filter(t => knownSyl.has(t) || twinC.length)` est toujours vrai (`|| twinC.length`) ; les jumelles viennent de toute la table CONFUSABLE (voyelles comprises : l → i donne « ia ») ; aucun contrôle de prononciation ; pour une syllabe inversée (« al »), l'inversion calculée est la syllabe elle-même (le drapeau `reverse` n'est pas transmis), donc le piège « la » n'est jamais proposé ; et l'inversion de « no », « ni », « nu », « na » donne « on », « in », « un », « an », des sons nasals, que `explain` présente à tort comme une erreur de sens (« Attention au sens »).

**Correction** (`js/core/questions.js`, remplace `syllableDistractors`) :
```js
/* Son d'une syllabe du parcours : « ka » et « ca » → « k.a ». */
const sylSound = x => (x.reverse ? [...x.gpcs].reverse() : x.gpcs).map(g => g.split('>')[1]).join('.');

/* Pièges : l'inversion (ma / am), la consonne jumelle (ma / na), puis d'autres syllabes
   DÉJÀ lues. Jamais une lettre pas encore vue, jamais une syllabe qui se dit pareil
   (ca / ka, mo / mau), jamais un son nasal pris pour une inversion (no / on). */
function syllableDistractors(item, cur, upTo, rand) {
  const { c, v } = item;
  const last = Math.max(upTo, item.step);
  const known = new Map(cur.steps.filter(s => s.index <= last)
    .flatMap(s => cur.syllablesFor(s.index)).map(x => [x.text, sylSound(x)]));
  const target = known.get(item.text);
  const graphemes = new Set(cur.steps.filter(s => s.index <= last).flatMap(s => s.gpcs.map(g => g.split('>')[0])));
  const flip = c && v && c.length === 1 && v.length === 1 ? (item.text === c + v ? v + c : c + v) : null;
  const flips = flip && !graphemes.has(flip) ? [flip] : [];
  const twins = (cur.confusable[c] || []).map(x => x + v);
  const own = cur.syllablesFor(item.step).map(x => x.text);
  const pool = [...flips, ...shuffle(twins, rand), ...shuffle(own, rand), ...shuffle([...known.keys()], rand)];
  return [...new Set(pool)].filter(t => t !== item.text
    && (flips.includes(t) || (known.has(t) && known.get(t) !== target)));
}
```
Test à ajouter : pour toute question « syllabe » générée jusqu'à l'étape n, chaque option est une syllabe de `syllablesFor(≤ n)` (ou l'inversion) et aucune n'a le même `sylSound` que la réponse.

**Fondement** : on ne montre que du décodable (CSEN 2022 ; Kalulu p.20 ; checklist DOIT 1 du rapport de sources) ; un piège homophone rend l'item impossible.

### A5 · BLOQUANT — Des sons muets ou faux : [ui], [ien] (silence), [oin] (« coin »), [ks] (épelé), [w] (« oua »)

**Où** : `voice.sound()` (`js/services/voice.js`) : fichier enregistré (11 voyelles), sinon son synthétisé (consonnes de `phonemes.js`), sinon synthèse vocale `SOUND_TTS`.

**Problème** :
- `ui` et `ien` n'ont ni fichier, ni recette, ni entrée `SOUND_TTS` : **silence**. Aux étapes ui (40) et ien (52), l'intro dit « Ils se disent vite, d'un seul coup : … » puis rien ; « Touche les lettres qui font le son [ui] » est muet ; l'aide du Constructeur (« Le son qui vient, c'est… ») aussi. Le test actuel vérifie seulement qu'un `[son]` figure dans l'intro, pas qu'il est jouable.
- `oin` est joué par la synthèse « coin » : l'enfant entend [k] dans « le son [oin] », puis le mot «coin».
- `ks` est confié à la synthèse « ks » : une suite de consonnes est épelée par les moteurs (« ka-èss ») — le nom des lettres, exactement ce qu'il faut éviter.
- `w` est joué « oua » ([wa]) : « Dans «kiwi», elle fait [w] » fait entendre [wa], absent de « kiwi ».
- `e` (« eu ») et `eu` (« eux ») sont rendus par le même son : voir A3 et A8.

**Correction** :
1. `js/services/voice.js` :
```js
const SOUND_TTS = {
  a: 'a', i: 'i', o: 'o', u: 'u', ou: 'ou', e: 'eu', 'é': 'é', 'è': 'è', eu: 'eux',
  on: 'on', an: 'an', in: 'hein', oi: 'oie', oin: 'ouin', ui: 'hui', ien: 'ien',
  m: 'mmmm', n: 'nnnn', l: 'llll', r: 'rrrr', s: 'ssss', z: 'zzzz', f: 'ffff', v: 'vvvv',
  ch: 'chhhh', j: 'jjjj', p: 'pe', b: 'be', t: 'te', d: 'de', k: 'ke', g: 'gue',
  gn: 'gne', y: 'ye', w: 'ou',
};
```
(« ouin », « hui » : la synthèse les lit [wɛ̃], [ɥi] ; « ien » est à vérifier à l'oreille sur 2 appareils ; [w] approché par un [u] bref, sans voyelle ajoutée.)
2. `js/services/phonemes.js` — [ks] fabriqué comme les autres consonnes (un petit bruit sec puis un sifflement), dans `RECIPES` :
```js
  ks: (c, o, t) => { const d = burst(c, o, t, { type: 'bandpass', freq: 2000 }); hiss(c, o, t + d, 0.5, S); return d + 0.5; },
```
et retirer `ks`/`gz` de `SOUND_TTS`.
3. Enregistrer avec la même voix (Lingua Libre ou espace des grands) : [e], [eu], [ui], [ien], [oin] ; pistes pour `scripts/voix-libre.mjs` (`VOWEL_SOUNDS`) : `{ ph: 'ui', file: 'ui', words: ['huis'] }`, `{ ph: 'oin', file: 'oin', words: ['oint'] }`.
4. Test à ajouter : chaque `ph` d'étape et chaque son des intros est jouable (`SOUND_FILES[ph] || canSynth(ph) || SOUND_TTS[ph]`, en exportant `SOUND_TTS`).

**Fondement** : sons purs, jamais le nom des lettres (DHS P5c ; rapport de sources §2 « Nom ou son ») ; une étape sans son ne peut pas s'apprendre.

### A6 · BLOQUANT — L'aide « Ce mot, c'est… » dit des syllabes fausses

**Où** : `spokenSyllables` (`js/core/seg.js`), utilisé par l'aide 💡 et la correction de « Lis le mot » (`choice.js`). Chaque syllabe est dite avec ses LETTRES : par la voix humaine si un mot du jeu s'écrit pareil (« son », « se », « le », « ne »), sinon par la synthèse.

**Problème** : l'aide de 67 mots change avec le correctif ; 21 sont dits faux à coup sûr aujourd'hui (s:z, e:è, a:è), une trentaine d'autres selon la façon dont la synthèse lit des bouts de mots (« ge », « llon », « mme », « tte », « pen », « lam »). Et cela précisément au moment où l'enfant bute :
- s:z (la règle de l'étape 49 est contredite) : « mai… **son** » (enregistrement du mot « son », [sɔ̃]) ; « frai… **se** », « ro… se », « chai… se », « va… li… se », « ce… ri… se » (enregistrement de « se », [sə]) ; « fu… **sée** », « rai… **sin** », « oi… **seau** », « ci… seau », « di… no… **sau** », « u… **si** … ne », « mu… si… que », « bi… **sou** » (synthèse : [s]).
- e:è (règle de l'étape 42 contredite) : « lu… **ne**… tte » et « tro… tti… **ne**… tte » (enregistrement de « ne », [nə]), « **le**… ttre » (enregistrement de « le »), « trom… **pe**… tte », « four… **che**… tte », « chau… **sse**… tte » ; « **cra**… yon » (a:è lu [a]).
- g:j, ll:y : « oran… **ge** », « sin… ge », « fro… ma… ge », « nei… ge », « pla… ge », « pa… ge », « é… pon… ge », « rou… ge », « nu… a… ge » (la synthèse peut dire « gé », le nom de la lettre) ; « pa… pi… **llon** », « co… qui… **lla**… ge » (« llon » peut être lu [lɔ̃]).
- Consonnes doubles en tête de syllabe : « po… **mme** », « ca… ro… **tte** », « beu… **rre** », « cou… ro… **nne** », « i… **ppo**… po… ta… me » : la synthèse lit ces suites de façon imprévisible.
- Nasales devant consonne muette ou m : « ser… **pen** », « pi… **men** », « **ten**… te », « **den** » (dent), « **lam**… pe », « **jam**… be », « **tam**… bour » (lus [pɛn], [mɛn], [lam]…).

**Correction** (`js/core/seg.js`, remplace `spokenSyllables` ; validée hors dépôt, tests existants verts) :
```js
/* Ce que la voix doit DIRE pour un graphème lu autrement que d'habitude
   (s:z, e:è, g:j, ll:y…) : on écrit le son, pas les lettres. */
const SAY_SOUND = Object.freeze({ z: 'z', 'è': 'è', 'é': 'é', j: 'j', s: 's', k: 'k', y: 'y', ou: 'ou', i: 'i', f: 'f' });
/* Nasales que la synthèse lirait de travers hors du mot (« lam » [lam], « pen » [pɛn]). */
const SAY_LETTERS = Object.freeze({ en: 'an', em: 'an', am: 'an', om: 'on', im: 'in', ym: 'in', um: 'in', aim: 'in' });

function sayGrapheme(x) {
  if (x.mute) return x.g;                                         // e muet gardé : « lu… ne »
  const g = x.g.toLowerCase();
  if (x.p !== DEFAULT_PHONEME[g]) return SAY_SOUND[x.p] ?? x.g;   // « mai… zon », « lu… nè… te »
  if (/^(.)\1$/.test(g)) return g[0];                             // tt → t : « ca… ro… te »
  return SAY_LETTERS[g] ?? x.g;                                   // « lan… pe », « ser… pan »
}

export function spokenSyllables(parsed) {
  const unusual = parsed.graphemes.some(x => !x.mute && x.p !== DEFAULT_PHONEME[x.g.toLowerCase()]);
  if (parsed.syllables.length === 1 && unusual) return [parsed.text];   // « six », « mer » : le mot entier, voix humaine
  return parsed.syllables
    .map(s => s.graphemes.filter(x => !x.mute || x.g === 'e').map(sayGrapheme).join(''))
    .filter(Boolean);
}
```
Tests à ajouter (`tests/unit/seg.test.mjs`) :
```js
assert.deepEqual(spokenSyllables(parseSeg('m-ai|s:z-on')), ['mai', 'zon']);
assert.deepEqual(spokenSyllables(parseSeg('l-u|n-e:è-tt-e°-s°')), ['lu', 'nète']);
assert.deepEqual(spokenSyllables(parseSeg('p-o|mm-e°')), ['po', 'me']);
assert.deepEqual(spokenSyllables(parseSeg('s-e:è-r|p-en-t°')), ['sèr', 'pan']);
assert.deepEqual(spokenSyllables(parseSeg('d-i-x:s')), ['dix']);
```
(la notation de « lunettes » utilisée ici est celle proposée en 1.2.) À terme : enregistrer les syllabes de l'aide avec la voix des mots.

**Fondement** : l'aide modèle l'assemblage syllabique (« lu… nè… te… lunettes ») ; si le modèle est faux, l'enfant apprend la mauvaise lecture (DHS P3 ; guide orange : la correction est un moment d'apprentissage).

### A7 · IMPORTANT — Constructeur : des tuiles « pièges » qui sont justes à l'oreille, et des tuiles jamais vues

**Où** : `buildQuestion` (`js/core/questions.js`) : pièges = jumelles de CONFUSABLE, sans regarder ni le son ni l'étape.

**Problème** : **119 mots** reçoivent une tuile qui fait le même son qu'une tuile attendue : « z » pour maison, fusée, rose, valise ; « k » pour canard, café, coq ; « in » pour pain, train, main ; « au » ou « o » pour eau, bateau, chapeau, gâteau ; « an » pour dent, tente, serpent ; « è » pour mer, sel, lunettes ; « j » pour girafe, orange, rouge ; « f » pour dauphin, photo ; « é », « ez » pour cahier, panier… L'enfant dysorthographique qui écrit exactement ce qu'il entend (« bato », « mézon ») voit sa tuile trembler et la question compter « avec aide » ou « faux » : une **bonne erreur** (phonologiquement juste) est traitée comme une mauvaise, sur des mots dont il n'a jamais appris l'orthographe. Par ailleurs les jumelles ne sont pas filtrées par l'étape : « lama » (étape m) peut proposer les tuiles « n » et « e », pas encore apprises.

**Correction** (`js/core/questions.js` ; ajouter `import { DEFAULT_PHONEME } from './seg.js';`) :
```js
/* Tuiles pièges : des graphèmes DÉJÀ appris qui font un AUTRE son. « z » pour « maison »,
   « in » pour « pain » seraient justes à l'oreille : l'enfant qui écrit ce qu'il entend
   ne doit pas être compté faux. */
function buildQuestion(item, cur, ctx) {
  const target = cur.word(item.text);
  const slots = target.parsed.graphemes.map(g => ({ g: g.g, mute: g.mute }));
  const sounded = target.parsed.graphemes.filter(g => !g.mute);
  const heard = new Set(sounded.map(g => g.p));
  const last = Math.max(ctx.open ?? item.step, item.step);
  const learned = new Set(cur.steps.filter(s => s.index <= last).map(s => s.show));
  const twins = [...new Set(sounded.flatMap(g => cur.confusable[g.g] || []))]
    .filter(g => !sounded.some(x => x.g === g) && learned.has(g) && !heard.has(DEFAULT_PHONEME[g]));
  const extra = shuffle(twins, ctx.rand).slice(0, sounded.length >= 4 ? 2 : 1);
  const tiles = shuffle([...sounded.map(g => g.g), ...extra], ctx.rand);
  return {
    word: target, slots, tiles,
    prompt: ['Écris le mot', { word: target.text }, '.'],
    caption: 'Écris le mot que tu entends.',
    options: tiles.map((t, i) => ({ id: `t${i}`, text: t })),
    answer: sounded.map(g => g.g).join('|'), guess: 0.1,
  };
}
```
Et dans `build.js`, quand la tuile touchée fait le bon son mais n'est pas la bonne graphie (cas qui reste possible avec les tuiles posées du mot lui-même), dire : « Oui, c'est bien ce son ! Dans ce mot, il s'écrit comme ça. » et montrer la tuile, sans compter faux.

**Fondement** : DHS 2012 P3 (« bonne » / « mauvaise » erreur) ; Kalulu p.20, 37 : n'écrire que du décodable ; pour l'enfant dysorthographique, l'orthographe lexicale s'apprend par la mémoire du mot, pas par essais-erreurs.

### A8 · IMPORTANT — « Son → lettre » : trop de jumelles à la fois, et deux sons identiques dans les choix

**Où** : `graphemeDistractors` (`js/core/questions.js`).

**Problème** : toutes les jumelles connues passent en tête : à l'étape b, en révision, « Touche la lettre qui fait le son [b] » propose b, d et p ensemble (jusqu'à 3 lettres-miroirs hors de l'étape-contraste). Face à trois formes-miroirs, l'enfant dyslexique devine : on mesure la confusion au lieu de l'apprendre, loin de la réussite visée autour de 4 sur 5. Par ailleurs [e] et [eu] sont joués avec le même son (A5) : « e » peut être proposé pour [eu] (et l'inverse) ; à l'étape w, « oi » ou « ou » peut être proposé pour [w].

**Correction** (`js/core/questions.js`) :
```js
/* Sons que la voix du jeu rend identiques : jamais ensemble dans les choix. */
const SAME_TO_EAR = Object.freeze({ e: ['eu'], eu: ['e'], w: ['oi', 'oin', 'ou'] });

function graphemeDistractors(target, cur, upTo, n, rand, maxTwins = 1) {
  const ph = cur.steps.find(s => s.show === target)?.ph;
  const alike = SAME_TO_EAR[ph] || [];
  const usable = cur.steps.filter(s => isLetterStep(s) && s.show !== target && s.ph !== ph && !alike.includes(s.ph));
  const letters = usable.map(s => s.show);
  const known = usable.filter(s => s.index <= upTo).map(s => s.show);
  const family = cur.confusable[target] || [];
  /* Une seule jumelle par question (b avec d, pas b avec d et p), sauf à l'étape-contraste. */
  const twins = shuffle(family.filter(g => known.includes(g)), rand).slice(0, maxTwins);
  const others = shuffle(known.filter(g => !family.includes(g)), rand);
  let out = [...twins, ...others];
  if (out.length < n) out = [...out, ...letters.filter(g => g !== target && !out.includes(g) && !family.includes(g))];
  return [...new Set(out)].slice(0, n);
}
```
et dans `soundQuestion` : `graphemeDistractors(target, cur, ctx.open ?? item.step, n - 1, ctx.rand, item.target ? 3 : 1)` (l'étape-contraste garde ses jumelles).

**Fondement** : DHS P1d (briser la symétrie par une étape-contraste, pas par une exposition massive) ; dosage = pratique clinique (apprentissage avec peu d'erreurs, réussite visée 4 sur 5).

### A9 · IMPORTANT — La syllabe « con » est proposée seule

**Où** : `syllablesFor` (`js/core/curriculum.js`) : l'étape on fabrique c + on = « con » (et l'étape k « kon », qui se dit pareil), dite seule par la synthèse dans « Touche la syllabe… ».

**Correction** :
```js
/* Syllabes jamais proposées seules : « con » (et « kon », qui se dit pareil) est une insulte. */
const AVOID = new Set(['con', 'kon']);
// dans syllablesFor, fonction add :
      if (AVOID.has(text) || out.some(x => x.text === text)) return;
```
**Fondement** : aucun mot inapproprié dans un jeu pour enfants ; les méthodes de classe évitent cette syllabe isolée.

### Validation des correctifs A2 à A9 (copie hors dépôt)

Les correctifs de `seg.js` (A6), `questions.js` (A1 sous-titres, A2, A3, A4, A7, A8), `curriculum.js` (A3, A9) et `session.js` (A2) ont été appliqués à une copie de `js/` et `tests/` dans le dossier temporaire (les parties de A1 et A5 dans `voice.js`, `phonemes.js`, `choice.js`, `build.js` demandent un navigateur et n'ont pas été rejouées) :
- 89 tests unitaires existants : verts ; 4 tests proposés ci-dessous : **rouges sur le code actuel, verts après correctifs** ;
- 49 080 questions générées (toutes les étapes, ouverture minimale et maximale) : aucune erreur, aucune question à moins de 2 choix ;
- simulations : « Touche le mot » 0 homophone sur 6 160 (au lieu de 143 sur 6 280) ; syllabes 0 homophone sur 10 440 (au lieu de 762), pièges limités aux syllabes déjà lues et aux inversions ; Constructeur 0 tuile homophone (au lieu de 119 mots) ; « son → lettre » au plus 1 jumelle hors étape-contraste ; « tu entends [e] » jamais de « non » avec un mot en « eu ».
- Restent à vérifier à l'oreille (synthèse) : « ouin », « hui », « ien », et les syllabes d'aide « man » (piment), « zeau » (oiseau).

Fichier de tests prêt à copier, `tests/unit/relecture-chemin.test.mjs` :
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as DATA from '../../js/data/curriculum.js';
import { buildCurriculum } from '../../js/core/curriculum.js';
import { parseSeg, spokenSyllables } from '../../js/core/seg.js';
import { makeQuestion } from '../../js/core/questions.js';
import { itemsForStep } from '../../js/core/session.js';
import { seededRandom } from '../../js/core/rng.js';

const cur = buildCurriculum(DATA);
const earKey = p => p.graphemes.filter(g => !g.mute).map(g => g.p).join('.').replace(/è/g, 'é').replace(/eu/g, 'e');
const sylSound = x => (x.reverse ? [...x.gpcs].reverse() : x.gpcs).map(g => g.split('>')[1]).join('.');

test('« Touche le mot » ne propose jamais deux mots qui se disent pareil', () => {
  const all = [...cur.tools, ...cur.words];
  for (let s = 0; s < cur.steps.length; s++) for (const it of itemsForStep(cur, s).hearword) for (let r = 0; r < 20; r++) {
    const q = makeQuestion(it, cur, { rand: seededRandom(r), open: cur.steps.length - 1 });
    const key = earKey(all.find(w => w.text === q.answer).parsed);
    for (const o of q.options.filter(o => o.id !== q.answer)) assert.notEqual(earKey(all.find(w => w.text === o.id).parsed), key, `${q.answer} / ${o.id}`);
  }
});

test('l\'oreille entend les parties des sons composés', () => {
  assert.ok(cur.withSound('a').some(w => w.text === 'roi'));
  assert.ok(cur.withSound('a').some(w => w.text === 'poisson'));
  assert.ok(cur.withSound('s').some(w => w.text === 'taxi'));
  assert.ok(cur.withSound('i').some(w => w.text === 'parapluie'));
});

test('les pièges de syllabes sont lisibles et ne se disent pas pareil', () => {
  for (let s = 0; s < cur.steps.length; s++) for (const it of itemsForStep(cur, s).syllable) for (let r = 0; r < 10; r++) {
    const q = makeQuestion(it, cur, { rand: seededRandom(r), open: s });
    const known = new Map(cur.steps.filter(x => x.index <= s).flatMap(x => cur.syllablesFor(x.index)).map(x => [x.text, sylSound(x)]));
    const flip = it.c.length === 1 && it.v.length === 1 ? (it.text === it.c + it.v ? it.v + it.c : it.c + it.v) : null;
    for (const o of q.options.filter(o => o.id !== q.answer)) {
      assert.ok(o.id === flip || known.has(o.id), `${o.id} pas encore appris (étape ${cur.steps[s].id})`);
      if (o.id !== flip) assert.notEqual(known.get(o.id), known.get(q.answer), `${q.answer} / ${o.id}`);
    }
  }
});

test('l\'aide dit les syllabes comme elles se prononcent', () => {
  assert.deepEqual(spokenSyllables(parseSeg('m-ai|s:z-on')), ['mai', 'zon']);
  assert.deepEqual(spokenSyllables(parseSeg('l-u|n-e:è-tt-e°-s°')), ['lu', 'nète']);
  assert.deepEqual(spokenSyllables(parseSeg('p-o|mm-e°')), ['po', 'me']);
  assert.deepEqual(spokenSyllables(parseSeg('s-e:è-r|p-en-t°')), ['sèr', 'pan']);
  assert.deepEqual(spokenSyllables(parseSeg('d-i-x:s')), ['dix']);
});
```

---

## 1. Lexique, mots-outils, phrases : ce que l'enfant décode

Les 259 mots du lexique, 32 mots-outils et 19 phrases ont été relus graphème par graphème. La notation est **juste dans l'immense majorité des cas** (lettres muettes, s:z, c:s, g:j, ll:y, e:è, ed:é, x:s, h muet, « a:è|y:y » de crayon, « eu-il » d'écureuil, « r-h° » de rhinocéros). Les écarts :

### 1.1 · BLOQUANT — « nounours » : le s final se prononce

`['n-ou|n-ou-r-s°', '🧸']` grise le s, alors qu'on dit [nunuʁs], comme « ours » (`['ou-r-s', '🐻']`, s prononcé, juste à côté dans le lexique). L'enfant apprend une lettre muette qui n'en est pas une, et deux mots de la même famille se lisent différemment. (Le mot n'a pas d'enregistrement humain : la synthèse dira [nunuʁs], en contradiction avec le gris.)

Correction : `['n-ou|n-ou-r-s', '🧸'],`

### 1.2 · IMPORTANT — e:è devant consonne double : la coloration sépare le e des consonnes qui le font [è]

Dans `'l-u|n-e:è|tt-e°-s°'`, la syllabe colorée « ne » est suivie d'une autre couleur « ttes » : l'enfant qui lit syllabe par syllabe lit « ne » [nə] (c'est ce qu'il a appris), alors que la règle de l'étape e-è (« devant deux consonnes, e se lit [è] ») ne se voit plus, les deux consonnes étant dans la couleur suivante. Même piège pour 7 notations ; « serpent », « escargot », « hamster », « mer », « sel » sont déjà bien découpés (syllabe fermée). Correction : la consonne double reste avec le e (syllabe orale fermée, comme « ser|pent ») :
```js
['l-u|n-e:è-tt-e°-s°', '👓'],
['ch-au|ss-e:è-tt-e°', '🧦'],
['t-r-om|p-e:è-tt-e°', '🎺'],
['f-ou-r|ch-e:è-tt-e°', '🍴'],
['t-r-o|tt-i|n-e:è-tt-e°', '🛴'],
['l-e:è-tt|r-e°', '✉️'],
```
et dans TOOL_WORDS : `{ seg: 'e:è-ll-e°' },` (au lieu de `'e:è|ll-e°'`, qui montre « e » seul, lu [ə]). Aucune étape de lecture ne change (mêmes correspondances).

### 1.3 · IMPORTANT — « maïs » à l'étape s : un tréma jamais expliqué, et le jumeau visuel de « mais »

`['m-a|ï-s', '🌽']` devient lisible à l'étape 9 (s), parmi les 4 premiers mots du chemin, avec un « ï » que rien n'explique (`ï>i` est rangé dans l'étape i sans un mot dans l'intro). Il ne diffère du mot-outil « mais » (étape 35, [mɛ]) que par deux points : piège visuel classique pour un enfant dyslexique. Correction : enseigner le tréma explicitement (voir 2.4) ; « maïs » devient lisible à l'étape ai (35), le jour où l'intro oppose « mais » et « maïs » (contraste explicite plutôt que rencontre fortuite, comme pour b/d/p/q). Ligne du lexique inchangée.

### 1.4 · MINEUR — « tournesol » contredit la règle s = [z] qui viendra

`'t-ou-r|n-e|s-o-l'` est juste ([s] : mot composé), mais c'est une exception à la règle de l'étape s-z (« entre deux voyelles, s bourdonne »). Ne pas le proposer en lecture dans la leçon s-z ni dans les 3 suivantes (révision seulement). Pas de changement de donnée.

### 1.5 · MINEUR — « clown » n'est jamais lisible

`'c-l-ow:ou-n'` demande `ow>ou`, jamais enseigné : le mot ne sert qu'aux jeux d'écoute. C'est cohérent ; à documenter dans le commentaire du lexique (« mot d'écoute seulement »), sinon le retirer.

### 1.6 · MINEUR — Mots dits par la synthèse (pas d'enregistrement humain)

35 mots du jeu n'ont pas de voix humaine : requin, panda, tigre, cygne, pingouin, fourmi, poulpe, écureuil, hippopotame, loutre, glaçon, tournesol, règle, trompette, lettre, page, panier, yoyo, nounours, boxe, télé, papi, mamie, dodo, câlin, me, mes, que, dort, pré, nage, mange, pleut, chats, dorment. Trois sont des mots d'appui d'intro (« panda » pour an, « trompette » pour om, « panier » pour er) : la voix change au milieu de la présentation du son. À ajouter à la prochaine collecte Lingua Libre (même locuteur ou voix de secours).

### 1.7 · MINEUR — Mots-outils utiles, décodables tôt, absents

« ma », « ta », « sa » (alors que « mon », « ton », « son » existent), « pas », « on », « ou », « ils » (employé dans l'intro de l'étape -ent) enrichiraient les phrases dès les premières étapes. À ajouter seulement avec le correctif A2 (sinon « ou »/« où », « au »/« eau » créeraient de nouveaux homophones) :
```js
{ seg: 'm-a' }, { seg: 't-a' }, { seg: 's-a' }, { seg: 'p-a-s°' }, { seg: 'on' }, { seg: 'ou' }, { seg: 'i-l-s°' },
```

---

## 2. Progression des 66 étapes

**Ce qui est solide** (à garder) : voyelles et consonnes qu'on prolonge d'abord, occlusives avant les nasales, une correspondance par étape, ~15 correspondances dans les 18 premières étapes, lettres muettes tôt (11), « un » en mot (16), b/d/p/q écartés (p 18, d 22, b 25, q 29) puis contrastés, nasales espacées (on 26, an 31, in 36), mêmes sons regroupés (an/en, in/ain), règles c/g/s après la valeur de base, doubles (41) juste avant e = è (42), mots-outils lisibles exactement quand ils deviennent décodables. Les corrections ci-dessous gardent 66 étapes et respectent les tests d'écartement existants.

### 2.1 · IMPORTANT — e (7) et é (8) sont voisins

Même lettre (seul l'accent change), sons proches pour une oreille fragile ([ə]/[e] : le/les, de/des, ce/ces sont les confusions les plus fréquentes des enfants dyslexiques). Deux leçons de suite installent la confusion au lieu de la distinction. Correction : intervertir **s** et **é** (une consonne entre les deux voyelles) : `… 6 m, 7 e, 8 s, 9 é, 10 ou …`. Effet : « se » et « sur » lisibles à l'étape 8 (mettre à jour le tableau du test « mots-outils » : `se: 8, sur: 8`).

### 2.2 · IMPORTANT — « es » (27) et « est » (28) sont voisins

Deux « mots spéciaux » qui ne diffèrent que d'un t, avec des sons voisins ([é]/[è]) que beaucoup d'enfants ne distinguent pas : à apprendre à distance, chacun bien installé. Correction : `… 26 on, 27 es, 28 qu, 29 bdpq, 30 est, 31 an …` (les tests b/qu ≥ 3 et « contraste après q » restent verts). Effet : « que » lisible à 28, « est » à 30 ; la phrase « La tortue est sur le sable. » arrive à 30.

### 2.3 · IMPORTANT — Trois règles « la lettre change de son » de suite : c-s (47), g-j (48), s-z (49)

Pour un enfant dyslexique, trois leçons consécutives où une lettre connue se met à faire un autre son, c'est trois fois plus d'interférence (Kalulu les étale sur 4 semaines : S20, S23, S24). Correction : intercaler des étapes sans conflit : `47 c-s, 48 er, 49 g-j, 50 eau, 51 s-z, 52 et, 53 ien, 54 ent` (au lieu de `47 c-s, 48 g-j, 49 s-z, 50 er, 51 et, 52 ien, 53 ent, 54 eau`). Effet : « et » lisible à 52 (tableau du test : `et: 52`) ; phrases « Maman a un chapeau. », « Mamie a un gâteau. » à 50.

### 2.4 · IMPORTANT — Accents et tréma « connus » sans avoir été enseignés

`à>a`, `â>a` (étape a), `î>i`, `ï>i` (étape i), `ô>o` (étape o), `û>u`, `ù>u` (étape u) sont comptés comme appris dès les premières leçons, sans un mot dans les intros. Conséquences : « à » est un mot à lire dès la toute première leçon (et l'homophone de « a », voir A2), « île » (11), « maïs » (9) et « fâché » (13) arrivent avec des signes jamais expliqués. Le petit chapeau n'est expliqué qu'à l'étape è (« Avec un petit chapeau, ê fait aussi [è] »). Correction : ranger accents et chapeaux à l'étape è, et le tréma à l'étape ai, où il fait contraste avec « mais » :
```js
  { id: 'a', show: 'a', gpcs: ['a>a'], /* … */ },
  { id: 'i', show: 'i', gpcs: ['i>i'], /* … */ },
  { id: 'o', show: 'o', gpcs: ['o>o'], /* … */ },
  { id: 'u', show: 'u', gpcs: ['u>u'], /* … */ },
  { id: 'è', show: 'è', gpcs: ['è>è', 'ê>è', 'ë>è', 'à>a', 'â>a', 'î>i', 'ô>o', 'û>u', 'ù>u'], /* intro en 3.1 */ },
  { id: 'ai', show: 'ai', gpcs: ['ai>è', 'aî>è', 'ei>è', 'ï>i'], /* intro en 3.1 */ },
```
Effet : « à », « île », « fâché » lisibles à l'étape è ; « maïs » à l'étape ai, avec la règle (« deux points sur i : on entend a, puis i »).

### 2.5 · IMPORTANT — L'étape ay (62) vient avant y (64) : son mot d'appui n'y est pas lisible

« crayon » demande `y>y`, enseigné deux étapes plus tard : la leçon ay n'a **aucun** mot à lire, et son intro explique « a et y » avant que y ait été présenté. Correction : `… 61 ph, 62 y, 63 ay, 64 h, 65 w` (« crayon » devient lisible à sa propre étape ; « stylo », « cygne », « yoyo » à l'étape y).

### 2.6 · IMPORTANT — Étapes sans mot à lire : oin (39), ui (40, un seul mot), er (50, un seul)

À l'étape oin, aucun mot du lexique ne contient [oin] : ni lecture, ni Constructeur, ni jeu d'écoute (la leçon se remplit de révisions) ; « coin » et « loin » ne sont que dits. À l'étape ui, seul « parapluie » ; le mot d'appui « huit » n'est lisible qu'à l'étape h. À l'étape er, seul « panier ». Mots à ajouter au lexique (émojis uniques, décodables à l'étape visée, connus des 5-7 ans) :
```js
  ['p-oin-g°', '✊'], ['g-r-oin', '🐽'],                        // oin
  ['p-l-ui-e°', '🌧️'], ['n-ui-t°', '🌃'], ['c-ui|ll:y-è-r-e°', '🥄'],   // ui (cuillère : lisible à ill)
  ['p-om|p-i-er', '👨‍🚒'],                                        // er (déjà cité dans l'intro de om)
```
et mots d'appui : `anchor: 'poing'` (oin), `anchor: 'pluie'` (ui). Les étapes ien (chien), im (aucun mot ; « faim » dans une phrase) et ti (aucun mot) restent pauvres faute de mot imageable sans ambiguïté (« timbre », « potion ») : acceptable pour des graphies rares, à condition que leurs exemples soient affichés dans l'intro (3.6).

### 2.7 · MINEUR — Correspondances « apprises » qu'aucune intro n'enseigne et qu'aucun mot n'emploie

`ym>in`, `um>in`, `yn>in` (étape im : l'intro ne parle que de im et aim), `x>gz` (étape x), `w>v` (étape w). Une correspondance ne devrait compter comme apprise que si elle est enseignée. Correction :
```js
  { id: 'im', show: 'im', gpcs: ['im>in', 'aim>in'], /* … */ },
  { id: 'x', show: 'x', gpcs: ['x>ks', 'x>s'], /* … */ },
  { id: 'w', show: 'w', gpcs: ['w>w'], /* … */ },
```

### 2.8 · Ordre complet proposé (66 étapes)

```
0 a · 1 i · 2 l · 3 o · 4 r · 5 u · 6 m · 7 e · 8 s · 9 é · 10 ou · 11 muettes · 12 f · 13 ch · 14 v · 15 n · 16 un · 17 j
18 p · 19 t · 20 c · 21 oi · 22 d · 23 è · 24 g · 25 b · 26 on · 27 es · 28 qu · 29 bdpq · 30 est · 31 an · 32 en · 33 au · 34 k
35 ai · 36 in · 37 ain · 38 z · 39 oin · 40 ui · 41 doubles · 42 e-è · 43 eu · 44 am · 45 om · 46 im · 47 c-s · 48 er · 49 g-j
50 eau · 51 s-z · 52 et · 53 ien · 54 ent · 55 x · 56 gn · 57 ez · 58 ill · 59 œu · 60 ti · 61 ph · 62 y · 63 ay · 64 h · 65 w
```
SECTIONS inchangées (`[0], [10], [18], [31], [44]`). Tableau du test « mots-outils » à mettre à jour : `se: 8, sur: 8, que: 28, est: 30, et: 52` (les autres valeurs ne bougent pas).

---

## 3. Intros des étapes (dites par la synthèse vocale)

Les intros sont courtes, chaleureuses, avec un geste de bouche et un mot d'appui : la structure est bonne et doit rester la même d'une étape à l'autre (routine). Les `[sons]` sont joués à part (fichier ou son fabriqué), mais **le texte autour est lu par la synthèse, qui prononce une lettre isolée par son NOM**.

### 3.1 · IMPORTANT — La synthèse dit le nom des lettres, parfois en contradiction avec le son enseigné

« Voici la lettre l » est dit « la lettre **èl** » ; de même « èr », « èm », « ès », « èf », « vé », « èn », « ji », « pé », « té », « dé », « bé », « zèd ». Pire quand le nom contient un autre son que celui qu'on enseigne dans la même phrase : « Voici la lettre **cé**. Devant a, o et u, elle fait [k] » ; « la lettre **gé** … elle fait [g] » ; « [k], comme **cé** ! » (étapes qu et k) ; « **cé** et **ache** ensemble font [ch] » ; « **pé** et **ache** font [f], comme la lettre **èf** » ; « **gé** et **èn** font [gn] » ; « qu'un **èm** » (doubles) ; « on ne dit pas le **té** » (muettes, alors que t n'est appris qu'à l'étape 19). Les premières étapes sont justement celles où DHS (P5c) demande d'éviter absolument le nom des lettres (« f » = /fff/, pas /ef/). Pour les règles tardives (e-è, c-s, g-j, s-z, ez, -ent), nommer les lettres reste acceptable (épellation, guide orange).

Correction : ne jamais nommer une consonne avant qu'elle soit apprise et devenue familière ; dire « une nouvelle lettre », « ces deux lettres », ou son SON entre crochets ; ajouter le contraste sourde/sonore quand le jumeau est déjà connu (f/v, ch/j, t/d, p/b) et un repère de tracé pour b/d. Lignes complètes (champs inchangés recopiés ; `gpcs` modifiés selon la section 2) :
```js
  { id: 'a', show: 'a', gpcs: ['a>a'], ph: 'a', kind: 'voyelle', anchor: 'ananas',
    intro: 'Voici la lettre a. Elle fait le son [a]. Ouvre grand la bouche : [a] ! Comme au début de «ananas». Dis-le avec moi : [a] !' },
  { id: 'i', show: 'i', gpcs: ['i>i'], ph: 'i', kind: 'voyelle', anchor: 'île',
    intro: 'Voici la lettre i, avec son petit point. Elle fait le son [i], comme un sourire. Comme au début de «île». Dis-le avec moi : [i] !' },
  { id: 'l', show: 'l', gpcs: ['l>l'], ph: 'l', kind: 'longue', anchor: 'lion',
    intro: 'Voici une nouvelle lettre : un grand bâton, sans point. Elle chante [l], la langue en haut. Comme au début de «lion» ! Écoute : «la», «li» !' },
  { id: 'o', show: 'o', gpcs: ['o>o'], ph: 'o', kind: 'voyelle', anchor: 'os',
    intro: 'Voici la lettre o, toute ronde, comme ta bouche : [o] ! Comme dans «os». Avec [l], ça fait «lo» !' },
  { id: 'r', show: 'r', gpcs: ['r>r'], ph: 'r', kind: 'longue', anchor: 'robot',
    intro: 'Voici une nouvelle lettre. Elle gronde tout doucement, au fond de la gorge : [r]. Comme au début de «robot» ! Écoute : «ra», «ri», «ro» !' },
  { id: 'u', show: 'u', gpcs: ['u>u'], ph: 'u', kind: 'voyelle', anchor: 'usine',
    intro: 'Voici la lettre u. Dis [i], puis avance les lèvres comme pour un bisou : [u] ! Comme au début de «usine» ! Écoute : «lu», «ru» !' },
  { id: 'm', show: 'm', gpcs: ['m>m'], ph: 'm', kind: 'longue', anchor: 'moto',
    intro: 'Voici une nouvelle lettre, avec deux bosses. Elle chante [m], la bouche fermée. Comme au début de «moto» ! Écoute : «ma», «mi», «mo» !' },
  { id: 'e', show: 'e', gpcs: ['e>e'], ph: 'e', kind: 'voyelle', anchor: 'renard',
    intro: 'Voici la lettre e, sans accent. Elle fait le son [e], tout doux. On l\'entend dans «renard» : re… nard. Écoute : «le», «me» !' },
  { id: 's', show: 's', gpcs: ['s>s'], ph: 's', kind: 'longue', anchor: 'soleil',
    intro: 'Voici une nouvelle lettre, comme un petit serpent. Elle siffle [s]. Comme au début de «soleil» ! Écoute : «sa», «si», «so» !' },
  { id: 'é', show: 'é', gpcs: ['é>é'], ph: 'é', kind: 'voyelle', anchor: 'éléphant',
    intro: 'Voici é, avec son accent qui monte : [é], comme dans «bébé» ! On l\'entend au début de «éléphant». Écoute : «mé», «ré», «lé» !' },
  { id: 'muettes', show: 'lettres muettes', gpcs: ['°'], ph: null, kind: 'regle', anchor: 'lit',
    intro: 'Certaines lettres ne font aucun bruit : ce sont les lettres muettes. Dans le jeu, elles sont en gris. Regarde «lit» : la dernière lettre est grise, on ne la dit pas ! Quand une lettre est grise, tu ne la dis pas.' },
  { id: 'f', show: 'f', gpcs: ['f>f'], ph: 'f', kind: 'longue', anchor: 'fusée',
    intro: 'Voici une nouvelle lettre. Elle souffle [f], comme le vent : les dents du haut sur la lèvre du bas. Comme au début de «fusée» ! Écoute : «fa», «fi», «fo» !' },
  { id: 'ch', show: 'ch', gpcs: ['ch>ch'], ph: 'ch', kind: 'complexe', anchor: 'chat',
    intro: 'Regarde : ces deux lettres, ensemble, font UN seul son : [ch], comme quand on dit «chut» ! Comme au début de «chat» ! Écoute : «cha», «chi», «cho» !' },
  { id: 'v', show: 'v', gpcs: ['v>v'], ph: 'v', kind: 'longue', anchor: 'vélo',
    intro: 'Voici une nouvelle lettre. Elle vibre [v] : pose ta main sur ta gorge, ça chatouille ! Avec [f], ça ne vibre pas. Comme au début de «vélo» ! Écoute : «va», «vi», «vo» !' },
  { id: 'n', show: 'n', gpcs: ['n>n'], ph: 'n', kind: 'longue', anchor: 'nuage',
    intro: 'Voici une nouvelle lettre, avec une seule bosse. Elle chante [n], la langue en haut, derrière les dents. Comme au début de «nuage» ! Écoute : «na», «ni», «no» !' },
  { id: 'j', show: 'j', gpcs: ['j>j'], ph: 'j', kind: 'longue', anchor: 'jus',
    intro: 'Voici une nouvelle lettre. Elle fait [j] : c\'est comme [ch], mais ta gorge vibre ! Comme au début de «jus» ! Écoute : «ja», «ji», «jo» !' },
  { id: 'p', show: 'p', gpcs: ['p>p'], ph: 'p', kind: 'courte', anchor: 'pomme',
    intro: 'Voici une nouvelle lettre. Elle fait un petit bruit tout court : [p], comme une bulle qui éclate. Écoute : «pa», «pi», «po» ! Comme au début de «pomme» !' },
  { id: 't', show: 't', gpcs: ['t>t'], ph: 't', kind: 'courte', anchor: 'tortue',
    intro: 'Voici une nouvelle lettre. Elle fait un petit bruit court : [t], comme une goutte qui tombe. Écoute : «ta», «ti», «to» ! Comme au début de «tortue» !' },
  { id: 'c', show: 'c', gpcs: ['c>k'], ph: 'k', kind: 'courte', anchor: 'canard',
    intro: 'Regarde cette lettre, ronde comme une bouche ouverte. Devant a, o et u, elle fait [k], un petit bruit au fond de la gorge. Comme au début de «canard» ! Écoute : «ca», «co», «cu» !' },
  { id: 'd', show: 'd', gpcs: ['d>d'], ph: 'd', kind: 'courte', anchor: 'dinosaure',
    intro: 'Voici une nouvelle lettre. Pour l\'écrire, on fait d\'abord le rond, puis la grande canne. Elle fait un petit bruit court : [d]. Comme au début de «dinosaure» ! Pose ta main sur ta gorge : avec [d], elle vibre ; avec [t], non.' },
  { id: 'è', show: 'è', gpcs: ['è>è', 'ê>è', 'ë>è', 'à>a', 'â>a', 'î>i', 'ô>o', 'û>u', 'ù>u'], ph: 'è', kind: 'voyelle', anchor: 'chèvre',
    intro: 'Voici è, avec son accent qui descend : [è], comme dans «chèvre» ! Avec un petit chapeau, ê fait aussi [è] : «fête». Sur a, i ou o, un accent ou un chapeau ne change pas le son : «à», «île», «gâteau».' },
  { id: 'g', show: 'g', gpcs: ['g>g', 'gu>g'], ph: 'g', kind: 'courte', anchor: 'gâteau',
    intro: 'Regarde cette lettre, avec sa queue qui descend. Devant a, o et u, elle fait [g]. Comme au début de «gâteau» ! Écoute : «ga», «go», «gu» ! Devant e ou i, on ajoute un u pour garder [g] : «guitare».' },
  { id: 'b', show: 'b', gpcs: ['b>b'], ph: 'b', kind: 'courte', anchor: 'ballon',
    intro: 'Voici une nouvelle lettre. Pour l\'écrire, on fait d\'abord la grande canne, puis le rond. Elle fait un petit bruit court : [b]. Comme au début de «ballon» ! Avec [b], ta gorge vibre ; avec [p], non.' },
  { id: 'on', show: 'on', gpcs: ['on>on'], ph: 'on', kind: 'complexe', anchor: 'mouton',
    intro: 'Regarde : ces deux lettres, ensemble, font UN seul son : [on], qui passe par le nez. Comme à la fin de «mouton» ! Écoute : «lon», «ron», «mon» !' },
  { id: 'es', show: 'es', gpcs: ['es>é'], ph: 'é', kind: 'mot', anchor: null, examples: ['l-es', 'd-es', 'm-es'],
    intro: 'Dans les petits mots «les», «des», «mes», la fin se lit [é]. Écoute : «les» !' },
  { id: 'qu', show: 'qu', gpcs: ['q>k', 'qu>k'], ph: 'k', kind: 'courte', anchor: 'quatre',
    intro: 'Regarde : ces deux lettres, ensemble, font [k], comme dans «canard» ! Comme au début de «quatre». Écoute : «qui», «que», «quoi» ! Dans «coq», on l\'entend aussi à la fin : [k].' },
  { id: 'an', show: 'an', gpcs: ['an>an'], ph: 'an', kind: 'complexe', anchor: 'panda',
    intro: 'Regarde : ces deux lettres, ensemble, font UN seul son : [an]. Comme dans «panda» et «maman» ! Écoute : «dans», «blanc» !' },
  { id: 'en', show: 'en', gpcs: ['en>an'], ph: 'an', kind: 'complexe', anchor: 'dent',
    intro: 'Le son [an] peut aussi s\'écrire comme ça ! Comme dans «dent» et «enfant».' },
  { id: 'k', show: 'k', gpcs: ['k>k'], ph: 'k', kind: 'courte', anchor: 'koala',
    intro: 'Voici une nouvelle lettre. Elle fait [k], comme au début de «canard» ! Elle est rare : on la trouve dans «koala» et «ski».' },
  { id: 'ai', show: 'ai', gpcs: ['ai>è', 'aî>è', 'ei>è', 'ï>i'], ph: 'è', kind: 'complexe', anchor: 'lait',
    intro: 'Regarde : a et i, ensemble. Ils font le son [è]. Comme dans «lait» ! On l\'écrit aussi e, i, comme dans «reine». Mais avec deux points sur le i, on entend a, puis i : «maïs».' },
  { id: 'in', show: 'in', gpcs: ['in>in'], ph: 'in', kind: 'complexe', anchor: 'lapin',
    intro: 'Regarde : ces deux lettres, ensemble, font UN seul son : [in]. Comme à la fin de «lapin» ! Écoute : «lin», «pin», «vin» !' },
  { id: 'ain', show: 'ain', gpcs: ['ain>in', 'ein>in'], ph: 'in', kind: 'complexe', anchor: 'pain',
    intro: 'Le son [in] peut aussi s\'écrire comme ça : «pain», «main», «train» !' },
  { id: 'z', show: 'z', gpcs: ['z>z'], ph: 'z', kind: 'longue', anchor: 'zèbre',
    intro: 'Voici une nouvelle lettre. Elle bourdonne [z], comme une abeille. Comme au début de «zèbre» ! Écoute : «za», «zi», «zo» ! Attention : [s] siffle, [z] bourdonne.' },
  { id: 'doubles', show: 'll tt mm', gpcs: ['ll>l', 'mm>m', 'nn>n', 'pp>p', 'tt>t', 'ff>f', 'rr>r', 'ss>s', 'cc>k', 'bb>b', 'dd>d'],
    ph: null, kind: 'regle', anchor: 'pomme',
    intro: 'Parfois, une lettre est écrite deux fois : «pomme», «ballon». Les deux lettres font UN seul son ! On lit «pomme» comme s\'il n\'y avait qu\'une seule lettre.' },
  { id: 'gn', show: 'gn', gpcs: ['gn>gn'], ph: 'gn', kind: 'complexe', anchor: 'montagne',
    intro: 'Regarde : ces deux lettres, ensemble, font le son [gn]. Comme dans «montagne» ! Écoute : «champignon», «araignée» !' },
  { id: 'ph', show: 'ph', gpcs: ['ph>f'], ph: 'f', kind: 'complexe', anchor: 'dauphin',
    intro: 'Regarde : ces deux lettres, ensemble, font [f], comme au début de «fusée» ! Comme dans «dauphin» et «éléphant».' },
  { id: 'h', show: 'h', gpcs: ['h>°'], ph: null, kind: 'regle', anchor: 'hibou',
    intro: 'Voici la lettre h. Toute seule, elle ne fait aucun bruit : «hibou» se dit «ibou» ! Mais avec c, elle fait [ch], et avec p, elle fait [f].' },
```
(Les intros de l'étape è et de l'étape ai portent aussi les changements de 2.4 ; « Écoute : «le», «me» » remplace « «le», «me», «re» », la synthèse lisant mal « re » isolé ; « «dans», «blanc» » remplace « «lan», «man», «ran» » : « man » peut être lu à l'anglaise.)

### 3.2 · IMPORTANT — Étape-contraste b d p q : q n'est pas décrit, et le repère gauche/droite est fragile

L'intro annonce « ces quatre lettres » mais n'en décrit que trois (q manque, et `examples` aussi) ; le repère « ventre à droite / à gauche / en haut » repose sur la latéralité, justement fragile chez beaucoup d'enfants dyslexiques. Le repère le plus sûr est l'ordre de ce qu'on voit (et trace) d'abord, de gauche à droite : canne puis rond = b, rond puis canne = d (DHS P1d : gestes d'écriture différents ; Kalulu p.14 : tracé). Correction :
```js
  { id: 'bdpq', show: 'b d p q', gpcs: [], ph: null, kind: 'contraste', anchor: null, examples: ['b-a', 'd-a', 'p-a', 'qu-a'],
    intro: 'Attention : ces quatre lettres se ressemblent ! Regarde ce qui vient d\'abord. La canne, puis le rond : [b]. Le rond, puis la canne : [d]. La canne qui descend, puis le rond : [p]. Le rond, puis la canne qui descend : [k], comme dans «quatre».' },
```
Les intros de d et de b (3.1) emploient déjà le même repère, pour qu'il soit familier le jour du contraste.

### 3.3 · IMPORTANT — Étape ill : l'exemple contredit la règle

« i, l, l ensemble font souvent le son [y], comme dans «papillon» » : or « papillon » est noté `p-a|p-i|ll:y-on`, où l'on entend [i] PUIS [y] ; si « ill » faisait seulement [y], on lirait « papyon ». La règle « ill = [y] » vaut après une voyelle (abeille, grenouille, feuille, médaille). Correction :
```js
  { id: 'ill', show: 'ill', gpcs: ['ill>y', 'il>y', 'll>y'], ph: 'y', kind: 'complexe', anchor: 'abeille',
    intro: 'Regarde : i, l, l, ensemble. Ils font le son [y], comme à la fin de «abeille» et de «grenouille» ! Dans «papillon» et «fille», on entend d\'abord [i], puis [y].' },
```

### 3.4 · IMPORTANT — Étape -ent : risque de sur-généralisation, et « personnes » faux

« Quand plusieurs personnes font quelque chose… » : la phrase de l'étape est « Les chats dorment » (des chats, pas des personnes). Surtout, l'enfant dyslexique qui vient d'apprendre « -ent muet » l'applique à « dent », « serpent », « piment », « enfant », déjà lus avec [an] : il faut poser la limite le jour même. Correction :
```js
  { id: 'ent', show: '-ent', gpcs: ['ent>°'], ph: null, kind: 'regle', anchor: null, examples: ['d-an-s-ent°'],
    intro: 'Quand ils sont plusieurs à faire quelque chose, le mot finit souvent par e, n, t, et ces lettres sont muettes ! «Ils dansent» : on dit «danse». Mais une «dent», ce n\'est pas une action : là, on entend [an].' },
```

### 3.5 · IMPORTANT — Mots d'appui à changer : lampe (💡), huit, et oin sans appui

- am : « lampe » est illustré par 💡, qu'un enfant appelle « ampoule » ou « idée » ; « tambour » 🥁 est univoque, et l'intro oublie « em ». 
- ui : « huit » n'est lisible qu'à l'étape h (et son h gris n'est pas encore expliqué) ; « pluie » (ajouté en 2.6) est lisible à l'étape ui. 
- oin : pas d'appui ; « poing » (ajouté en 2.6). L'intro est l'occasion de travailler l'inversion loin / lion, classique chez l'enfant dyslexique.
```js
  { id: 'oin', show: 'oin', gpcs: ['oin>oin'], ph: 'oin', kind: 'complexe', anchor: 'poing', examples: ['c-oin', 'l-oin'],
    intro: 'Regarde : ces trois lettres font le son [oin], comme dans «coin» et «poing» ! Attention à l\'ordre des lettres : «loin», ce n\'est pas «lion».' },
  { id: 'ui', show: 'ui', gpcs: ['ui>ui'], ph: 'ui', kind: 'complexe', anchor: 'pluie',
    intro: 'Regarde : u et i, ensemble. Ils se disent vite, d\'un seul coup : [ui]. Comme dans «pluie» et «huit» !' },
  { id: 'am', show: 'am em', gpcs: ['am>an', 'em>an'], ph: 'an', kind: 'regle', anchor: 'tambour',
    intro: 'Devant m, b et p, le son [an] s\'écrit avec un m : «tambour», «jambe». Avec e aussi : «temps».' },
  { id: 'er', show: 'er', gpcs: ['er>é'], ph: 'é', kind: 'complexe', anchor: 'panier',
    intro: 'À la fin d\'un mot, e et r font souvent le son [é]. Comme dans «panier» et «pompier» !' },
```

### 3.6 · MINEUR — Précisions d'articulation et d'images

- i et é ont le même repère « comme un sourire » : il ne les distingue pas (corrigé en 3.1 : é « comme dans bébé »).
- u : « la bouche en avant comme pour un bisou » vaut aussi pour [ou] ; le repère clinique « dis [i], puis avance les lèvres » distingue u de ou (corrigé en 3.1 ; utile aussi aux enfants créolophones, sans [y] dans leur langue).
- n : « dans le nez » vaut aussi pour m ; la place de la langue les distingue (corrigé en 3.1).
- Étapes sans mot d'appui (es, est, bdpq, oin, im, et, ent, ti) : les `examples` ne sont affichés nulle part (`intro.js` n'affiche que l'appui) ; afficher le premier exemple avec `wordEl` quand `anchor` est nul.
- Cartes de la collection (`js/ui/cards.js`) : « Le son lettres muettes », « Le son b d p q », « Le son e = è », et « comme dans « null » » pour les 8 étapes sans appui. Correction :
```js
    name: isLetterStep(s) ? `Le son ${s.show}` : `La règle ${s.show}`,
    desc: s.anchor ? `comme dans « ${s.anchor} »` : (s.examplesParsed[0] ? `comme dans « ${s.examplesParsed[0].text} »` : ''),
```
(avec `const isLetterStep = s => ['voyelle', 'longue', 'courte', 'complexe'].includes(s.kind) && !s.show.includes(' ');`).

---

## 4. Mots et émojis : l'enfant doit reconnaître l'image sans hésiter

Dans « Lis le mot, puis touche la bonne image », un enfant qui a bien lu mais ne reconnaît pas l'image est compté faux : c'est injuste et décourageant. La très grande majorité des 259 émojis est univoque pour un enfant de 5-7 ans (animaux, fruits, véhicules, corps, nombres). Le bouton 🔊 sous chaque image (qui dit son nom) compense en partie, mais pas pour un enfant qui ne pense pas à l'utiliser.

### 4.1 · IMPORTANT — Quatre images qui désignent autre chose

| Mot | Émoji | Ce que dit l'enfant | Correction |
|---|---|---|---|
| forêt | 🌲 | « sapin » (🎄 est déjà « sapin »), « arbre » (🌳) | `['f-o|r-ê-t°', '🌲🌳🌲'],` (plusieurs arbres = une forêt ; émoji toujours unique) |
| fumée | 💨 | « vent », « vite », « pet » | retirer `['f-u|m-é-e°', '💨'],` (aucun émoji de fumée univoque ; l'étape f garde fourmi, fil, sofa, fée) |
| pouce | 👍 | « super », « oui » : 👍 est aussi le bouton **oui** des jeux d'écoute | retirer `['p-ou|c:s-e°', '👍'],` |
| lampe | 💡 | « ampoule », « idée » ; c'était le mot d'appui de am | retirer `['l-am|p-e°', '💡'],` (appui : tambour, voir 3.5) |

Après ces retraits, relancer `npm run voix:fetch` puis `npm run voix:encode` : les fichiers `audio/mots/fumee.mp3`, `pouce.mp3`, `lampe.mp3` deviennent orphelins (le test « aucun fichier orphelin » le signale), et les mots ajoutés (2.6, 1.7) sont cherchés chez le même locuteur (le test « au plus 40 mots sans voix humaine » l'exige).

### 4.2 · IMPORTANT — 25 émojis récents ne s'affichent pas sur les appareils plus anciens

Aucune police d'émojis n'est embarquée : l'affichage dépend du système. Les émojis Unicode 11 (2018 : Android 9, iOS 12) et 12 (2019 : Android 10, iOS 13) apparaissent en carré vide sur les tablettes plus anciennes, fréquentes dans les écoles (et dans les contextes Haïti/Guyane visés par le projet). Or ce sont, entre autres, les **deux premiers mots lisibles du chemin** (lama 🦙, mur 🧱) et les mots d'appui de j (jus 🧃), au (jaune 🟡), en (dent 🦷), er (panier 🧺). Liste : Unicode 11 : 🦘 kangourou, 🦙 lama, 🦛 hippopotame, 🦟 moustique, 🧂 sel, 🧺 panier, 🧼 savon, 🧽 éponge, 🧹 balai, 🧳 valise, 🧸 nounours, 🧵 fil, 🦷 dent, 🦵 jambe, 🦶 pied, 🧱 mur, 🥬 chou, 🦢 cygne ; Unicode 12 : 🦦 loutre, 🧃 jus, 🧈 beurre, 🪑 chaise, 🪀 yoyo, 🟢 vert, 🟡 jaune.
Correction : embarquer les images des ~280 émojis du jeu (fichiers SVG ou PNG d'un jeu libre : Noto Emoji, licence Apache 2.0 ; ou Twemoji, CC BY 4.0), mises en cache hors ligne, affichées avec un texte alternatif ; à défaut, tester au démarrage si un émoji récent s'affiche (mesure sur un canvas) et, sinon, remplacer ces mots dans les exercices « image ». À vérifier sur la plus vieille tablette visée.

### 4.3 · MINEUR — Images à préciser ou mots peu connus

- `['s-o-r|c:s-i|è-r-e°', '🧙']` → `'🧙‍♀️'` (🧙 seul est souvent dessiné en vieux mage barbu).
- `['t-é|l-é|ph-o|n-e°', '☎️']` → `'📱'` (les enfants ne connaissent plus le téléphone à cadran).
- `blanc ⚪` sur fond clair (et `noir ⚫` en thème sombre) : ajouter un fin contour aux pastilles de couleur.
- À surveiller (garder, l'image se devine par élimination, et le 🔊 la nomme) : rire 😂 (« rigoler »), bras 💪 (« muscle »), enfant 🧒 (proche de 👦/👧), reine 👸 et roi 🤴 (« princesse », « prince »), café ☕, soupe 🍲, eau 💧 (« goutte »), chou 🥬 (« salade »), page 📄 (« feuille », alors que « feuille » est 🍁), poulpe 🐙 (« pieuvre »), mer 🌊 (« vague »), cirque 🎪, fourchette 🍴 (couteau et fourchette), épée 🗡️ (« couteau »), sofa 🛋️ (« canapé »), vis 🔩 (mot peu connu à 5 ans), patate (familier).
- Aucun mot inapproprié dans le lexique (hors la syllabe « con », A9).

---

## 5. Phrases

Les 19 phrases sont décodables à leur étape (vérifié : étape = maximum des étapes de leurs mots), courtes, avec des images qui ne changent qu'un détail. Un défaut, un manque :

### 5.1 · IMPORTANT — « Le roi a une couronne. » : deux images justes

L'émoji 🤴 (« prince ») porte une couronne dans tous les jeux d'émojis : l'image piège `🤴🗡️` montre donc aussi « un roi avec une couronne ». Un bon lecteur, littéral comme le sont souvent les enfants dyslexiques, hésite à juste titre. Correction (et la phrase arrive plus tôt, à l'étape oi, où les phrases manquent) :
```js
  { words: ['l-e', 'r-oi', 'a', 'u|n-e°', 'é|p-é-e°'], pic: '🤴🗡️', alt: ['👸🗡️', '🤴🎈'] },
```

### 5.2 · MINEUR — Aucune phrase avant l'étape 18

Avant « Papa lit un livre. » (18), l'enfant ne lit que des mots isolés, alors que dès l'étape n (15) il peut lire de vraies phrases. Deux phrases décodables tôt (vérifiées : étapes 15 et 16) :
```js
  { words: ['l-e', 'ch-a-t°', 'a', 'u|n-e°', 's-ou|r-i-s°'], pic: '🐱🐭', alt: ['🐶🐭', '🐱🧀'] },
  { words: ['m-a|m-i-e°', 'a', 'un', 'ch-a-t°'], pic: '👵🐱', alt: ['👴🐱', '👵🐶'] },
```
(« pré » dans « La vache est dans le pré. » est un mot de campagne, illustré par 🌿 : acceptable, l'image piège 🏠 se distingue nettement.)

---

## 6. Exercices générés : compléments

### 6.1 · IMPORTANT — Le positionnement place trop loin un enfant sur cinq environ

`placementItem` (`js/core/placement.js`) tire les mots à lire dans tout le palier (les 6 étapes jusqu'au point sondé). Un mot de la PREMIÈRE étape du palier ne prouve pas qu'on lit la dernière. Simulation sur le code actuel (200 parcours par niveau, l'enfant lit juste jusqu'à l'étape k) : placé au-delà de ce qu'il sait dans 4 cas sur 200 (k = 13), 12 (k = 19), **36 (k = 25)**, 14 (k = 31), 12 (k = 43), **52 (k = 49)**, 4 (k = 55). Placé trop loin, l'enfant (souvent un grand lecteur en difficulté) commence par des leçons qu'il ne peut pas déchiffrer. Correction :
```js
  const fresh = w => w.step <= s && !used.has(`rd:${w.text}`);
  /* Des mots du HAUT du palier : un mot de la première étape du palier ne prouve pas qu'on lit les suivantes. */
  const top = cur.words.filter(w => fresh(w) && w.step > s - 3);
  const words = top.length ? top : cur.words.filter(w => fresh(w) && w.step >= lo);
```
(à la place de `const words = cur.words.filter(w => w.step >= lo && w.step <= s && !used.has(...))`). Validé hors dépôt : 0 placement trop loin sur 200 parcours pour chaque niveau de 7 à 55 ; le test existant « un enfant qui lit jusqu'à l'étape 25 commence juste avant » passe avec l'ordre proposé en 2.8 (sans ce correctif, il échoue avec cet ordre : départ à 29).

### 6.2 · MINEUR — « Lis le mot » : le 🔊 sous les images parle avec la synthèse

`hear = o => voice.say(o.say)` (`choice.js`) n'utilise pas la voix humaine enregistrée. Correction : `hear = o => voice.say(o.say, { slowWord: true, caption: '🔊' })`.

### 6.3 · MINEUR — Petites incohérences

- « Touche le mot » à l'étape un : « un » est à la fois mot-outil et mot illustré, l'item est créé deux fois (corrigé par le filtre de A2).
- Syllabes : la correction « Attention au sens : on lit de gauche à droite ! » s'affiche pour toute chaîne inversée, y compris « on » pour « no » (son nasal, pas une inversion) ; corrigé par A4 (inversions nasales exclues).

### Validation d'ensemble des corrections de données (copie hors dépôt)

Toutes les corrections des sections 1 à 5 (ordre 2.8, `gpcs`, intros, mots d'appui, lexique, mots-outils, phrases) et les correctifs de code (A1 à A9, 6.1) ont été appliqués ensemble à la copie : 91 tests sur 93 verts, avec le tableau des mots-outils mis à jour (2.8) ; les 2 restants sont les tests audio, qui demandent de relancer `voix:fetch`/`voix:encode` (4.1). Contrôles : tous les sons des intros jouables (avec A5) ; appuis lisibles à leur étape (poing 39, pluie 40, tambour 44, panier 48, abeille 58, crayon 63) ; « à », « île », « fâché », « forêt » lisibles à l'étape è, « maïs » à l'étape ai ; 21 phrases, la première à l'étape 15 ; 0 homophone dans « Touche le mot » (6 600 questions) et les syllabes (10 440), 0 tuile homophone.

---

## 7. Synthèse

Le chemin des sons est **pédagogiquement solide dans sa conception** (ordre sourcé, une correspondance par étape, lettres muettes grisées, mots-outils décodables, contraste b/d/p/q, notation des mots juste à 99 %). Les défauts graves ne sont presque pas dans les données : ils naissent de la façon dont les exercices sont fabriqués et dits. Tels quels, plusieurs exercices **enseignent des erreurs** (réponses d'écoute fausses, aide syllabique fausse, sons muets) ou **se réussissent sans la compétence** (réponse écrite dans le sous-titre, homophones).

| Gravité | Nombre | Constats |
|---|---|---|
| BLOQUANT | 7 | A1 sous-titres qui donnent la réponse · A2 homophones dans « Touche le mot » (dès la 1re leçon : a/à) · A3 réponses d'écoute fausses (roi sans [a], taxi sans [s]…) · A4 syllabes homophones et lettres jamais vues · A5 sons muets ou faux ([ui], [ien], [oin], [ks], [w]) · A6 aide syllabique fausse (« mai… son ») · 1.1 « nounours » |
| IMPORTANT | 20 | A7 tuiles homophones · A8 trop de jumelles · A9 « con » · 1.2 e:è devant consonne double · 1.3 « maïs » · 2.1 e/é voisins · 2.2 es/est voisins · 2.3 c-g-s d'affilée · 2.4 accents non enseignés · 2.5 ay avant y · 2.6 étapes sans mot · 3.1 noms de lettres dits par la synthèse · 3.2 b d p q (q absent, gauche/droite) · 3.3 ill/papillon · 3.4 -ent · 3.5 mots d'appui · 4.1 quatre émojis trompeurs · 4.2 émojis récents invisibles · 5.1 phrase du roi · 6.1 positionnement trop généreux |
| MINEUR | 10 | 1.4 tournesol · 1.5 clown · 1.6 35 mots sans voix humaine · 1.7 mots-outils à ajouter · 2.7 correspondances non enseignées · 3.6 articulation, exemples, cartes « null » · 4.3 images à préciser · 5.2 phrases précoces · 6.2 🔊 en synthèse · 6.3 petites incohérences |

**Recommandations (par ordre de priorité)**

1. **Avant de proposer le chemin à des enfants, corriger le moteur des exercices (A1 à A6)** : sous-titres sans la réponse, aucun homophone dans les choix, sons composés entendus par leurs parties, sons [ui] [ien] [oin] [ks] [w] jouables, aide syllabique qui dit les sons et non les lettres. Les correctifs sont fournis, validés hors dépôt, avec 4 tests (rouges aujourd'hui, verts après).
2. **Ne jamais compter faux ce qui est juste à l'oreille** : Constructeur sans tuile homophone ni tuile non apprise (A7), une seule lettre-miroir par question hors étape-contraste (A8), positionnement par le haut du palier (6.1).
3. **Appliquer l'ordre 2.8 et compléter les étapes pauvres** : e et é séparés, es et est séparés, règles c/g/s espacées, y avant ay, accents et tréma enseignés, mots ajoutés pour oin, ui, er ; corriger « nounours » et les six mots en -ette/-ettre (1.1, 1.2).
4. **Réécrire les intros sans nom de lettre** (3.1 à 3.5, lignes complètes fournies), avec les contrastes sourde/sonore (f/v, ch/j, t/d, p/b) et le même repère de tracé pour b, d et l'étape-contraste.
5. **Fiabiliser l'écoute et l'image** : faire écouter par un adulte, sur deux appareils, les sons et syllabes synthétisés (« eu », « ouin », « hui », « ien », syllabes d'aide) et enregistrer ceux qui sonnent faux ; changer les quatre émojis trompeurs, la phrase du roi, et embarquer les émojis pour les tablettes anciennes (4.1, 4.2, 5.1).
