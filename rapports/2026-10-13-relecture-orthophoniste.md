# EDUCA — Relecture orthophonique des niveaux des grands (n3 → n6)

Date : 2026-10-13 · Relecture : `educa-orthophoniste` (troubles du langage écrit, dyslexie-dysorthographie ; programmes CP → 3e)
Objet : `js/data/levels.js` (4 niveaux, 40 modules + 4 contrôles, 727 questions), lu avec ce que l'enfant voit et entend (`js/activities/text.js`, `js/core/levels.js`, `js/activities/common.js`, `js/services/voice.js`).
Rapport relu : `rapports/2026-10-13-niveaux-ce1-3e.md` (§ 8 « points à valider »). Aucun fichier du dépôt n'a été modifié, sauf ce rapport.

## Méthode et légende

- Chaque item a été relu (consigne, choix, réponse, `explain`), puis rejoué « dans la tête » d'un enfant dyslexique : ce qu'il voit (boutons, trou, mots à toucher sans ponctuation), ce que Kaya lui dit (synthèse vocale pour les phrases), ce qu'il lit seul (textes).
- Contrôles automatiques refaits (script hors dépôt) : réponse présente dans les choix, mot à toucher unique, aucun mot interdit dans les retours (« non », « faux », « raté », « mauvais », « nul », « erreur », « faute ») : **tout est vert**. Les constats ci-dessous sont ceux qu'un script ne voit pas.
- **BLOQUANT** : réponse fausse, plusieurs réponses défendables, retour faux, ou défaut qui fausse l'exercice. **IMPORTANT** : gêne réelle pour un enfant dyslexique (forme fautive montrée, consigne ambiguë, contradiction entre ce qu'il entend et ce qu'on lui dit, terminologie hors programme). **MINEUR** : amélioration de confort ou de style.
- Repérage : `module #n` = n-ième item du module (à partir de 0, dans l'ordre du fichier), suivi du début du texte. Les corrections sont des lignes de données complètes, prêtes à copier (même format, apostrophe ’, « » avec espaces).

---

## 0. Constats transversaux (code d'affichage et voix)

### T1 · BLOQUANT — La bonne réponse est presque toujours le premier bouton

Les choix sont affichés dans l'ordre du fichier : ni `makeQuestion` (`js/core/levels.js`), ni `runChoose` (`js/activities/text.js`), ni `choiceGrid` (`js/activities/common.js`) ne les mélangent. Or la bonne réponse est en **première position dans 594 questions à choix sur 608** (n3 : 137/151 ; n4 : 151/151 ; n5 : 155/155 ; n6 : 151/151). Un enfant qui touche toujours le premier bouton réussit tous les modules et tous les contrôles ; la force de lecture (Élo), les étoiles et l'ouverture des niveaux ne mesurent plus rien. Un enfant dyslexique, qui cherche des indices de surface pour compenser, repère ce motif très vite. Et comme, dès 10 ans, le contrôle d'un niveau neuf est proposé en premier (`TEST_OUT_AGES`), un grand peut monter jusqu'au dernier niveau sans avoir rien appris.

Correction (une ligne, `shuffle` est déjà importé dans `text.js`) — dans `runChoose`, avant de construire la grille :

```js
const options = q.type === 'pick' ? q.options : shuffle(q.options, api.rand);   // jamais la réponse toujours au même endroit
const shown = { ...q, options };                                                // l'aide lit les choix dans l'ordre affiché
// puis : helpFor(shown, api) et choiceGrid(options.map(o => ({ ...o, text: typo(o.text), say: o.text })), …)
```

et un test dans `tests/unit/levels.test.mjs` (« la bonne réponse n'est pas toujours le premier choix affiché »). Ne pas mélanger les `pick` (les mots gardent l'ordre de la phrase).

### T2 · IMPORTANT — Dans les 4 contrôles, « 💡 Aide » ne rappelle aucune règle

Pour un `gap` ou un `pick`, l'aide lit `api.module.intro`. Dans un contrôle, c'est l'intro du contrôle : « Voici le contrôle : il mélange tout… Avec sept bonnes réponses sur dix… » (alors que l'écran d'accueil du contrôle n3 dit « il faut 12 bonnes réponses sur 17 »). L'enfant demande de l'aide, n'en reçoit pas, et la question compte « avec aide ».

Correction : ajouter aux items des contrôles un champ `rule` (copie de l'intro du module d'origine) et, dans `helpFor` : `const rule = q.item?.rule || (!api.module?.isControle && api.module?.intro);`. Exemple pour le premier item du contrôle n3 :

```js
{ type: 'gap', text: 'Ali ___ un vélo bleu.', choices: ['a', 'à'], answer: 'a', rule: 'Si tu peux dire « avait », écris « a » sans accent. Sinon, écris « à » avec l’accent.', explain: 'On peut dire « Ali avait un vélo bleu » : c’est le verbe avoir.' },
```

### T3 · IMPORTANT — La synthèse vocale prononce des terminaisons muettes

Les `explain` et les intros sont dits par la synthèse vocale. La terminaison écrite « -ent » est lue comme le son *an* : l'enfant **entend** « le verbe finit par *an*, qu'on n'entend pas » — contradiction directe, exactement la confusion qu'on travaille en séance (n3-verbe-sujet #9, n3-present #2 ; voir aussi les « er » / « ez » de n4). Règle d'écriture proposée : quand on parle de lettres muettes, les **épeler** (« les lettres e, n, t ») et donner un mot entier (« ils chantent »). Corrections au fil des niveaux.

### T4 · MINEUR — Les `explain` des items `order` ne sont jamais montrés

`runOrder` n'utilise pas `q.explain` (ni affiché, ni lu). Ces 40 explications sont perdues. Proposition : après la phrase reconstituée, si l'enfant a fait au moins une erreur, lire et afficher `q.explain` (comme pour les autres types).

### T5 · MINEUR — Trou collé à une apostrophe

Kaya lit la phrase à trou avec « … » à la place du trou : « j’… », « d’… » sont lus « ji », « dé » par la synthèse, et le trou collé à l'apostrophe se voit mal. Reformuler pour que le trou soit un mot entier (corrections au fil des niveaux).

### T6 · MINEUR — « Touche le mot » : la phrase n'est jamais affichée en entier

Pour un `pick`, l'enfant ne voit que des boutons-mots espacés, sans ponctuation (`tokens()` retire « » ? ! ,). Il perd les repères de la phrase écrite : guillemets du discours direct (« Je reviens vite », murmura Sami), point d'interrogation, virgule qui détache un complément. Proposition : afficher la phrase complète, en police de lecture, au-dessus des boutons (elle est déjà lue par Kaya).

---

## 1. Niveau n3 · CE1-CE2 · « Lire et comprendre »

Niveau globalement très solide : phrases courtes, textes de 4-5 phrases, procédés de substitution réguliers, aucune réponse fausse. Les points ci-dessous sont des ajustements.

### n3-phrase #8 · « Quelle est la forme négative de « Il pleut » ? » — IMPORTANT
Le choix « Il pleut pas. » est une forme fautive à l'écrit (le « ne » oublié de l'oral), montrée à l'enfant alors que la règle du projet est de n'en plus montrer ; et « Pleut-il ? » n'a rien de négatif.

```js
{ type: 'choice', text: 'Quelle est la forme négative de « Il pleut » ?', choices: ['Il ne pleut pas.', 'Il pleut fort.', 'Pleut-il ?'], answer: 'Il ne pleut pas.', explain: 'À la forme négative, « ne » et « pas » entourent le verbe : il ne pleut pas.' },
```

### n3-phrase #2 et #3 · « Le bus arrive à huit heures. Quel est le type de cette phrase ? » — IMPORTANT
La phrase à classer et la question forment un seul bloc qui finit par « ? » : « cette phrase » est ambiguë, et un enfant qui s'appuie sur la ponctuation finale répond « interrogative ».

```js
{ type: 'choice', text: 'Voici une phrase : « Le bus arrive à huit heures. » De quel type est-elle ?', choices: ['déclarative', 'interrogative', 'impérative'], answer: 'déclarative', explain: 'Elle donne une information et finit par un point : elle est déclarative.' },
{ type: 'choice', text: 'Voici une phrase : « Aimes-tu le chocolat ? » De quel type est-elle ?', choices: ['interrogative', 'déclarative', 'impérative'], answer: 'interrogative', explain: 'Elle pose une question et finit par un point d’interrogation : elle est interrogative.' },
```

### n3-homophones-on-son · intro — IMPORTANT
« Sinon, écris « on » ou « son » » ne dit pas comment choisir entre les deux, et les `explain` utilisent deux procédés (« il », « mon ») que l'intro n'annonce pas. Or l'aide des `gap` lit cette intro. Une règle par mot, en phrases parallèles très courtes :

```js
intro: 'Ils ont faim : on peut dire « avaient ». On joue : on peut dire « il ». Ils sont là : on peut dire « étaient ». Son vélo : on peut dire « mon ».',
```

(À plus long terme : deux paires dans un même module, c'est lourd pour un dysorthographique ; si les résultats sont faibles, séparer on/ont et son/sont.)

### n3-verbe-sujet #9 · « Les oiseaux ___ dans l’arbre. » — IMPORTANT (voir T3)

```js
{ type: 'gap', text: 'Les oiseaux ___ dans l’arbre.', choices: ['chante', 'chantent'], answer: 'chantent', explain: 'Le sujet « Les oiseaux » est au pluriel : le verbe prend les lettres e, n, t à la fin, ils chantent.' },
```

### n3-present #2 · « Ils ___ la télévision. » — IMPORTANT (voir T3)
Kaya dirait « finit par *an*, qu’on n’entend pas ».

```js
{ type: 'gap', text: 'Ils ___ la télévision.', choices: ['regardent', 'regarde', 'regardez'], answer: 'regardent', explain: 'Avec « ils », le verbe prend les lettres e, n, t à la fin, et on ne les entend pas : ils regardent.' },
```

### n3-groupe-nom #10 et #11 · « Qui est « petite » : le chat ou la souris ? » — MINEUR
« Qui est « petite » » est une tournure obscure ; pour « petite », le sens suffit (la souris est plus petite) et l'accord n'est pas travaillé ; pour « jolis », le sens attire vers « la fleur ».

```js
{ type: 'choice', text: 'Avec quel nom va l’adjectif « petite » ?', choices: ['la maison', 'le jardin'], answer: 'la maison', explain: '« petite » finit par un « e » : il va avec un nom féminin, la maison.' },
{ type: 'choice', text: 'Avec quel nom va l’adjectif « jolis » ?', choices: ['les oiseaux', 'la fleur'], answer: 'les oiseaux', explain: '« jolis » finit par un « s » : il va avec un nom au pluriel, les oiseaux.' },
```

### n3-present #13, question 3 · « Qui les enfants saluent-ils ? » — MINEUR
Interrogation complexe (sujet repris par « -ils ») : au CE1, beaucoup comprennent « Qui salue les enfants ? ».

```js
{ text: 'Qui est-ce que les enfants saluent ?', choices: ['le professeur', 'leurs parents', 'Ayaan'], answer: 'le professeur', explain: 'Le texte dit : « Les enfants saluent le professeur. »' },
```

### n3-comprendre #7 · « Quelle phrase pose une question ? » — MINEUR
« Tu viens jouer ? » et « Tu viens jouer. » ne diffèrent que par le signe final (petit, collé par l'espace insécable) : piège purement visuel au module le plus facile.

```js
{ type: 'choice', text: 'Quelle phrase pose une question ?', choices: ['Tu viens jouer ?', 'Je viens jouer.', 'Viens jouer.'], answer: 'Tu viens jouer ?', explain: 'Le point d’interrogation montre qu’on pose une question.' },
```

### n3-comprendre #13 · « … la même chose que « Le bébé dort » ? » — MINEUR
« Faire dodo » (« en langage de bébé ») peut vexer un enfant de 10-12 ans qui arrive à ce niveau.

```js
{ type: 'choice', text: 'Quelle phrase veut dire la même chose que « Le bébé dort » ?', choices: ['Le bébé est endormi.', 'Le bébé mange.', 'Le bébé pleure.'], answer: 'Le bébé est endormi.', explain: '« Il dort » et « il est endormi » veulent dire la même chose.' },
```

### n3-temps #5 · « Quand j’étais bébé, j’___ un doudou. » — MINEUR (voir T5)

```js
{ type: 'gap', text: 'Quand il était bébé, Noé ___ un doudou.', choices: ['avait', 'aura', 'a'], answer: 'avait', explain: 'L’imparfait du verbe avoir : il avait.' },
```

### n3-groupe-nom #7 · « Au zoo, on voit beaucoup d’___. » — MINEUR (voir T5)

```js
{ type: 'gap', text: 'Au zoo, on voit des ___ du monde entier.', choices: ['animaux', 'animal'], answer: 'animaux', explain: 'Un animal, des animaux : au pluriel, « -al » devient « -aux ».' },
```

### n3-mots #8 et #9 · « Quelle lettre muette finit « grand » ? » — MINEUR
« On entend le « d » dans « grande » » est lu « on entend le *dé* » : nom de la lettre au lieu du son (on n'entend pas « dé » dans « grande »). Donner la syllabe qu'on entend :

```js
{ type: 'choice', text: 'Quelle lettre muette finit « grand » ? Pense à « grande ».', choices: ['d', 't', 's'], answer: 'd', explain: 'Dans « grande », on entend la fin « de » : on écrit « grand » avec un « d ».' },
{ type: 'choice', text: 'Quelle lettre muette finit « chant » ? Pense à « chanter ».', choices: ['t', 'd', 's'], answer: 't', explain: 'Dans « chanter », on entend « té » : on écrit « chant » avec un « t ».' },
```

Bilan n3 : 0 bloquant propre au contenu, 5 importants, 7 mineurs.

---

## 2. Niveau n4 · CM1-CM2 · « Explorer la phrase »

Bon niveau, conforme au cycle 3 (2025) : COD/COI prototypiques, sujet inversé simple, marques de temps. Les problèmes viennent surtout de **procédés peu fiables** (« on entend le r », « devant un verbe, on écrit se ») et de la **voix** qui lit des terminaisons écrites.

### n4-lire #10 · « Bouki avait très faim. Son ami Ti Malice avait caché un pot de beurre… » — IMPORTANT
Le module travaille les reprises pronominales, mais « Chaque nuit, il en mangeait un peu » est ambigu : la première phrase (« Bouki avait très faim ») donne un mobile à Bouki, et l'`explain` (« « il » reprend Ti Malice ») ne donne aucun indice vérifiable. Version où la reprise n'a qu'une lecture (Ti Malice est le sujet de la phrase d'avant, et Bouki est le propriétaire volé) :

```js
{ type: 'text', passage: 'Bouki avait un pot de beurre. Son ami Ti Malice le savait. Chaque nuit, il venait en manger un peu, en secret. Un matin, Bouki trouva le pot vide.',
  questions: [
    { text: 'Qui mangeait le beurre en secret ?', choices: ['Ti Malice', 'Bouki'], answer: 'Ti Malice', explain: '« il » reprend Ti Malice, le sujet de la phrase d’avant : c’est lui qui venait manger le beurre de Bouki.' },
    { text: 'Pourquoi le pot était-il vide ?', choices: ['Ti Malice avait mangé le beurre.', 'Bouki l’avait renversé.', 'Le beurre avait fondu.'], answer: 'Ti Malice avait mangé le beurre.', explain: 'Chaque nuit, Ti Malice en mangeait un peu : il a fini le pot.' },
  ] },
```

### n4-temps-simples #4 et #8 · « Demain, je ___ mon cartable. » / « Nous partirons à l’aube. » — IMPORTANT
« Au futur, on entend le « r » » est un procédé faux pour ces verbes : on entend aussi un « r » dans « préparais » (le distracteur du même item), « rentraient » (item #9, imparfait) ou « nous partons » (présent). L'enfant dyslexique applique les procédés à la lettre : il faut une règle fiable (infinitif + terminaison, au cycle 3).

```js
{ type: 'gap', text: 'Demain, je ___ mon cartable.', choices: ['préparerai', 'préparais'], answer: 'préparerai', explain: 'Au futur, on garde l’infinitif « préparer » et on ajoute « ai » : je préparerai.' },
{ type: 'pick', text: 'Nous partirons à l’aube.', prompt: 'Touche le verbe au futur.', answer: 'partirons', explain: 'Au futur, on garde l’infinitif « partir » et on ajoute « ons » : nous partirons.' },
```

### n4-temps-simples #7 · « Pourquoi écrit-on « nous mangeons » avec un « e » ? » — IMPORTANT
« le son « j » » est lu « le son *ji* » : nom de la lettre à la place du son, confusion que l'on combat en rééducation. Passer par des mots-repères :

```js
{ type: 'choice', text: 'Pourquoi écrit-on « nous mangeons » avec un « e » ?', choices: ['Pour que « ge » se lise comme dans « pigeon ».', 'Parce que le verbe est au futur.', 'Parce que le sujet est au pluriel.'], answer: 'Pour que « ge » se lise comme dans « pigeon ».', explain: 'Sans « e », « go » se lirait comme dans « gomme » ; avec « e », on lit comme dans « pigeon » : nous mangeons.' },
```

### n4-homophones-e-er · intro et items #2, #7, #12 (question 2) — IMPORTANT (voir T3)
Kaya lit « écris « er » », « finit par « ez » » : la synthèse prononce *èr* / *èz*, alors que ces finales se disent [é]. L'enfant entend une prononciation qui n'existe pas dans les mots visés. Épeler les lettres :

```js
intro: 'Remplace le verbe par « vendre » ou « vendu ». Si « vendre » va, écris l’infinitif en e, r : manger. Si « vendu » va, écris « é » : mangé. Avec « vous », écris e, z : vous mangez.',
```
```js
{ type: 'gap', text: 'Vous ___ vos amis.', choices: ['invitez', 'inviter', 'invité'], answer: 'invitez', explain: 'Avec « vous », le verbe au présent finit par les lettres e, z : vous invitez.' },
{ type: 'gap', text: 'Vous ___ trop vite !', choices: ['parlez', 'parler', 'parlé'], answer: 'parlez', explain: 'Avec « vous », on écrit les lettres e, z : vous parlez.' },
```
et, dans le texte #12 :
```js
{ text: 'Dans « de cuisiner », pourquoi le verbe finit-il par e, r ?', choices: ['Après « de », on peut dire « vendre ».', 'Le sujet est « vous ».'], answer: 'Après « de », on peut dire « vendre ».', explain: 'Après « de », on peut dire « de vendre » : on écrit l’infinitif « cuisiner ».' },
```

### n4-homophones-ce-se · intro (+ #0, #2, #4, contrôle n4 #6) — IMPORTANT
« Devant un verbe, on écrit « se » » est un indice de position, pas un test : il est faux pour « ce sont », « ce sera » et surtout pour « c’est » (« ce » + verbe être), que le module n5-homophones-cest traite juste après. Le procédé fiable, celui des orthophonistes et des manuels : changer de personne (« il se lave » → « je me lave »).

```js
intro: 'Il se lave, je me lave : si « me » va, écris « se ». Pour montrer, on écrit « ce » ou « ces » : ces chats-là. Si on peut dire « les siens », on écrit « ses ».',
```
```js
{ type: 'gap', text: 'Le lézard ___ cache sous une pierre.', choices: ['se', 'ce'], answer: 'se', explain: 'On peut dire « je me cache » : on écrit « se », le lézard se cache.' },
{ type: 'gap', text: 'Les enfants ___ lavent les mains.', choices: ['se', 'ce'], answer: 'se', explain: 'On peut dire « je me lave les mains » : on écrit « se ».' },
```
L'`explain` de #4 est en plus **inexact** : « elle prépare elle-même » veut dire autre chose que « elle se prépare ».
```js
{ type: 'gap', text: 'Elle ___ prépare pour la course.', choices: ['se', 'ce'], answer: 'se', explain: 'On peut dire « je me prépare » : on écrit « se », elle se prépare.' },
```
Contrôle n4 #6 :
```js
{ type: 'gap', text: 'Le soir, le chat ___ cache sous le lit.', choices: ['se', 'ce'], answer: 'se', explain: 'On peut dire « je me cache » : on écrit « se », le chat se cache.' },
```
(#8 et la question 1 du texte #13, « Il est devant un verbe », restent vrais ; à aligner sur le nouveau procédé si l'on veut une seule règle : choix « On peut dire « je me réveille ». ».)

### n4-temps-composes #7 · « Quelle phrase est correcte à la forme négative ? » — IMPORTANT
Deux phrases fautives montrées (« Je n’ai mangé pas. », « Je ne pas ai mangé. ») : c'est le format « Quelle phrase est bien écrite ? » que le dernier commit a retiré ailleurs, resté ici sous un autre nom. Faire construire la bonne phrase :

```js
{ type: 'order', words: ['Nous', 'n’avons', 'pas', 'fini', 'nos', 'devoirs'], answer: 'Nous n’avons pas fini nos devoirs.', explain: 'Au passé composé, « ne » et « pas » entourent l’auxiliaire : nous n’avons pas fini.' },
```

### n4-complements-circ #10 · order « Nous jouons dans le jardin. » — IMPORTANT
Le module enseigne que le complément circonstanciel « se déplace », puis l'exercice d'ordre refuse « Dans le jardin, nous jouons » (le jeu attend un seul ordre et compte l'essai comme une erreur). C'est aussi contraire à la règle du rapport de l'enseignant (§ 2 : pas de groupe déplaçable dans un `order`). Remplacer par un item qui fait déplacer le groupe :

```js
{ type: 'choice', text: 'Dans « Nous jouons dans le jardin », quel groupe peut-on déplacer ?', choices: ['dans le jardin', 'Nous', 'jouons'], answer: 'dans le jardin', explain: 'On peut dire « Dans le jardin, nous jouons » : c’est un complément de lieu, il se déplace.' },
```

### n4-temps-composes #0 · « Hier, j’___ fini mon livre. » — MINEUR (voir T5)
Le trou collé à « j’ » donne la réponse sans réfléchir à l'auxiliaire (« suis » ne peut pas suivre « j’ »).

```js
{ type: 'gap', text: 'Hier, tu ___ fini ton livre.', choices: ['as', 'es'], answer: 'as', explain: '« finir » se conjugue avec « avoir » : tu as fini.' },
```

### n4-temps-composes #5 et #6 · « Quel est le participe passé de « prendre » / « faire » ? » — MINEUR
« pris » / « prit », « fait » / « fais » se prononcent pareil : l'`explain` doit donner le **truc du féminin**, levier majeur pour les lettres muettes.

```js
{ type: 'choice', text: 'Quel est le participe passé de « prendre » ?', choices: ['pris', 'prit', 'prenait'], answer: 'pris', explain: 'Au féminin, on dit « prise » : le participe passé « pris » finit donc par un « s ».' },
{ type: 'choice', text: 'Quel est le participe passé de « faire » ?', choices: ['fait', 'fais', 'faisait'], answer: 'fait', explain: 'Au féminin, on dit « faite » : le participe passé « fait » finit donc par un « t ».' },
```

### n4-temps-simples #11 · « Quel est le futur de « il vient » ? » — MINEUR
« il viendrait » (conditionnel, vu en 6e) ne diffère de « il viendra » que par « -it » : distracteur visuel sur une forme pas encore enseignée.

```js
{ type: 'choice', text: 'Quel est le futur de « il vient » ?', choices: ['il viendra', 'il venait', 'il est venu'], answer: 'il viendra', explain: 'Au futur, « venir » change de radical : il viendra.' },
```

### n4-homophones-ou #10 · « D’___ viens-tu ? » — MINEUR (voir T5)
Kaya lit « D’… viens-tu ? » (« dé… »). Garder « d’où » sans trou :

```js
{ type: 'choice', text: 'Dans « D’où viens-tu ? », pourquoi « où » a-t-il un accent ?', choices: ['Il demande un lieu.', 'On peut dire « ou bien ».'], answer: 'Il demande un lieu.', explain: '« D’où viens-tu ? » demande de quel lieu tu viens : « où » prend un accent.' },
```

### n4-homophones-ou #11 · « Il pleut ___ il fait beau ? » — MINEUR
« un choix entre deux temps » : dans un jeu de grammaire, « temps » évoque les temps des verbes.

```js
{ type: 'gap', text: 'Il pleut ___ il fait beau ?', choices: ['ou', 'où'], answer: 'ou', explain: 'C’est un choix entre la pluie et le soleil : on peut dire « ou bien ».' },
```

### n4-homophones-ou #12, question 1 · « … pourquoi « ou » n’a-t-il pas d’accent ? » — MINEUR
Question à la forme négative (charge inutile) :

```js
{ text: 'Dans « à la plage ou au cinéma », pourquoi écrit-on « ou » sans accent ?', choices: ['C’est un choix : on peut dire « ou bien ».', 'Il indique un lieu.'], answer: 'C’est un choix : on peut dire « ou bien ».', explain: 'Lou choisit entre deux sorties : « ou bien » convient, donc pas d’accent.' },
```

### n4-homophones-ce-se #6 et contrôle n4 #7 · « … range ___ affaires » / « Mon frère a perdu ___ clés. » — MINEUR
« ces affaires », « ces clés » sont grammaticaux (on montre des affaires, des clés précises) et passent le test « -là » enseigné dans le même module. Choisir des phrases où la possession est évidente :

```js
{ type: 'gap', text: 'Le chat lèche ___ pattes.', choices: ['ses', 'ces'], answer: 'ses', explain: 'Ce sont les pattes du chat, les siennes : on écrit « ses ».' },
{ type: 'gap', text: 'Mon frère cherche ___ lunettes : il les a perdues.', choices: ['ses', 'ces'], answer: 'ses', explain: 'Ce sont les lunettes de mon frère, les siennes : on écrit « ses ».' },
```

### n4-cod-coi · intro — MINEUR
« Le COI commence par « à » ou « de » » piège avec les articles partitifs (« je bois du jus », « je mange de la soupe » sont des COD), présents dans le module (#6). Passer par les questions :

```js
intro: 'Le COD répond à « quoi ? » ou « qui ? » : je mange une mangue. Le COI répond à « à qui ? », « de quoi ? » : je parle à Léa. Ils complètent le verbe et ne se déplacent pas.',
```

### n4-lire · intro — MINEUR
« Les indices du texte t’aident à deviner » : l'inférence n'est pas une devinette (un enfant en difficulté entend « réponds au hasard »).

```js
intro: 'Dans un récit, les pronoms remplacent les personnages : « elle » peut être Léa. Pour comprendre, demande-toi qui fait quoi. Les indices du texte t’aident à trouver ce qui n’est pas écrit.',
```

### n4-lire #1, question 3 · « Où se passe sûrement cette histoire ? » — MINEUR
Rien dans le texte ne dit « île » (la Guyane, citée ailleurs, a des palmiers).

```js
{ text: 'Où se passe sûrement cette histoire ?', choices: ['dans un pays chaud où poussent des palmiers', 'dans une ville sous la neige', 'dans le désert'], answer: 'dans un pays chaud où poussent des palmiers', explain: 'Les palmiers et le cyclone font penser à un pays chaud, sous les tropiques.' },
```

### n4-mots #5 · « Quel est l’antonyme de « courageux » ? » — MINEUR
« antonyme » n'est ni défini dans l'intro ni vu en n3 (qui dit « contraire »).

```js
{ type: 'choice', text: 'Quel est l’antonyme, le contraire, de « courageux » ?', choices: ['peureux', 'brave', 'fort'], answer: 'peureux', explain: '« courageux » et « peureux » ont des sens opposés : ce sont des antonymes.' },
```

Bilan n4 : 0 bloquant, 7 importants, 11 mineurs.

---

## 3. Niveau n5 · 6e-5e · « Accorder et conjuguer »

Niveau exigeant mais bien construit (participe passé, attribut / COD, propositions). Comme en n4, deux **procédés de position** peu fiables (« s’est est suivi d’un participe », « leurs devant un nom pluriel ») et une **phrase fautive** restée en place.

### n5-participe-passe #11 · « Quelle phrase est correctement accordée ? » — IMPORTANT
« Ces mangues, je les ai acheté. » est montré : c'est précisément l'erreur d'accord que l'on veut éviter d'imprimer (format retiré ailleurs par le dernier commit). En phrase à trou :

```js
{ type: 'gap', text: 'Ces mangues, je les ai ___.', choices: ['achetées', 'acheté'], answer: 'achetées', explain: 'Le COD « les » (ces mangues) est placé avant le verbe : achetées.' },
```

### n5-homophones-cest · intro — IMPORTANT
« « S’est » est suivi d’un participe passé » est faux comme critère : « c’est fini », « c’est fermé », « c’est cassé » sont suivis d’un participe et s'écrivent « c’est ». Un enfant dysorthographique applique l'indice de position et écrira « s’est fini ». Le seul test fiable est celui du verbe en « se » (déjà dans la 3e phrase) :

```js
intro: '« C’est » veut dire « cela est » : c’est beau. « S’est » vient d’un verbe comme « se lever » : il s’est levé. Au présent, on dirait : il se lève.',
```

### n5-homophones-leur · intro — IMPORTANT
L'intro ne couvre pas « leur » déterminant **singulier** (« leur maison », « leur chambre », items #2 et #5) ; pire, « Devant un nom pluriel, on écrit « leurs » » pousse vers « leurs chambre » avec « Les deux sœurs » (pluriel du possesseur), le piège classique. L'aide des `gap` lit cette intro.

```js
intro: 'Devant un verbe, « leur » veut dire « à eux » : jamais de « s ». Devant un nom, il s’accorde avec ce nom : leur maison, leurs cahiers. Exemple : je leur rends leurs cahiers.',
```

### n5-passe-simple #14 · « Quelle forme est au passé simple ? » — IMPORTANT
L'`explain` est faux à la lettre : « « nous » prend un accent circonflexe » (c'est la terminaison du verbe qui le prend).

```js
{ type: 'choice', text: 'Quelle forme est au passé simple ?', choices: ['nous chantâmes', 'nous chantions', 'nous chanterons'], answer: 'nous chantâmes', explain: 'Au passé simple, avec « nous », la terminaison prend un accent circonflexe : nous chantâmes.' },
```

### n5-homophones-cest #13 · « Quel est le présent de « il s’est assis » ? » — MINEUR
Verbe irrégulier (et deux présents admis, « il s’assied » / « il s’assoit ») avec un distracteur à une lettre près (« s’assit ») : l'item teste l'orthographe de « s’asseoir », pas c’est / s’est. Un verbe régulier fait travailler le procédé du module :

```js
{ type: 'choice', text: 'Quel est le présent de « il s’est caché » ?', choices: ['il se cache', 'il cache'], answer: 'il se cache', explain: 'Au présent, on dirait « il se cache » : c’est pour cela qu’on écrit « s’est » au passé composé.' },
```

### n5-participe-passe #10 · « Pourquoi écrit-on « Elles ont mangé » sans « es » à la fin ? » — MINEUR (voir T3)
« sans « es » » est lu comme le verbe « es » [è] par la synthèse.

```js
{ type: 'choice', text: 'Pourquoi « mangé » ne s’accorde-t-il pas dans « Elles ont mangé » ?', choices: ['Avec « avoir », pas d’accord avec le sujet.', 'Le sujet est masculin.', 'Le verbe est à l’infinitif.'], answer: 'Avec « avoir », pas d’accord avec le sujet.', explain: 'Avec l’auxiliaire « avoir », le participe ne s’accorde jamais avec le sujet.' },
```

### n5-participe-passe #12, question 2 · « Pourquoi écrit-on « ils les ont montrées » ? » — MINEUR
La question ne dit pas sur quoi porte le « pourquoi » (le pronom ? l'auxiliaire ? la fin du participe ?).

```js
{ text: 'Pourquoi accorde-t-on « montrées » dans « ils les ont montrées » ?', choices: ['Le COD « les » (les photos) est placé avant.', 'Le sujet est féminin.'], answer: 'Le COD « les » (les photos) est placé avant.', explain: '« les » remplace « leurs photos », placé avant le verbe : montrées.' },
```

### n5-imperatif-conditionnel · intro — MINEUR
Les items #6 à #8 (« Si j’avais des ailes… », « À ta place… ») travaillent la valeur d'**hypothèse**, que l'intro ne nomme pas (« souhait ou politesse » seulement).

```js
intro: 'L’impératif donne un ordre, sans sujet : range ta chambre. Le conditionnel exprime un souhait ou une situation imaginée : je voudrais. Il se forme comme le futur, avec les terminaisons de l’imparfait.',
```

### n5-groupe-nominal · intro — MINEUR
L'item #9 demande « Combien d’expansions… ? » : le mot n'est jamais défini.

```js
intro: 'Le groupe nominal minimal, c’est un déterminant et un nom : un vélo. On l’enrichit avec des expansions : un adjectif épithète, un complément du nom. Exemple : un grand vélo de course.',
```

### n5-attribut · terminologie « verbe d’état » — MINEUR
Le rapport de l'enseignant cite, pour la 5e (programme 2026), les **verbes attributifs** ; le module ne dit que « verbe d’état ». Donner les deux noms une fois, dans l'intro (à vérifier dans la terminologie Éduscol en vigueur) :

```js
intro: 'L’attribut du sujet suit un verbe attributif : être, sembler, devenir. On dit aussi « verbe d’état ». Il s’accorde avec le sujet : elles sont contentes. Le COD désigne autre chose que le sujet : elle mange une mangue.',
```

### n5-lire #9 · texte de théâtre en un seul bloc — MINEUR
« LA MÈRE. — Où étais-tu passé ? KENZO. — J’étais chez Mamie… » s'affiche sur une seule ligne continue : la mise en page du théâtre (une réplique par ligne), qui est justement l'indice demandé à la question 1, disparaît, et le bloc est difficile à suivre pour un lecteur dyslexique. Proposition : un saut de ligne entre les répliques dans les données et `white-space: pre-line` sur `.adv-passage` (`css/app.css`).

```js
{ type: 'text', passage: 'LA MÈRE. — Où étais-tu passé ?\nKENZO. — J’étais chez Mamie, je t’avais prévenue !\nLA MÈRE, souriant. — C’est vrai, je l’avais oublié.',
```
(les trois `questions` restent inchangées)

### n5-lire · intro — MINEUR
« devine ce qui est sous-entendu » (même remarque qu'en n4).

```js
intro: 'Un bon lecteur repère les indices et comprend ce qui est sous-entendu. Il cherche aussi qui parle et à qui. Exemple : « Il claqua la porte » montre sa colère.',
```

### n5-mots #0 · « Quel est le radical de « déménagement » ? » — MINEUR
« ménag » est une forme tronquée qui n'existe pas ; pour la conscience morphologique d'un enfant dyslexique, un radical qui est un vrai mot (« ménage ») est plus parlant, et la découpe dé- / ménage / -ment est aussi admise.

```js
{ type: 'choice', text: 'Quel est le radical de « déménagement » ?', choices: ['ménage', 'dé', 'ment'], answer: 'ménage', explain: '« dé- » est le préfixe et « -ment » le suffixe : au milieu, on trouve le radical « ménage ».' },
```

### n5-controle #7 · « Si j’étais riche, j’___ une maison… » — MINEUR (voir T5)

```js
{ type: 'gap', text: 'Si nous étions riches, nous ___ une maison au bord de la mer.', choices: ['achèterions', 'achèterons', 'achetions'], answer: 'achèterions', explain: 'Après « si » et l’imparfait, on emploie le conditionnel : nous achèterions.' },
```

### n5-imperatif-conditionnel #11 · « Quel est le radical du conditionnel de « venir » ? » — MINEUR
« vien » ressemble à la faute fréquente « vien » pour « viens » / « vient », et « viendr » est imprononçable par la synthèse. Montrer des morceaux (trait d'union) accrochés à un mot connu :

```js
{ type: 'choice', text: 'Sur quel radical se forme le conditionnel de « venir » ?', choices: ['viendr- (je viendrai)', 'ven- (nous venons)', 'vien- (je viens)'], answer: 'viendr- (je viendrai)', explain: 'Le conditionnel prend le radical du futur : je viendrai, je viendrais.' },
```

Bilan n5 : 0 bloquant, 4 importants, 11 mineurs.

---

## 4. Niveau n6 · 4e-3e · « Maîtriser la langue »

Le niveau le plus propre : réponses justes, `explain` précis, bonne couverture des programmes 2015 (4e-3e) et 2026. Restent des **transformations fautives** montrées en discours indirect, une phrase « correctement accordée » (l'ancien format), et une règle manquante (verbes pronominaux).

### n6-participe-avoir #11 · « Quelle phrase est correctement accordée ? » — IMPORTANT
« Les photos que tu as pris sont belles. » est montré : c'est l'erreur d'accord la plus fréquente au collège, qu'il ne faut pas donner à voir.

```js
{ type: 'gap', text: 'Les photos que tu as ___ sont belles.', choices: ['prises', 'pris'], answer: 'prises', explain: 'Le COD « que » reprend « Les photos », placé avant : prises.' },
```

### n6-discours #0 à #3 et n6-controle #8 · « Mets au discours indirect… » — IMPORTANT
Les distracteurs sont des phrases agrammaticales : « Il me demande que je viens. », « Il me demande viens-tu. », « Elle demande où habites-tu. » (l'erreur type des collégiens), « Il demande que j’ai faim. », « Il demande as-tu faim. ». Même raisonnement que pour l'orthographe : on fait construire ou choisir la forme juste, sans montrer la fausse.

```js
{ type: 'choice', text: 'Il me demande : « Viens-tu ? » Au discours indirect, quel mot introduit la question ?', choices: ['si', 'que', 'où'], answer: 'si', explain: 'Une interrogation totale rapportée commence par « si » : il me demande si je viens.' },
{ type: 'order', words: ['Elle', 'demande', 'où', 'j’habite'], answer: 'Elle demande où j’habite.', explain: 'On garde « où », mais le sujet revient avant le verbe et le point d’interrogation disparaît.' },
```
Contrôle n6 #8 :
```js
{ type: 'order', words: ['Il', 'demande', 'si', 'j’ai', 'faim'], answer: 'Il demande si j’ai faim.', explain: 'Une question totale rapportée commence par « si ».' },
```
Pour #0 (« Léa dit : « Je suis fatiguée. » »), remplacer seulement le distracteur mal ponctué « Léa dit : elle est fatiguée. » par une phrase correcte mais fausse comme transformation :
```js
{ type: 'choice', text: 'Mets au discours indirect : Léa dit : « Je suis fatiguée. »', choices: ['Léa dit qu’elle est fatiguée.', 'Léa dit que je suis fatiguée.', 'Léa dit qu’elle était fatiguée.'], answer: 'Léa dit qu’elle est fatiguée.', explain: '« je » devient « elle » et les paroles sont introduites par « que » ; le verbe « dit » est au présent, le temps ne change pas.' },
```
(#3, « Elle répondit qu’elle partira demain », montre une faute de concordance ; à transformer de la même façon si l'équipe veut une règle sans exception : `{ type: 'gap', text: 'Elle répondit qu’elle ___ le lendemain.', choices: ['partirait', 'partira'], answer: 'partirait', explain: 'Dans un récit au passé, le futur devient conditionnel : elle partirait le lendemain.' }`.)

### n6-participe-avoir · intro (et #8, #9) — IMPORTANT
Les items #8 et #9 (« Elle s’est ___ les mains », « Elle s’est ___ avant de dîner ») portent sur les **verbes pronominaux**, que l'intro ne mentionne pas. L'élève voit « est », se souvient de la règle de n5 (« avec être, accord avec le sujet ») et écrit « elle s’est lavée les mains » ; l'aide lui relit une intro qui ne parle que d'« avoir ».

```js
intro: 'Avec « avoir », le participe s’accorde avec le COD placé avant. Exemple : la robe que j’ai cousue. Si le COD suit le verbe, pas d’accord : j’ai cousu une robe. Les verbes pronominaux suivent la même règle : elle s’est lavé les mains.',
```
```js
{ type: 'gap', text: 'Elle s’est ___ les mains.', choices: ['lavé', 'lavée'], answer: 'lavé', explain: 'Verbe pronominal : on accorde comme avec « avoir ». Le COD « les mains » est après le verbe : pas d’accord.' },
{ type: 'gap', text: 'Elle s’est ___ avant de dîner.', choices: ['lavée', 'lavé'], answer: 'lavée', explain: 'Verbe pronominal : on accorde comme avec « avoir ». Le COD « s’ », c’est elle-même, placé avant : lavée.' },
```

### n6-relatives #5 · « Le village ___ vit ma tante est près d’un volcan. » — IMPORTANT
« vit » peut se lire comme le passé simple de « voir » (vu en n5 : « Il vit un dragon » → voir) : « Le village que vit ma tante » (le village que ma tante vit) est alors grammatical, de même que « qui ». Avec un verbe qui ne peut pas avoir de COD, « où » est la seule réponse :

```js
{ type: 'gap', text: 'Le village ___ ma tante est née est près d’un volcan.', choices: ['où', 'que', 'qui'], answer: 'où', explain: '« où » indique le lieu : ma tante est née dans ce village.' },
```

### n6-voix-passive #5 · « Ces maisons ___ construites en 1950. » — MINEUR
L'`explain` dit « on utilise l’auxiliaire être » alors que la bonne réponse commence par « ont » : contradiction apparente pour l'élève.

```js
{ type: 'gap', text: 'Ces maisons ___ construites en 1950.', choices: ['ont été', 'ont', 'avaient'], answer: 'ont été', explain: 'Au passif, il faut le verbe être : « été » est son participe passé. Elles ont été construites.' },
```

### n6-subordonnees #8 · « Il pleuvait fort, ___ le match a été reporté. » — MINEUR
« si bien que » contient « bien que » : pour un lecteur dyslexique, les deux boutons se ressemblent. L'`explain` doit pointer la différence visible.

```js
{ type: 'gap', text: 'Il pleuvait fort, ___ le match a été reporté.', choices: ['si bien que', 'bien que', 'pour que'], answer: 'si bien que', explain: 'Avec « si » devant, « si bien que » annonce la conséquence ; « bien que », sans « si », marque l’opposition.' },
```

### n6-subordonnees · intro — MINEUR
Le module travaille aussi la conséquence, l'opposition et la condition (#3 à #5, #8, #9) : l'intro ne cite que le temps, la cause et le but.

```js
intro: 'La complétive complète un verbe : je crois que tu as raison. La circonstancielle dit quand, pourquoi, dans quel but ou avec quelle conséquence. Elle peut aussi marquer une opposition ou une condition.',
```

### n6-accords-sujet #1 · « Le bruit des vagues m’___. » — MINEUR (voir T5)

```js
{ type: 'gap', text: 'Le bruit des vagues ___ les enfants.', choices: ['apaise', 'apaisent'], answer: 'apaise', explain: 'Le noyau du sujet est « bruit », au singulier : il apaise.' },
```

### n6-accords-sujet #10 · « Pourquoi écrit-on « Les feuilles de l’arbre tombent » ? » — MINEUR
On ne sait pas sur quel mot porte le « pourquoi ».

```js
{ type: 'choice', text: 'Pourquoi « tombent » est-il au pluriel dans « Les feuilles de l’arbre tombent » ?', choices: ['Le noyau du sujet est « feuilles ».', 'Le noyau du sujet est « arbre ».'], answer: 'Le noyau du sujet est « feuilles ».', explain: '« de l’arbre » complète « feuilles », qui est le noyau pluriel du sujet.' },
```

### n6-subjonctif #4 · « Ma mère veut que j’___ chez le dentiste. » — MINEUR (voir T5)
« j’ » devant le trou élimine « vais » sans réflexion (« j’vais » n'existe pas à l'écrit).

```js
{ type: 'gap', text: 'Ma mère veut que tu ___ chez le dentiste.', choices: ['ailles', 'vas', 'iras'], answer: 'ailles', explain: 'Le subjonctif du verbe aller : que tu ailles.' },
```
(#3, « Il faut que j’___ mon passeport », garde l'élision : c'est l'objet même de l'item, « j’aie » / « j’ai ».)

### n6-subjonctif #8 et #12 · « Au subjonctif, « vous » prend « -iez » » — MINEUR
C'est le verbe qui prend la terminaison (même glissement qu'en n5-passe-simple #14).

```js
{ type: 'gap', text: 'Il faut que vous ___ ce livre.', choices: ['lisiez', 'lisez', 'lirez'], answer: 'lisiez', explain: 'Au subjonctif, avec « vous », le verbe finit par « -iez » : que vous lisiez.' },
{ type: 'choice', text: 'Quel est le subjonctif présent de « prendre » avec « nous » ?', choices: ['que nous prenions', 'que nous prenons', 'que nous prendrons'], answer: 'que nous prenions', explain: 'Au subjonctif, avec « nous », le verbe finit par « -ions » : que nous prenions.' },
```

### n6-relatives #8 · « complément de l’antécédent » (point § 8.2 du rapport de l'enseignant) — MINEUR
Le terme est transparent et courant dans les manuels ; garder la réponse, mais nommer l'autre appellation dans l'`explain`, pour qu'un élève qui a appris « complément du nom » ne se croie pas dans l'erreur.

```js
{ type: 'choice', text: 'Quelle est la fonction de la relative dans « J’aime les histoires qui font peur » ?', choices: ['complément de l’antécédent', 'sujet', 'COD du verbe « aime »'], answer: 'complément de l’antécédent', explain: 'La relative complète le nom « histoires », son antécédent : elle est complément de l’antécédent (on dit aussi complément du nom).' },
```

Bilan n6 : 0 bloquant, 4 importants, 8 mineurs.

---

## 5. Avis sur les « points à valider » du rapport de l'enseignant (§ 8)

1. **Homophones grammaticaux** : à garder. Pour un dysorthographique, a/à, et/est, on/ont, son/sont, ou/où, ce/se, c’est/s’est, leur/leurs sont des erreurs persistantes et très visibles ; un entraînement par **procédé de substitution** est la bonne approche. Le format « phrase à trou entre deux mots réels, phrase juste affichée ensuite » (dernier commit) est le bon. Il reste à convertir : n3-phrase #8, n4-temps-composes #7, n5-participe-passe #11, n6-participe-avoir #11, n6-discours #0 (distracteur mal ponctué), #1, #2, #3 et n6-controle #8 (voir plus haut). Je propose d'ajouter au test `levels.test.mjs` une garde : aucun `text` du type « Quelle phrase est correcte / bien écrite / correctement accordée ».
2. **Terminologie** : « complément de l’antécédent » acceptable si l'`explain` cite aussi « complément du nom » (n6-relatives #8) ; « interrogation totale » conforme ; « donc » n'est nulle part classé comme conjonction de coordination dans les données (n4-lire #4 l'emploie seulement comme connecteur) ; conditionnel toujours présenté comme un temps : conforme. Ajouter « verbe attributif » à côté de « verbe d’état » (n5-attribut).
3. **Passé simple en n5** : d'accord. Morphologie lourde et peu fréquente à l'oral ; la placer après les temps du CM est plus confortable pour un enfant dyslexique.
4. **Concordance des temps** : d'accord pour la règle scolaire ; mais n6-discours #3 montre encore « Elle répondit qu’elle partira demain » comme distracteur (correction proposée en phrase à trou).
5. **« avec » entre virgules** : d'accord pour l'écarter.
6. **Contextes culturels** : hors de mon champ ; rien de blessant ni de stéréotypé relevé. Les mots locaux (maki, cabri, accras, ignames, letchis) sont toujours dans un contexte qui permet de répondre sans les connaître, ce qui est le bon choix.
7. **Synthèse vocale et homophones** : le 🔊 d'un bouton dit deux fois le même son pour « a » / « à », « ou » / « où », « ces » / « ses », « c’est » / « s’est », « leur » / « leurs ». Proposition : pour ces paires, faire dire au 🔊 une étiquette qui les distingue (« a, sans accent », « à, avec l’accent » ; « s’est, avec s apostrophe »), via un champ `say` par choix. Police : Andika par défaut et l'espacement élargi déjà présents (`--read-spacing`, `--word-spacing`) sont les bons leviers ; l'espacement des lettres a un effet démontré (Zorzi et al., PNAS 2012), alors que les polices « spéciales dyslexie » n'en ont pas montré (Wery et Diliberto, *Annals of Dyslexia* 2017 pour OpenDyslexic ; Kuster et al., *Annals of Dyslexia* 2018 pour Dyslexie) : garder OpenDyslexic en option, sans la recommander.
8. **Espaces insécables** : réglé à l'affichage par `typo()` (dernier commit).
9. **Longueur des textes** : garder des textes courts (3 à 6 phrases), y compris en 4e-3e : pour un lecteur dyslexique, le décodage reste le goulot ; la compréhension de textes longs se travaille mieux avec l'écoute (aide « lire le texte »), qui existe déjà.
10. **Seuils d'Élo** : impossible de les recaler tant que T1 n'est pas corrigé — les données de réussite actuelles mesurent surtout la position du premier bouton.

---

## 6. Synthèse

| Partie | Bloquant | Important | Mineur |
|---|---|---|---|
| Transversal (code, voix) | 1 (T1) | 2 (T2, T3) | 3 (T4, T5, T6) |
| n3 · CE1-CE2 | 0 | 5 | 7 |
| n4 · CM1-CM2 | 0 | 7 | 11 |
| n5 · 6e-5e | 0 | 4 | 11 |
| n6 · 4e-3e | 0 | 4 | 8 |
| **Total (63 constats)** | **1** | **22** | **40** |

(T3 et T5 sont des règles générales ; leurs occurrences précises sont comptées dans les niveaux.)

Aucune réponse attendue n'est fausse dans les 727 questions. Le seul bloquant est dans l'affichage : la bonne réponse est le premier bouton dans 98 % des questions à choix.

Recommandations (par ordre de priorité) :

1. **Mélanger les choix à l'affichage** (T1) avant toute utilisation par des enfants, avec un test qui le garantit ; ne recaler les seuils d'Élo qu'après.
2. **Zéro forme fautive, sans exception** : convertir les 9 items restants (phrases « correctes », transformations agrammaticales, faute de concordance) en phrases à trou ou en mots à remettre dans l'ordre, et ajouter une garde au test.
3. **Des procédés fiables, pas des indices de position** : « se » → on peut dire « me » ; « s’est » → verbe en « se » ; futur → infinitif + terminaison ; « leur » s'accorde avec le nom ; COI → « à qui ? ». Un enfant dyslexique applique la règle à la lettre : chaque intro doit donner un test qui marche pour tous les items du module et qui ne sera pas contredit au module suivant (ce/se puis c’est/s’est ; « avec être » puis verbes pronominaux).
4. **Écrire pour l'oreille** : tout est lu par la synthèse. Épeler les lettres muettes (« e, n, t »), ne jamais nommer une lettre pour un son (« le son j »), pas de trou collé à une apostrophe, et un 🔊 qui distingue les homophones.
5. **Une aide qui aide partout** : règle propre à chaque item dans les contrôles (T2), `explain` des items d'ordre enfin montrés (T4), phrase entière affichée au-dessus des mots à toucher (T6), répliques de théâtre sur des lignes séparées.
