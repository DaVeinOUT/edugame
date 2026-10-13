# Voix humaine de référence et application mobile — rapport du 2026-10-13

Demande de Dave (journal du 13/10, points 3 et 4) : (A) une voix humaine de référence, libre de droits,
à la place de la seule synthèse vocale ; (B) préparer le jeu pour devenir une application mobile.
Rapport écrit au fur et à mesure, complet. **Aucun fichier du dépôt n'a été modifié en dehors de ce rapport** ;
tous les essais (téléchargements, conversions, génération de projets Android) ont eu lieu dans le dossier temporaire
de la session. Plan : synthèse, constats (0), partie A (voix), partie B (mobile), annexes (gabarits testés), sources,
puis **« Recommandations à implémenter »** (dernière section).

Légende des preuves : **[TESTÉ]** = vérifié par une requête ou une exécution réelle faite pendant cette recherche ;
**[SOURCE]** = lu dans une source citée en fin de rapport ; **[DÉDUIT]** = raisonnement, à confirmer ;
**[CONNU]** = connaissance générale non revérifiée ici. Ce que je n'ai **pas** pu faire : écouter les voix, tester sur
un téléphone ou un iPhone, lancer la CI, construire l'APK (pas de SDK Android).

## Synthèse (les chiffres à retenir)

| Sujet | Décision | Chiffres mesurés |
|---|---|---|
| Voix des mots | **Poslovitch** (Lingua Libre / Commons), licence **CC0** | **268/303 mots (88 %)** ; 293/303 avec trois voix de secours (CC BY-SA) ; tous les mots existent chez au moins un locuteur ; 10 mots sans voix humaine |
| Poids | MP3 mono 24 kHz 32 kb/s, silences coupés, volume uniformisé | **0,81 Mo** pour 268 mots (0,87 Mo pour 293) ; ~1,2 Mo avec sons et phrases |
| Volume de la base | Lingua Libre français | 427 682 enregistrements, 251 552 mots distincts, 730 locuteurs ; 439 190 fichiers Commons |
| Sons isolés, syllabes | **aucune source libre cohérente** ; 10 voyelles sur 12 trouvables en mots d'un son chez Poslovitch ; consonnes continues rares | à **enregistrer** (37 sons, ~20 min) ; syllabes : ~45 sur 80 de la grille, par des locuteurs différents |
| Common Voice | **inutile** pour EDUCA | CC0, 28,4 Go, 1 210 h, 21 003 locuteurs ; les phrases décodables du CP n'y sont pas |
| Android | **TWA (Bubblewrap)** | `speechSynthesis` marche (Chrome) ; **absent de l'Android WebView** donc de Capacitor ; 0 permission ; targetSdk 36 |
| iOS | **PWA écran d'accueil** maintenant ; Capacitor seulement si App Store voulu | Xcode >= 26, 99 USD/an ; WKWebView a `speechSynthesis` |
| **Point bloquant** | `assetlinks.json` doit être à la **racine de l'origine** : GitHub Pages « projet » ne le permet pas | `daveinout.github.io/.well-known/assetlinks.json` = 404 ; solution : **domaine personnalisé** (recommandé) ou dépôt `DaVeinOUT.github.io` |
| Frais | Google Play 25 USD (une fois) ; Apple 99 USD/an | compte Play personnel : 12 testeurs x 14 jours avant la production |

---

## 0. Constats sur le dépôt (point de départ) [TESTÉ — lecture du code]

- Le dépôt GitHub est `DaVeinOUT/edugame` : l'adresse de publication attendue est donc une **page de projet**
  `https://daveinout.github.io/edugame/` (sous-dossier `/edugame/`). Conséquence capitale pour Android :
  voir la section B3 (Digital Asset Links).
- Mots à enregistrer : **303 mots uniques** (calculés avec `parseSeg` : 260 du lexique illustré + 32 mots-outils
  + mots des 19 phrases, après dédoublonnage ; liste exacte gardée dans le dossier temporaire de la session),
  **37 phonèmes** (66 étapes). L'objectif « ~300 mots d'une seule voix » est donc exactement le bon ordre de
  grandeur ; il faut en plus ~37 sons isolés et ~19 phrases (ou seulement leurs mots, déjà comptés).
- Branchement audio existant : `js/services/voice.js` sait jouer `audio/sons/<id>.mp3` pour un phonème (liste
  `SOUND_FILES` dans `js/data/sounds.js`, aujourd'hui vide) avec repli sur la synthèse. **Aucun branchement
  équivalent pour les mots** : `say()` passe uniquement par `speechSynthesis`. Il faudra ajouter `audio/mots/<mot>.mp3`
  + une liste générée (comme `SOUND_FILES`) + un contrôle « fichier d'abord, synthèse sinon ».
- CSP actuelle (`index.html`) : `media-src 'self' blob:` — des MP3 servis avec le jeu passent ; aucune ressource tierce
  (on ne peut donc PAS lire les fichiers directement depuis Wikimedia : il faut les copier dans le dépôt, ce qui
  est de toute façon nécessaire pour le hors-ligne).
- CI (`.github/workflows/pages.yml`) : copie `index.html manifest.json sw.js css js fonts icons LICENSE` et
  `audio/` s'il existe. Rien pour `.well-known/` (nécessaire à la TWA) ni pour une page publique de confidentialité.
- Manifest actuel : une seule icône `512` avec `purpose: "any maskable"` (à séparer), pas de `screenshots`,
  pas de `categories`, `theme_color` du manifest (#7C3AED) différent de la balise `<meta theme-color>` (#15803d).


---

# PARTIE A — Voix humaine de référence

## A1. Lingua Libre / Wikimedia Commons (terminé — tout est mesuré)

### A1.a Comment c'est organisé [TESTÉ]

- **Lingua Libre** est l'outil d'enregistrement de Wikimédia France : un contributeur lit des listes de mots devant
  son micro, les fichiers sont versés automatiquement sur **Wikimedia Commons**.
- Convention de nom [TESTÉ] : `File:LL-Q150 (fra)-<Locuteur>-<mot>.wav` (`Q150` = français dans Wikidata ;
  `<Locuteur>` = nom d'utilisateur Lingua Libre ; `<mot>` = transcription, accents et majuscules conservés).
  Quelques fichiers anciens ont une autre forme (`LL-0x010C-fra-chat.wav`). Certains locuteurs apparaissent sous
  plusieurs comptes (ex. `Aemines1` à `Aemines6` : six comptes distincts, peut-être six personnes ou six séances —
  à écouter avant de les mélanger).
- Deux API publiques **sans compte** [TESTÉ] :
  1. **API MediaWiki de Commons** (`https://commons.wikimedia.org/w/api.php`) : pour un titre de fichier connu,
     `prop=imageinfo&iiprop=url|size|mime|extmetadata` renvoie l'URL de téléchargement, la licence, l'auteur.
     Jusqu'à 50 titres par requête. La recherche libre par `list=search` est **trop bruyante** pour trouver « chat »
     (709 résultats, dominés par un locuteur qui s'appelle justement « Nattes à chat ») : ne pas l'utiliser pour
     retrouver un mot.
  2. **SPARQL de Lingua Libre** (`https://lingualibre.org/bigdata/namespace/wdq/sparql`, POST/GET, `Accept:
     application/sparql-results+json`) : c'est la bonne façon de savoir **qui a dit quel mot**. Modèle de données
     mesuré : `P7` = transcription, `P4` = langue (`Q21` = français), `P5` = locuteur (entité dont `rdfs:label` est le
     nom d'utilisateur), `P3` = fichier (URL `Special:FilePath/<nom>`), `P6` = date d'enregistrement.
- Le préfixe `Special:FilePath/<nom>` de Commons redirige vers le fichier : `https://commons.wikimedia.org/wiki/Special:FilePath/<nom>`
  (utile pour le téléchargement ; pour l'URL définitive et la licence, utiliser `imageinfo`).
- Politesse : Wikimedia exige un `User-Agent` informatif avec un moyen de contact — « sinon les scripts peuvent être
  bloqués sans préavis » [TESTÉ : texte de la politique, lu le 13/10/2026] — et un débit raisonnable. En pratique,
  `upload.wikimedia.org` répond **HTTP 429** si on télécharge trop vite (voir A4.3).
- État du projet (13/10/2026) [TESTÉ + SOURCE] : le wiki de documentation d'origine est maintenant **« l'archive
  verrouillée de notre ancien wiki »** (`archive.lingualibre.org`) ; la base de données et le point SPARQL fonctionnent ;
  le dernier enregistrement français date du **17/05/2026** ; le projet reste actif (événements 2026, plus de
  1,4 million d'enregistrements dans plus de 315 langues d'après la page Meta). **Les fichiers Commons restent
  disponibles quoi qu'il arrive** ; seule l'**outil d'enregistrement** (pour enregistrer soi-même) est à re-vérifier avant
  d'y compter.

### A1.b Volume total et locuteurs les plus prolifiques (français) [TESTÉ le 2026-10-13]

| Mesure | Valeur |
|---|---|
| Fichiers dans `Category:Lingua Libre pronunciation-fra` (API Commons, `categoryinfo`) | **439 190** |
| Enregistrements français dans la base Lingua Libre (SPARQL) | **427 682** |
| Transcriptions distinctes (mots/expressions) | **251 552** |
| Locuteurs français distincts | **730** |

Locuteurs les plus prolifiques (enregistrements français, SPARQL) :
Jérémy-Günther-Heinz Jähnick 100 001 · WikiLucas00 52 039 · Lyokoï 38 220 · LoquaxFR 36 263 · Poslovitch 20 180 ·
Lepticed7 19 374 · DenisdeShawi 13 076 · Sartus85 11 412 · Mathieu Kappler 11 059 · Guilhelma 7 740 · Mecanautes 7 201.

Attention : **prolifique n'est pas pareil que « couvre le vocabulaire d'un enfant »**. Jérémy-Günther-Heinz Jähnick
(100 000 fichiers) ne dit que 117 des 303 mots d'EDUCA (je n'ai pas examiné ce que contiennent ses autres fichiers).

### A1.c Test sur les 10 mots demandés [TESTÉ — SPARQL, français uniquement]

| Mot | Nombre d'enregistrements (locuteurs différents) |
|---|---|
| chat | 33 |
| lune | 31 |
| moto | 8 |
| vélo | 22 |
| maison | 25 |
| papillon | 15 |
| éléphant | 15 |
| chocolat | 69 |
| girafe | 8 |
| bateau | 35 |

**Les 10 mots existent tous** (261 enregistrements au total). Locuteurs qui disent les 10 mots : **WikiLucas00,
Sartus85, Poslovitch** (10/10) ; LoquaxFR 9/10 ; la série Aemines1 à Aemines6 8/10 chacun ; Jérémy-Günther-Heinz
Jähnick 7/10.

### A1.d Couverture des 303 mots d'EDUCA par un seul locuteur [TESTÉ — SPARQL]

**Les 303 mots sont tous présents** dans Lingua Libre (au moins un locuteur chacun). Par locuteur :

| Locuteur | Mots d'EDUCA couverts (sur 303) | Total de ses enregistrements FR |
|---|---|---|
| **Poslovitch** | **268 (88 %)** | 20 180 |
| **Sartus85** | **267 (88 %)** | 11 412 |
| LoquaxFR | 245 (81 %) | 36 263 |
| WikiLucas00 | 220 (73 %) | 52 039 |
| DSwissK | 139 | 4 535 |
| Lepticed7 | 135 | 19 374 |
| Helenou66 | 118 | — |
| Jérémy-Günther-Heinz Jähnick | 117 | 100 001 |

### A1.e Qui est derrière les voix candidates, quelle licence ? [TESTÉ — API Commons `imageinfo` + SPARQL]

Vérification faite sur **tous** les fichiers couvrant les 303 mots (pas un échantillon) :

| Locuteur | Fichiers vérifiés | Licence (extmetadata Commons) | Attribution exigée ? | Durée moyenne | Poids WAV total | Genre / lieu déclarés |
|---|---|---|---|---|---|---|
| **Poslovitch** | 270 (268 mots) | **CC0 1.0 (270/270)** | **non** (`AttributionRequired=false`) | 1,0 s | 24,3 Mo | homme, Cornimont (Vosges) |
| Sartus85 | 269 (267 mots) | CC BY-SA 4.0 (269/269) | oui | 0,78 s | 20,2 Mo | homme, Vendée |
| LoquaxFR | 245 | CC BY-SA 4.0 (245/245) | oui | 0,80 s | 18,2 Mo | homme, Vosges |
| WikiLucas00 | 226 (220 mots) | CC BY-SA 4.0 (226/226) | oui | 0,97 s | 20,8 Mo | homme, Lyon |

- Format brut des fichiers [TESTÉ, métadonnées Commons] : **WAV PCM 16 bits, mono, 44,1 kHz**, ~0,7 à 1,1 s par mot,
  75 à 100 Ko par mot (705 kb/s).
- **Poslovitch est le meilleur choix** : (1) la couverture la plus large (268/303, 88 %) ; (2) licence **CC0**
  (domaine public : aucune obligation d'attribution, aucun « partage à l'identique », donc aucune contrainte sur la
  licence du dépôt ni sur les magasins d'applications) ; (3) un seul locuteur, voix d'adulte masculin de France
  métropolitaine ; (4) prises courtes et régulières (0,8 à 1,1 s). On mettra quand même son nom dans le fichier
  d'attributions (bonne pratique, et facilite le contrôle).
- Sartus85 / LoquaxFR / WikiLucas00 sont en **CC BY-SA 4.0** : utilisables mais avec attribution (nom du locuteur,
  lien Commons, licence) et partage à l'identique du dossier audio ; à n'utiliser que pour combler des trous, avec
  mention dans le fichier d'attributions.

### A1.f Les mots que Poslovitch ne dit pas [TESTÉ — SPARQL]

Poslovitch manque **35 mots** : boxe, chats, cygne, câlin, dodo, dorment, dort, fourmi, glaçon, hippopotame, lettre,
loutre, mamie, mange, me, mes, nage, nounours, page, panda, panier, papi, pingouin, pleut, poulpe, pré, que, requin,
règle, tigre, tournesol, trompette, télé, yoyo, écureuil.

- Sartus85 en comble 17, LoquaxFR 15, WikiLucas00 13. Poslovitch + Sartus85 = **285/303 (94 %)** ;
  + LoquaxFR = 289 ; + WikiLucas00 = 293.
- Après Poslovitch + Sartus85 il reste **18 mots** : boxe, chats, dodo, dorment, dort, loutre, mamie, mange, nage,
  nounours, papi, pingouin, pleut, poulpe, pré, règle, tournesol, yoyo. Ce sont surtout des formes conjuguées /
  pluriels (chats, dorment, dort, mange, nage, pleut) et des mots de la famille / enfantins (mamie, papi, dodo,
  nounours, yoyo) que les listes de Lingua Libre (centrées sur les « entrées de dictionnaire ») couvrent mal.
- Ces 18 à 35 mots se résolvent par : (a) la synthèse vocale de l'appareil (repli existant : aucun risque), ou
  (b) **un enregistrement fait par un humain volontaire (parent, enseignant)** via l'enregistreur déjà présent dans
  l'espace adulte, ou (c) Dave/un proche s'inscrit sur Lingua Libre et enregistre ces ~35 mots en CC0 (si l'outil
  d'enregistrement est toujours ouvert, voir A1.a ; c'est aussi un moyen de « donner en retour » ; la voix sera alors
  différente de Poslovitch, donc à réserver aux mots non critiques).
- Mots-outils très courts (« me », « mes », « que »…) : ils manquent isolément ; dans le jeu ils sont de toute façon lus
  dans une phrase (voir A2.d et A4.1), donc la synthèse peut les dire sans gêne.


### A1.g Décision : UNE voix pour les mots = Poslovitch (CC0)

| Critère | Poslovitch | Pourquoi c'est décisif |
|---|---|---|
| Couverture des 303 mots | **268 (88 %)** ; avec Sartus85 en secours : **285 (94 %)** | le plus large des 730 locuteurs français |
| Licence | **CC0 sur 270/270 fichiers** | aucune attribution ni partage à l'identique imposés ; compatible avec n'importe quelle licence du dépôt et des magasins |
| Format source | WAV mono 16 bits 44,1 kHz, 0,8 à 1,1 s par mot | exploitable tel quel, ~90 Ko/mot avant conversion |
| Voix | homme adulte, France (Vosges) | une seule voix cohérente pour tout le lexique |
| Limite | pas de voix de femme ni d'enfant | aucune locutrice déclarée ne couvre plus de 39 % des 303 mots (meilleure : Helenou66, 118) ; si Dave veut une voix féminine, il faudra l'enregistrer |

À écouter AVANT d'intégrer (je ne peux pas écouter depuis ce poste) : un contrôle d'oreille de l'enseignante ou de
l'orthophoniste sur les 268 fichiers, en particulier les **homographes** (« vis » nom ≠ verbe ; « est » verbe ≠ point
cardinal ; « os » ; « fait » ; « tout » ; « plus ») : Lingua Libre étiquette parfois le fichier d'un suffixe
(`vis (nom commun)`, `a (lettre)`), il faut alors choisir à la main — le script (Annexe 1) contient une table
`FORCE_FILE` pour cela.

---

## A2. Sons isolés (phonèmes) et syllabes — existe-t-il des enregistrements libres ?

Réponse courte : **non, pas de jeu complet et cohérent**. Il existe des morceaux utilisables, mais la voix de
référence pour les ~37 sons du jeu devra être **enregistrée** (section A4.6).

### A2.a Lingua Libre : syllabes [TESTÉ — SPARQL]

- Sur les **343 syllabes distinctes** des mots d'EDUCA (calculées avec `parseSeg`), 209 existent comme
  « transcription » dans Lingua Libre, mais presque toutes sont de **vrais mots** (blanc, rat, chien, nez…).
- Les vraies syllabes de lecture sont **sporadiques** : `ma` 5 enregistrements, `bi` 5, `sa` 4, `ta` 3, `fa` 3,
  `ci` 3, `ba` 1, `bu` 1, `be` 0, `bo` 0… Sur une grille de 80 syllabes (16 consonnes × 5 voyelles), seules ~45 existent,
  par des **locuteurs différents**, et une partie sont des mots (je, tu, si, va, de, la, du, lu…).
  → Aucune série `ba be bi bo bu` d'un même locuteur. **Les syllabes ne sont pas disponibles.**

### A2.b Lingua Libre : sons isolés [TESTÉ — SPARQL + `imageinfo`]

| Son | Enregistrements FR | Locuteurs en **CC0** | Durée | Remarque |
|---|---|---|---|---|
| `mmm` | 3 | Jules78120 (1,22 s), Mecanautes (1,48 s) | ~1,2-1,5 s | son continu, utilisable pour [m] |
| `sss` | 4 | Bananax47 (1,74 s), Jules78120 (1,31 s) | ~1,3-1,7 s | utilisable pour [s] |
| `zzz` | 2 | Jules78120 (1,22 s) | 1,2 s | utilisable pour [z] |
| `pfff` | 3 | Jules78120, Mecanautes | ~1,1 s | onomatopée, pas un phonème |
| `fff`, `vvv`, `chhh`, `jjj`, `lll`, `rrr`, `nnn` | **0** | — | — | **inexistants** |
| consonnes occlusives p t k b d g | impossibles seules | — | — | on ne les prononce pas sans voyelle d'appui |

(Orthographe exacte testée : `fff`, `vvv`, `chhh`, `jjj`, `lll`, `rrr`, `nnn` n'existent pas sous cette forme ;
d'autres graphies — `ffff`, `chchch`… — n'ont pas été essayées une à une.)

Cas des voyelles : **des mots d'un seul son existent** chez Poslovitch (CC0, vérifié par SPARQL) et peuvent servir de
voyelles isolées : `a` → [a], `y` → [i], `eau` → [o], `ou` → [ou], `et` → [é], `est` ou `ai` → [è], `on` → [on],
`an` ou `en` → [an], `un` → « in » (le jeu note `un>in`), `eu` → [u] (le participe de « avoir », prononcé [y]).
Soit **10 des 12 voyelles/nasales du jeu** (a, i, o, u, ou, é, è, on, an, in). Il manque le **e muet [ə]** et
**[ø] (« eux »)**. Attention : l'« eu » de Lingua Libre est le mot « eu » [y], pas le son [ø] du jeu. Les sons
composés (oi, oin, ui, ien) n'existent que dans des mots (« moi », « coin », « lui », « bien »).

Conséquence : on obtiendrait une **mosaïque de 5 à 6 voix différentes** pour les sons. Pour des enfants qui
apprennent à discriminer des sons, mieux vaut **une seule voix** (voir A4.6).

### A2.c Autres sources [TESTÉ pour les chiffres, [SOURCE] pour les licences]

- **Tableaux de l'API (IPA) sur Wikipédia/Commons** : fichiers `.ogg` de 0,6 à 2,6 s, **CC BY-SA 3.0**
  (Peter Isotalo pour les sibilantes, « Denelson83 présumé » pour les voyelles) et un CC0 (Nixinova, [v]). Ce sont
  des valeurs phonétiques **générales** (alphabet API), enregistrées par des contributeurs différents, pas des
  sons du français (8 fichiers examinés — voyelles [i] [a] [u], fricatives — ; je n'ai pas cherché les voyelles
  nasales une à une) ; qualité technique faible (13 Ko pour 0,6 s) et voix différente à chaque fichier. **Non
  recommandé** comme référence.
- **Shtooka « Base audio libre de mots français »** (Nicolas / zmoostik, 2006, ~7 000 mots, voix masculine unique,
  CC BY-SA 2.0) : la catégorie Commons « Audio files from Shtooka Project (French) » ne contient que 81 fichiers
  (surtout des noms de communes valdôtaines, pas cette base) ; le site `shtooka.moostik.net/dico-fr/` **ne renvoyait
  aucune page exploitable** le 13/10/2026 (redirection vers https puis réponse vide) et l'API Wayback n'a aucune
  copie. Piste historique, **inutilisable aujourd'hui**.
- **Kalulu / Unicog** : méthode publiée (guide « La pédagogie Kalulu » sur onlit.org) mais **aucun jeu de sons
  libre trouvé** ; le dépôt GitHub public `c24b/kalulu_app_br` (GPL-3.0) ne contient aucun fichier audio. Il faudrait
  écrire à l'association Onlit pour demander une licence — hors de portée immédiate.
- **Synthèse neuronale libre (Piper, etc.)** [non testée ici] : ces voix sont conçues pour des mots et des phrases ;
  je n'ai pas essayé de leur faire dire des consonnes tenues ou des occlusives isolées. Piste évoquée dans le journal,
  **non retenue** faute de preuve. Licences des voix Piper à vérifier au cas par cas.

### A2.d Phrases [TESTÉ — SPARQL]

Les **19 phrases du jeu : 0 trouvée** dans Lingua Libre (type « phrase » = Q10 existe, mais pas ces phrases).
Voir A4 pour les options (assemblage de mots, enregistrement, ou synthèse).

---

## A3. Mozilla Common Voice (CC0) — utile pour des phrases ?

Réponse : **non, pas pour EDUCA.** [SOURCE : plateforme Mozilla Data Collective, jeu « Common Voice Scripted Speech
25.0 — French »]

- Licence **CC0-1.0** (aucune restriction légale pour un usage commercial ou non) ; version 25.0 du 25/03/2026 ;
  format MP3 ; **28,39 Go** ; **864 728 clips**, **1 209,71 h** (1 095,87 h validées) ; **21 003 locuteurs**.
  Les jeux sont hébergés sur « Mozilla Data Collective » (ancienne adresse `datacollective.mozillafoundation.org`
  redirigée vers `mozilladatacollective.com`). La page est dynamique : **les conditions d'accès (compte, acceptation
  des conditions) n'ont pas pu être lues** ; à vérifier avant tout téléchargement.
- Pourquoi c'est inadapté : (1) 28 Go à télécharger pour extraire 19 phrases ; (2) les **phrases lues sont celles
  du corpus de Common Voice** (phrases d'adultes, plutôt longues, tirées de textes libres) [CONNU], pas des phrases
  décodables du CP : les 19 phrases d'EDUCA n'y sont presque sûrement pas ; (3) **chaque clip a un locuteur et un
  micro différents** (21 003 voix : bruit de fond, accents variés) [CONNU] : aucune cohérence de voix pour un enfant
  de 5 ans ; (4) pas de découpage par mot (il faudrait un alignement forcé).
- Usage possible mais secondaire : un locuteur très prolifique (même `client_id`) pourrait fournir des phrases
  si une phrase du corpus coïncidait avec une phrase du jeu — peu probable.
- Conclusion : pour les phrases, **assembler les mots de la même voix** ou garder la synthèse (Kaya la lit après
  l'enfant, qui lit lui-même le texte affiché).

---

## A4. Recommandation : la chaîne de production (testée de bout en bout)

Tout ce qui suit a été **exécuté pour de vrai** le 13/10/2026 dans un dossier temporaire (rien n'a été ajouté au
dépôt). Le script complet et testé est en **Annexe 1** (`scripts/voix-libre.mjs`, Node >= 20, zéro dépendance,
`ffmpeg` dans le PATH).

### A4.1 Décision

- **Voix des mots = Poslovitch (Lingua Libre, CC0)** : 268 des 303 mots d'EDUCA (88,4 %).
- **Mots manquants** : soit on les laisse à la synthèse vocale de l'appareil (repli déjà en place), soit on prend
  la voix de secours **Sartus85** (CC BY-SA 4.0 : +17 mots) puis LoquaxFR (+4) et WikiLucas00 (+4) = **293/303 (96,7 %)**.
  **Recommandation : phase 1 = Poslovitch seul** (`EDUCA_NO_FALLBACK=1`) : une seule voix, aucune obligation de
  licence, et on évite de mélanger 4 timbres. Phase 2 optionnelle après écoute.
- Les **10 mots sans voix humaine** (même avec les voix de secours) : boxe, chats, dorment, dort, mange, nounours,
  pleut, poulpe, pré, tournesol. Restent à la synthèse, ou à enregistrer par un volontaire.
- **Sons isolés (37) et phrases (19)** : pas de source libre cohérente (A2, A3) → enregistrement maison (A4.6).

### A4.2 Les commandes que Dave (ou la prochaine session) lancera

```bash
# 0. prérequis : Node >= 20 et ffmpeg  (Debian/Ubuntu : sudo apt install ffmpeg ; macOS : brew install ffmpeg)
EDUCA_NO_FALLBACK=1 node scripts/voix-libre.mjs fetch    # ~10 min (voir « limitation de débit » plus bas)
#   -> audio-src/*.wav + audio-src/mots.json (git-ignorés, hors des dossiers publiés), audio/ATTRIBUTIONS.md
#   ==> ÉCOUTER ici (enseignante / orthophoniste), corriger FORCE_FILE si un homographe est mauvais
node scripts/voix-libre.mjs encode                        # ~25 s -> audio/mots/*.mp3 + js/data/wordaudio.js
npm run release                                           # sw.js : ajoute les MP3 au cache hors-ligne
npm test && git add audio js/data/wordaudio.js sw.js      # puis commit
```

Intégration dans le jeu (≈ 15 lignes dans `js/services/voice.js`, à faire par `educa-dev`) : importer `WORD_FILES`,
et dans `seq()` pour une partie `{ word }` (ou dans `say()` quand le texte est un mot connu) : si
`WORD_FILES[mot]` existe, que le jeu n'est pas muet et pas en mode lecteur d'écran, jouer
`audio/mots/<fichier>.mp3` avec `playFile()` (déjà présent) ; sinon synthèse. Le **ralenti** (`slowWord`) se fait avec
`audio.playbackRate = 0.85` ; `audio.preservesPitch` (propriété standard des éléments `<audio>`, vraie par défaut)
évite que la voix devienne plus grave (à vérifier sur iOS).

### A4.3 Résultats mesurés sur les 293 mots téléchargés et convertis

| Mesure | Avant (WAV Lingua Libre) | Après (MP3 EDUCA) |
|---|---|---|
| Niveau sonore (écart p10-p90) | **6,8 LU** (de -24,2 à -17,4 LUFS ; le plus faible : -32,1 pour « du ») | **0,2 dB de RMS** (tous à -20,4 dB) ; 1,6 LU en LUFS mesurable (clips >= 0,5 s) |
| Crête maximale | jusqu'à -0,1 dBFS (12 fichiers au-dessus de -1 dBFS) | **-1,4 dBFS** au pire, aucun écrêtage |
| Silence avant le mot | médiane **0,21 s** (276/293 fichiers) | médiane **0,03 s** |
| Durée d'un mot | médiane 0,97 s (total 288,8 s) | médiane 0,67 s (total **203 s**, soit -30 %) |
| Poids | 24,3 Mo (Poslovitch seul : 270 WAV) | **869 Ko** pour 293 fichiers (2,97 Ko/fichier ; Poslovitch seul : **808 Ko**) |
| Lecture dans un navigateur | — | **Chromium (headless) : 10 fichiers sur 10 décodés, durées 0,53 à 0,89 s, lecture jusqu'à la fin** |

- Budget total estimé (audio) : mots 0,81 Mo + 37 sons (~1,2 s) ~0,18 Mo + 19 phrases (~3 s) ~0,23 Mo = **~1,2 Mo**.
  Le cache hors-ligne actuel fait **0,62 Mo** (mesuré sur la liste de `sw.js`) : il passerait à ~1,9 Mo, ce qui reste
  très raisonnable pour une appli installée.
- **Piège découvert : `loudnorm` (EBU R128) échoue sur les mots très courts.** Il faut >= 400 ms pour mesurer ; sur
  « est » (0,36 s), « pain » (0,38 s), « tout » (0,43 s) il a donné -70 LUFS / +4,6 LU de trop. Remplacé par une
  mesure du niveau efficace (RMS) puis un gain fixe + limiteur de crêtes (`alimiter`), en deux passes. Résultat ci-dessus.
- **Limitation de débit de Wikimedia** : `upload.wikimedia.org` a répondu **HTTP 429 (Too Many Requests)** après une
  dizaine de fichiers à 4 requêtes par seconde, puis à plusieurs reprises (14 pauses de 11 s sur le 2e passage). Le
  script applique donc : `User-Agent` descriptif, une requête à la fois, 0,7 s entre deux fichiers, et reprise
  automatique avec `Retry-After` / attente croissante (6 essais). Ne pas paralléliser.
- Les 4 requêtes SPARQL (une par locuteur) et les 6 requêtes `imageinfo` (50 titres chacune) passent sans problème.

### A4.4 Quel format pour iOS et Android ?

| Format | iOS Safari | Chrome / WebView Android | Poids (mot ~0,7 s) | Verdict |
|---|---|---|---|---|
| **MP3 mono 24 kHz 32 kb/s** | oui depuis iOS 4 [caniuse] | oui | ~3 Ko | **retenu** : universel, déjà le format attendu par `voice.js` |
| AAC (.m4a) | oui | oui | non mesuré | aucun avantage attendu à ce débit ; non testé |
| Opus (.ogg/.opus) | **complet seulement depuis iOS 18.4** (partiel avant : WebM ou CAF, avec un bug connu) [caniuse] | oui | ~2 Ko | à écarter : les vieux iPad des écoles ne le liraient pas, et le gain est de quelques centaines de Ko |

Le coupe-silences (`silenceremove`) et les fondus de 5 ms / 20 ms évitent les « clics » au début et à la fin. L'en-tête
Xing/LAME est conservé (il indique aux décodeurs le retard de l'encodeur MP3, de quelques dizaines de ms, pour
qu'ils le suppriment ; `-write_xing 0` l'aurait enlevé).

### A4.5 Fichier d'attributions (obligatoire)

- Généré par le script : `audio/ATTRIBUTIONS.md` (locuteur, licence, lien vers la page Commons de **chaque** mot).
  Il est copié dans le site publié (déjà couvert par la copie du dossier `audio/` de la CI).
- **CC0 (Poslovitch)** : aucune obligation légale, mais on le crédite (bonne pratique et traçabilité).
- **CC BY-SA 4.0 (voix de secours)** : attribution **obligatoire** (nom du locuteur, lien vers le fichier Commons et la
  licence, mention « modifié : coupe des silences, volume, MP3 ») ; les fichiers adaptés doivent rester sous
  CC BY-SA 4.0 (le dossier `audio/` seulement : le code reste MIT). Un simple changement de format est une
  « modification technique » au sens de la licence 4.0, mais la coupe et la normalisation sont des adaptations : on
  applique donc la règle stricte. [TESTÉ : texte officiel `legalcode.txt` de CC BY-SA 4.0 — §2(a)(4) « technical
  modifications allowed », §3(a)(1) « indicate if You modified the Licensed Material », §3(b) ShareAlike]
- À ajouter : une ligne dans `README.md` (« Crédits et licences ») et un lien « Crédits » dans l'espace des grands.

### A4.6 Pour les 37 sons purs (et les ~35 mots manquants) : enregistrer une voix de référence

Constat : il n'y a pas de source libre cohérente. Trois façons de procéder, de la plus simple à la plus ambitieuse :

1. **Garder l'existant** (consonnes synthétisées en WebAudio, voyelles par synthèse vocale) : aucun coût, qualité
   correcte pour [m] [s] [f] [ch] [v] [z] [j] [l] [r] [n].
2. **Utiliser les mots d'un seul son de Poslovitch pour 10 voyelles** (a, i via « y », o via « eau », u via « eu »,
   ou, é via « et », è via « est », on, an, in via « un ») : gratuit, CC0, même voix que les mots. Mélange avec des
   consonnes synthétisées : à écouter.
3. **Faire enregistrer les 37 sons par une personne** (enseignante, orthophoniste, parent ; ~20 min, 2 prises par son)
   avec un téléphone posé à 15 cm de la bouche dans une pièce calme, WAV mono. Deux voies : (a) **Lingua Libre**
   (enregistrement dans le navigateur, avec passage automatique au mot suivant au silence, publication automatique sur
   Commons sous la licence choisie, CC0 conseillé ; **vérifier d'abord que l'assistant d'enregistrement est toujours
   ouvert**, le wiki d'origine ayant été archivé — voir A1.a) —
   les sons seraient alors récupérés par le même script en ajoutant l'identifiant du locuteur ; à confirmer auprès de
   Wikimédia France que des sons non-mots (« mmm », « p » soufflé) sont acceptés ; (b) l'enregistreur déjà présent
   dans l'espace des grands, qui stocke dans IndexedDB **sur l'appareil seulement** : il faut y ajouter un bouton
   « Exporter les sons » pour récupérer les fichiers et les intégrer au dépôt (`audio/sons/<id>.mp3`, hook déjà prévu).
   Consigne orthophonique à valider par `educa-orthophoniste` : occlusives (p t k b d g) dites **sans voyelle d'appui
   audible** (souffle bref), consonnes continues tenues ~1 s, jamais « me » pour [m].

### A4.7 Risques et vérifications à prévoir

- **Écoute humaine obligatoire** avant intégration (je n'ai pas pu écouter) : 268 fichiers, en priorité les homographes.
  Un échantillon de 10 mots a été vérifié techniquement (licence, durée, niveau, décodage), pas à l'oreille.
- **iOS** (à tester sur un vrai iPhone/iPad, non testable ici) : (1) la première lecture d'un `<audio>` exige un geste de
  l'utilisateur — c'est déjà le cas (le jeu démarre par « Jouer ») ; (2) réutiliser un petit nombre d'éléments `Audio`
  ou passer par Web Audio (`decodeAudioData`) évite des refus de lecture sur d'anciens iOS ; (3) vérifier l'effet du
  commutateur « silence » de l'iPhone sur `<audio>`, Web Audio et `speechSynthesis` (comportements différents selon
  les versions). [DÉDUIT / à tester]
- **Voix mixte** : si les phrases restent à la synthèse, l'enfant entend deux « voix » (humaine pour les mots, machine
  pour les phrases). Acceptable en phase 1 ; à lisser en enregistrant les 19 phrases.
- **Licence du dépôt** : `LICENSE` (MIT provisoire) couvre le code ; le dossier `audio/` a ses propres licences
  (CC0 / CC BY-SA 4.0) : le dire dans `README.md`.

---

# PARTIE B — Application mobile

## B0. Ce que le code d'EDUCA impose comme contraintes [TESTÉ — lecture du code, `grep`]

- **La voix de Kaya dépend de `window.speechSynthesis`** (`js/services/voice.js` : `synth = typeof speechSynthesis !==
  'undefined' ? speechSynthesis : null`). Sans lui, le statut devient `unsupported` : **le jeu devient muet** (il reste les
  sous-titres et les sons WebAudio). C'est donc LE critère de choix de l'enveloppe mobile.
- Le service worker est enregistré avec garde (`'serviceWorker' in navigator && location.protocol !== 'file:'`,
  `js/main.js:114`) : il ne plantera pas dans une enveloppe qui n'en a pas.
- `navigator.storage.persist()` est déjà demandé (`js/screens/welcome.js:114`) ; les profils sont dans `localStorage`
  (`js/services/store.js`), avec export/import de sauvegarde dans l'espace des grands.
- **Aucun lien sortant** (`target="_blank"`, `http…`, `window.open` : zéro occurrence dans `js/`, `index.html`, `css/`) :
  la règle « pas de liens hors de l'appli » de la catégorie Enfants d'Apple est déjà respectée.
- Fonctions sensibles pour une enveloppe native : **l'enregistrement au micro** (`getUserMedia`, espace adulte) et
  **l'export de sauvegarde** (téléchargement d'un fichier) — à tester dans chaque enveloppe (voir B2).
- **Mise en page** : colonne centrée de 760 px max, sans règle `orientation` ; seul `manifest.json` impose
  `"orientation": "portrait"` — pénible sur une tablette de classe posée en paysage.
- **Icônes** : `icons/icon-512.png` est déclarée `"any maskable"` mais **n'est pas utilisable comme maskable** : coins
  arrondis transparents, et la pointe de l'étoile est à **230 px du centre** alors que la zone de sécurité d'une icône
  adaptative Android est un cercle de **204,8 px** (80 % de 512) : l'étoile serait rognée. Et `apple-touch-icon` pointe
  vers `icon-192.png` (coins transparents) : iOS remplit la transparence en noir.
- **Adresse de publication** [TESTÉ 13/10/2026] : `https://daveinout.github.io/edugame/` répond **200** (c'est l'ancienne
  v1, publiée depuis `main`). `https://daveinout.github.io/` répond **404**, le dépôt `DaVeinOUT/DaVeinOUT.github.io`
  **n'existe pas**, et l'API officielle Digital Asset Links répond pour ce site :
  `ERROR_CODE_FETCH_ERROR … 404 Not Found https://daveinout.github.io/.well-known/assetlinks.json`.

## B1. Android : TWA, Capacitor ou WebView maison ?

### B1.a La question cruciale : `speechSynthesis` selon l'enveloppe [TESTÉ — MDN browser-compat-data, branche main, 13/10/2026]

| Environnement | `SpeechSynthesis` / `getVoices` |
|---|---|
| Chrome pour Android (donc **une TWA**) | **oui** (reprend Chrome 33) |
| Samsung Internet | oui (3.0) |
| **Android WebView** (donc **Capacitor Android** et toute « WebView maison ») | **non** — `version_added: false`, bogue Chromium suivi sous `crbug.com/40417848` |
| Safari iOS / WKWebView (donc **Capacitor iOS**) | oui (reprend Safari 7) |

Conséquences :
- **TWA** : la voix de Kaya marche telle quelle (c'est le Chrome du téléphone, avec ses voix : « Reconnaissance et
  synthèse vocales Google » ou celle du constructeur ; la voix française locale doit être installée — le code gère déjà
  `voiceschanged`, le choix d'une voix locale et le repli sans voix).
- **Capacitor Android / WebView maison** : `speechSynthesis` **n'existe pas** → le jeu serait muet. Il faut le plugin
  **`@capacitor-community/text-to-speech`** (v8.0.2 du 15/06/2026, MIT, compatible Capacitor >= 8, entretenu ; API :
  `speak({ text, lang, rate, pitch, volume, voice, category, queueStrategy })`, `stop()`, `getSupportedVoices()`,
  `getSupportedLanguages()`, `isLanguageSupported()`, `openInstall()`), et une **couche d'adaptation dans
  `voice.js`** (Annexe 5). Alternative : `@capgo/capacitor-speech-synthesis` (v8.0.25 du 09/10/2026, MPL-2.0).

### B1.b Comparaison

| Critère | **TWA (Bubblewrap / PWABuilder)** | Capacitor 8 | WebView maison |
|---|---|---|---|
| Moteur | Chrome du téléphone | Android System WebView | Android System WebView |
| Voix de Kaya | **oui, sans rien changer** | non : plugin TTS + adaptateur | non : à coder en Kotlin |
| Hors-ligne | service worker existant (fait) | fichiers embarqués dans l'appli | idem |
| Mise à jour du jeu | **instantanée** (la mise à jour sous contrôle d'EDUCA s'applique) | **nouvelle version à publier** à chaque changement | idem |
| Données des enfants | stockage du site dans Chrome : « effacer les données de Chrome » les supprime | stockage de l'appli | idem |
| Micro (voix de l'adulte) | invite de permission de Chrome | à déclarer (`RECORD_AUDIO`) et à tester | idem |
| Outils côté Dave | Node >= 18 ; Bubblewrap télécharge JDK + SDK | Node >= 22 ; Android Studio >= 2025.2.1 ; SDK >= API 24 | Android Studio + Kotlin |
| Exigence particulière | **`assetlinks.json` à la racine de l'origine** (problème GitHub Pages, B3) | aucune | aucune |
| Permissions Android | **0** (mesuré, voir B3) | à déclarer | à déclarer |
| Maintenance | quasi nulle | moyenne (synchronisation, plugins) | élevée |
| Risque « simple site web » (Play, règle des Familles) | modéré : PWA installable et hors-ligne | modéré à faible (contenu embarqué) | identique à Capacitor |

**Recommandation Android : TWA avec Bubblewrap.** C'est la seule option qui garde la voix de Kaya sans toucher au
code, qui se met à jour sans repasser par le Play Store, et qui n'ajoute aucune permission. Capacitor est le **plan B**
(si Google refuse la TWA, ou si Dave veut un même code natif pour Android et iOS). Une WebView maison n'apporte rien de
plus que Capacitor et coûte plus cher : **à écarter**.

Réserve : le « bandeau Chrome est utilisé » au premier lancement est normal ; une barre d'adresse visible signifie que
les Digital Asset Links sont faux [SOURCE : FAQ PWABuilder].

## B2. iOS : options réalistes

| Option | Coût / prérequis | `speechSynthesis` | Hors-ligne | Verdict |
|---|---|---|---|---|
| **PWA « Sur l'écran d'accueil »** (Safari > Partager > Sur l'écran d'accueil) | **gratuit**, aucun compte | oui (Safari) | oui (service worker) | **à proposer d'emblée** |
| **Capacitor iOS** (WKWebView, fichiers embarqués) | Mac + **Xcode >= 26** ; **99 USD/an** (Apple Developer Program) | oui (WKWebView) ; plugin TTS facultatif | embarqué (le service worker n'y est pas nécessaire) | seulement si une présence sur l'App Store est voulue |
| PWABuilder iOS | Mac + Xcode + 99 USD/an | oui | « WebView qui charge la PWA » : dépend du réseau et du service worker | **déconseillé** : la doc PWABuilder le qualifie d'**expérimental** et dit que l'acceptation « dépend de l'UI/UX de votre PWA et de l'usage de capacités natives » |

### B2.a Pourquoi la PWA sur l'écran d'accueil est correcte pour les données [SOURCE : blog WebKit « Full Third-Party Cookie Blocking and More »]
Safari supprime tout le stockage accessible par script (IndexedDB, localStorage, enregistrements de service worker) d'un
site « après sept jours d'utilisation de Safari sans interaction avec le site ». **Les applications web ajoutées à l'écran
d'accueil ont leur propre compteur**, remis à zéro à chaque utilisation : leurs données ne sont donc pas effacées en
pratique. Consigne à donner aux parents et aux classes : **installer EDUCA sur l'écran d'accueil, ne pas l'utiliser dans
un onglet Safari** ; et exporter une sauvegarde de temps en temps (déjà prévu).

### B2.b Règles de l'App Store [SOURCE : App Review Guidelines, developer.apple.com, 13/10/2026]
- **4.2 Fonctionnalité minimale** : l'appli doit offrir « des fonctions, du contenu et une interface qui la placent
  au-delà d'un site web reconditionné ». EDUCA est autonome (contenu embarqué, hors-ligne, jeu complet) mais une simple
  WebView risque une remarque : atténuer avec des capacités natives utiles (partage natif pour l'export de sauvegarde, voix
  native, retours haptiques). **4.2.2** : pas de « web clippings » ni de collection de liens.
- **1.3 Catégorie Enfants** : pas de liens sortants, d'achats ou autres distractions hors d'une zone derrière une
  **barrière parentale** ; ne pas envoyer d'informations personnelles ou d'appareil à des tiers ; **pas d'analytique ni de
  publicité tierces** (cas limités sous conditions). EDUCA : aucun lien sortant (mesuré), aucun tiers → conforme.
  Le « petit défi de lecture » de l'espace des grands joue le rôle de barrière.
- **5.1.4 Enfants** : respecter COPPA et RGPD ; politique de confidentialité obligatoire.
- **5.1.1(i)** : lien vers la **politique de confidentialité dans App Store Connect ET dans l'appli**, d'accès facile.
  Aujourd'hui `CONFIDENTIALITE.md` n'existe que dans le dépôt : il faut une **page web publique** (ex.
  `confidentialite.html`) et un lien dans l'espace des grands.
- **« Étiquette de confidentialité »** App Store Connect : « Données non collectées » (EDUCA ne collecte rien).
- **2.5.6** : les apps qui affichent du web doivent utiliser WebKit (c'est le cas avec WKWebView).
- Points techniques à tester avec Capacitor iOS [DÉDUIT, non testable ici] : (1) le micro exige
  `NSMicrophoneUsageDescription` dans `Info.plist` ; (2) le **téléchargement d'un fichier de sauvegarde** par un lien
  `download`/blob ne marche pas toujours dans WKWebView : prévoir le partage natif (`@capacitor/share` +
  `@capacitor/filesystem`) ; (3) le service worker n'est pas disponible sous le schéma `capacitor://localhost` (garde déjà
  en place) ; (4) vérifier l'effet du commutateur « silence » sur WebAudio / `<audio>` / voix.

## B3. Google Play : exigences pour une TWA

### B3.a Digital Asset Links — LE point bloquant avec GitHub Pages
- Règle officielle [SOURCE : developers.google.com/digital-asset-links] : le fichier doit être à
  `https://<site>/.well-known/assetlinks.json` ; « les listes d'énoncés à tout autre emplacement, ou avec un autre nom,
  ne sont pas valides ». La FAQ PWABuilder le précise pour une PWA dans un sous-dossier : fichier à
  `https://<domaine>/.well-known/assetlinks.json`, **pas** dans `https://<domaine>/<pwa>/.well-known/`.
- Or EDUCA est une **page de projet** : origine `https://daveinout.github.io`, chemin `/edugame/`. Un
  `.well-known/` placé dans le dépôt `edugame` serait servi à `/edugame/.well-known/` : **invalide**. Deux solutions :

| Solution | Coût | Détails | Pour / contre |
|---|---|---|---|
| **A. Dépôt « site utilisateur »** `DaVeinOUT/DaVeinOUT.github.io` contenant `.well-known/assetlinks.json` et un fichier vide `.nojekyll` | **gratuit** | l'origine reste `daveinout.github.io`, `startUrl` = `/edugame/index.html` | rapide ; mais l'origine (donc le paquet Android) est liée à GitHub **pour toujours** |
| **B. Domaine personnalisé** pointé vers le site Pages du projet | ~10-15 EUR/an (ordre de grandeur, non vérifié) | le projet est alors servi à la **racine** du domaine, le `.well-known/` du dépôt `edugame` suffit (CI : `include-hidden-files`) | **recommandé** : l'adresse de l'appli installée est durable et on peut changer d'hébergeur sans republier l'appli |

  Dans les deux cas : l'adresse choisie est **gravée dans l'APK** (champ `host`) ; la changer plus tard oblige à publier
  une nouvelle appli. À décider **avant** `bubblewrap init`.
- **CI** : `actions/upload-pages-artifact` **exclut par défaut tout fichier ou dossier commençant par un point** (donc
  `.well-known`) depuis la v4 ; la version courante est la **v5.0.0** ; l'option est `include-hidden-files: true`
  [TESTÉ : `action.yml` de l'action, branche main]. La CI actuelle utilise `@v3` : à mettre à jour ET à régler, sinon
  le fichier ne sera pas publié le jour où Dependabot montera la version. Il faut aussi ajouter `.well-known` à la copie
  `cp -r … _site/` (rien n'est copié aujourd'hui).
- Contrôle : `curl -s 'https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://<origine>&relation=delegate_permission/common.handle_all_urls'`
  [TESTÉ : l'API répond ; aujourd'hui elle renvoie l'erreur 404 pour `daveinout.github.io`]. GitHub Pages sert bien les
  `.json` en `application/json` [TESTÉ].
- **Deux empreintes SHA-256** dans `sha256_cert_fingerprints` : celle de la clé d'**envoi** (keystore créé par Bubblewrap)
  **et** celle de la clé de **signature d'application de Google Play** (Console Play > Configuration > Intégrité de
  l'application) ; sinon la barre d'adresse apparaît [SOURCE : FAQ PWABuilder]. Après un changement, vider le cache de
  Chrome (désinstaller ne suffit pas).
- **Sauvegarder le keystore** (`android.keystore` + mots de passe) hors du dépôt : sa perte oblige à une procédure de
  réinitialisation de clé d'envoi auprès de Google.

### B3.b Ce que Bubblewrap produit [TESTÉ — `@bubblewrap/core` 1.27.0 installé dans un dossier temporaire]
- Le gabarit `twa-manifest.json` de l'Annexe 4 est **validé** par `TwaManifest.validate()` (retour `null` = aucune erreur),
  et `TwaGenerator` a généré le projet Android (1,8 Mo) **sans** SDK.
- `compileSdkVersion 36`, **`targetSdkVersion 36`** : conforme à l'exigence Google Play du **31/08/2026** (les nouvelles
  applis et mises à jour doivent cibler Android 16 / API 36 ; prolongation possible jusqu'au 01/11/2026)
  [SOURCE : developer.android.com/google/play/requirements/target-sdk].
- `AndroidManifest.xml` : **0 balise `uses-permission`** ; un `intent-filter autoVerify` limité à
  `pathPrefix="/edugame/"` ; bibliothèque `androidbrowserhelper 2.7.4`. Bonne nouvelle pour le formulaire « Sécurité des
  données » : rien n'est collecté ni demandé. Mettre `enableNotifications: false` (défaut : `true`).
- Version courante de l'outil : **`@bubblewrap/cli` 1.27.0** (09/10/2026, Apache-2.0).

### B3.c Manifeste web, icônes, captures
- Manifeste : `name`, `short_name`, `start_url`, `scope`, `display: standalone`, couleurs, `lang: fr` existent déjà ;
  à ajouter : **icône `maskable` séparée** (512 px, plein cadre, contenu dans le cercle de 80 %), `categories`,
  `screenshots` (facultatif pour Play, utile pour l'installation Chrome), même `theme_color` dans le manifeste et la
  balise `<meta>`, et lever `orientation: portrait` (voir B0).
- J'ai **généré et vérifié à l'œil** une icône maskable de test (`make-icons.mjs`, Annexe 3) : fond plein cadre, contenu
  réduit à 72 % ⇒ la pointe de l'étoile est à **165 px** du centre (limite 204,8). Même script pour une
  `apple-touch-icon` 180x180 sans transparence.
- Fiche Play (valeurs usuelles, **à confirmer dans la console**, non vérifiées ici) : icône 512x512 PNG ; image de
  présentation 1024x500 ; au moins 2 captures téléphone (idéalement aussi 7" et 10" pour les tablettes de classe) ;
  description courte <= 80 caractères ; **URL de la politique de confidentialité** ; catégorie « Éducation » ;
  questionnaire de classification (IARC) ; déclaration de publics cibles ; formulaire « Sécurité des données » ;
  déclaration « aucune publicité ».

### B3.d Programme Familles, COPPA, RGPD
- **Politique Familles de Google Play** [SOURCE : support.google.com/googleplay/android-developer/answer/9893335,
  résumé automatique à relire] : déclarer le public cible (section « Public cible et contenu ») ; contenu adapté aux
  enfants ; **interdiction des « webviews » simples sans valeur ajoutée** ; ne transmettre ni identifiant publicitaire
  ni IMEI/MAC/SIM ; pas de localisation précise ; n'utiliser que des API/SDK approuvés pour enfants ; pas de publicité
  personnalisée ; politique de confidentialité exacte ; respect de COPPA et du RGPD ; **« les mêmes exigences
  s'appliquent aux contenus accessibles par WebView/TWA »**. Pour une appli ciblant enfants **et** plus grands : écran
  de choix d'âge **neutre**.
  → EDUCA vise 4 à 15 ans. Choix à faire par Dave : déclarer **seulement 5 à 12 ans** (simple), ou inclure 13-15 ans
  (alors audience mixte, donc écran d'âge neutre ; l'âge demandé à la création du profil sert aujourd'hui au niveau de
  départ, pas à restreindre des fonctions).
- **COPPA** [SOURCE : cabinets d'avocats, avril-mai 2025] : règle modifiée **publiée le 22/04/2025, en vigueur le
  23/06/2025, conformité exigée au 22/04/2026** (donc applicable aujourd'hui) : consentement spécifique pour la publicité
  ciblée, informations aux parents sur les tiers, conservation et sécurité renforcées. **EDUCA ne collecte et ne transmet
  rien** : à ma connaissance (hors avis juridique) les obligations de consentement parental ne sont pas déclenchées ;
  reste la politique de confidentialité.
- **RGPD** : aucun traitement de données hors de l'appareil. Seul point sensible : une **voix « en ligne »** du
  téléphone peut envoyer le texte (prénom compris) au service du fabricant ; `voice.js` choisit déjà une voix locale en
  priorité et `CONFIDENTIALITE.md` le dit. À conserver dans la politique publiée.
- **Compte Play Console** [SOURCE : aide Google Play officielle] : frais d'inscription **25 USD, une fois** ; pour un compte
  **personnel créé après le 13/11/2023** : **au moins 12 testeurs inscrits pendant 14 jours consécutifs** en test fermé
  avant de demander l'accès à la production (examen en général <= 7 jours). Un compte « organisation » (numéro D-U-N-S)
  n'est, d'après des guides tiers, pas soumis à cette règle (à confirmer). Le nom du développeur est public.

## B4. Recommandation concrète

### B4.1 Décisions recommandées

1. **Android d'abord, en TWA (Bubblewrap)** : voix de Kaya intacte, aucune permission, mises à jour instantanées.
2. **iOS : PWA sur l'écran d'accueil dès maintenant** (gratuit) ; App Store via **Capacitor** seulement si Dave veut y
   être présent (Mac, Xcode >= 26, 99 USD/an, règle 4.2 à surveiller).
3. **Choisir l'adresse définitive AVANT de publier** : **domaine personnalisé recommandé** (solution B) ; à défaut le
   dépôt `DaVeinOUT/DaVeinOUT.github.io` (solution A, gratuite).
4. **Mettre à niveau le dépôt maintenant** (rien ne coûte) : manifeste, icônes maskable/Apple, page publique de
   confidentialité, script `build-site`, CI (`include-hidden-files`), gabarits `twa/`.
5. **Capacitor = plan B**, avec la couche `tts-shim.js` (Annexe 5, testée avec un faux plugin) qui évite de toucher à
   `voice.js`.

### B4.2 Commandes que Dave lancera sur sa machine (Android, TWA)

```bash
# Prérequis : Node >= 18. Bubblewrap propose de télécharger lui-même le JDK et le SDK Android (accepter les licences).
npm i -g @bubblewrap/cli                      # version testée : 1.27.0 ; ne pas utiliser sudo
bubblewrap doctor                              # vérifie JDK / SDK
mkdir twa-build && cd twa-build
cp ../twa/twa-manifest.json .                  # gabarit validé (Annexe 4) : corriger host / startUrl / packageId
bubblewrap update                              # génère le projet Android à partir de twa-manifest.json
#   (variante interactive : bubblewrap init --manifest https://<origine>/manifest.json, puis comparer)
bubblewrap build                               # crée android.keystore (SAUVEGARDER + mots de passe) puis
                                               #   app-release-bundle.aab (pour Play) et app-release-signed.apk (pour tester)
bubblewrap fingerprint list                    # empreinte SHA-256 de la clé d'ENVOI
bubblewrap install                             # essai sur un téléphone branché (adb) : barre d'adresse absente = liens vérifiés
# Console Play : créer l'appli, envoyer le .aab en « test interne », lire Configuration > Intégrité de l'application >
#   « Certificat de la clé de signature d'application » (SHA-256), puis :
bubblewrap fingerprint add <SHA-256 de la clé de signature Google Play> --name=play-signing
bubblewrap fingerprint generateAssetLinks --output=assetlinks.json
#   -> publier assetlinks.json à https://<origine>/.well-known/assetlinks.json  (voir B3.a)
curl -s 'https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://<origine>&relation=delegate_permission/common.handle_all_urls'
```
Pour une mise à jour : `bubblewrap update --appVersionName=1.0.1` puis `bubblewrap build` (le numéro de version
`appVersionCode` augmente seul). Le contenu du jeu, lui, se met à jour sans republier l'appli.

### B4.3 Ce qui demande un compte (et son coût)

| Poste | Coût | Quand |
|---|---|---|
| Compte développeur Google Play | **25 USD, une fois** [SOURCE : guides 2026 ; aide Google Play] | pour publier sur Android |
| Test fermé : 12 testeurs x 14 jours (compte **personnel** créé après le 13/11/2023) | 0 EUR, ~3 semaines de délai [SOURCE : aide Google Play officielle] | avant l'accès à la production |
| Compte Apple Developer Program | **99 USD / an** (exonération possible pour les organisations à but non lucratif) [SOURCE : doc PWABuilder] | seulement pour l'App Store |
| Mac avec Xcode >= 26 | matériel (ou CI macOS) | seulement pour l'App Store |
| Nom de domaine (solution B) | ~10-15 EUR / an (ordre de grandeur, non vérifié) | avant `bubblewrap init` |
| GitHub Pages, ffmpeg, Bubblewrap, Capacitor, Lingua Libre | 0 | — |

Hors magasin : un APK signé (`app-release-signed.apk`) peut être installé à la main ou déployé par la gestion des
tablettes d'une école, sans compte Google ; les parents doivent alors autoriser les sources inconnues. À noter : la
politique de Google sur la vérification des développeurs d'applications installées hors Play évolue en 2026 — à
re-vérifier avant de promettre cette voie (non étudié ici).

### B4.4 Liste d'essais sur appareils réels (non faisables depuis ce poste)
1. Voix de Kaya : téléphone Android avec voix française locale **installée** et sans ; avion activé ; vérifier qu'aucune
   voix « réseau » n'est choisie.
2. TWA : pas de barre d'adresse (liens vérifiés), pas de bandeau persistant, bouton retour, rotation (orientation).
3. Micro de l'espace adulte (permission Chrome) ; export / import de sauvegarde.
4. Mise à jour du jeu sans republier l'appli ; mode avion complet.
5. iPhone/iPad : installation sur l'écran d'accueil, voix, premier son (geste), commutateur silence, données après
   plusieurs jours.
6. Effacement des données de Chrome : vérifier le message à l'enfant/parent et l'import de sauvegarde.

---

# ANNEXES (gabarits testés ; copies de travail dans le dossier temporaire de la session :
`/tmp/claude-0/-root-projets-edugame/464de156-abaa-4483-88e6-96247c305755/scratchpad/`)

## Annexe 1 — `scripts/voix-libre.mjs` (testé de bout en bout le 13/10/2026)

Utilisation : voir A4.2. Résultat mesuré : 293/303 mots téléchargés (268 en mode une seule voix avec
`EDUCA_NO_FALLBACK=1`), convertis en 25 s, 869 Ko, lus par Chromium. Les WAV vont dans `audio-src/` (**hors** de
`audio/` pour ne pas être publiés ni mis en cache hors-ligne : `release.mjs` parcourt tout `audio/`).

```js
#!/usr/bin/env node
/* ============================================================
   scripts/voix-libre.mjs — voix humaine libre pour EDUCA
   Télécharge, pour les mots du jeu, les enregistrements d'UN SEUL locuteur
   de Lingua Libre (Wikimedia Commons), vérifie leur licence, écrit le
   fichier d'attributions, puis (commande « encode ») les convertit en MP3.

     node scripts/voix-libre.mjs fetch    # audio-src/*.wav + audio-src/mots.json (ignorés par git) + audio/ATTRIBUTIONS.md
     node scripts/voix-libre.mjs encode   # audio-src/*.wav -> audio/mots/*.mp3 + js/data/wordaudio.js

   Aucune dépendance (Node >= 20 : fetch intégré ; ffmpeg dans le PATH pour « encode »).
   Variables : EDUCA_ROOT (racine du dépôt), EDUCA_OUT (dossier de sortie), FFMPEG (binaire).
   ============================================================ */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.env.EDUCA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.EDUCA_OUT || ROOT;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
/* Les WAV sources (~25 Mo) restent HORS des dossiers publiés (audio/ est copié tel quel par la CI et mis en cache hors-ligne). */
const SRC_DIR = 'audio-src';

/* Wikimedia exige un User-Agent qui dit qui parle (sans donnée personnelle). */
const UA = 'EDUCA-voix-libre/1.0 (https://github.com/DaVeinOUT/edugame; outil de recherche de prononciations libres)';
const SPARQL = 'https://lingualibre.org/bigdata/namespace/wdq/sparql';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const PAUSE_MS = 700;                    // politesse : une requête à la fois, ~1,4 fichier/s
const MAX_TRIES = 6;                     // 429 / 503 : on attend (Retry-After) puis on réessaie
const BATCH = 50;                        // titres par requête imageinfo

/* Voix principale (CC0) puis voix de secours (CC BY-SA 4.0), par identifiant Lingua Libre.
   EDUCA_NO_FALLBACK=1 : une seule voix (les mots manquants restent à la synthèse vocale). */
const PRIMARY = { id: 'Q142683', name: 'Poslovitch' };
const FALLBACKS = process.env.EDUCA_NO_FALLBACK ? [] : [
  { id: 'Q1422544', name: 'Sartus85' },
  { id: 'Q215420', name: 'LoquaxFR' },
  { id: 'Q102123', name: 'WikiLucas00' },
];
/* Mots dont la prononciation dépend du sens : on choisit le fichier à la main. */
const FORCE_FILE = { vis: 'vis (nom commun)' };
const OK_LICENSES = new Set(['CC0', 'CC BY-SA 4.0', 'CC BY 4.0']);

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** fetch poli : en cas de 429/503 on respecte « Retry-After » puis on attend de plus en plus longtemps. */
async function politeFetch(url, options = {}) {
  for (let essai = 1; ; essai++) {
    const res = await fetch(url, { ...options, headers: { 'User-Agent': UA, ...options.headers } });
    if (res.ok || ![429, 503].includes(res.status) || essai >= MAX_TRIES) return res;
    const wait = Number(res.headers.get('retry-after')) || 5 * 2 ** (essai - 1);
    console.warn(`  ${res.status} : pause de ${wait} s (essai ${essai}/${MAX_TRIES})`);
    await sleep(wait * 1000);
  }
}

/** Les mots du jeu, en clair (sans la notation de segmentation). */
async function gameWords() {
  const cur = await import(pathToFileURL(path.join(ROOT, 'js/data/curriculum.js')).href);
  const { parseSeg } = await import(pathToFileURL(path.join(ROOT, 'js/core/seg.js')).href);
  const all = [
    ...cur.LEXICON.map(([seg]) => seg),
    ...cur.TOOL_WORDS.map(w => w.seg),
    ...cur.SENTENCES.flatMap(s => s.words),
  ];
  return [...new Set(all.map(seg => parseSeg(seg).text.toLowerCase()))].sort((a, b) => a.localeCompare(b, 'fr'));
}

async function sparql(query) {
  const res = await politeFetch(SPARQL, {
    method: 'POST',
    headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}`);
  return (await res.json()).results.bindings;
}

/** Fichiers Commons (un par mot) d'un locuteur, pour une liste de mots. */
async function filesBySpeaker(speaker, words) {
  const values = words.map(w => JSON.stringify(w)).join(' ');
  const rows = await sparql(`
    PREFIX e: <https://lingualibre.org/entity/> PREFIX d: <https://lingualibre.org/prop/direct/>
    SELECT ?word ?file WHERE {
      VALUES ?word { ${values} }
      ?rec d:P7 ?word ; d:P4 e:Q21 ; d:P5 e:${speaker.id} ; d:P3 ?file . }`);
  const byWord = new Map();
  for (const r of rows) {
    const name = decodeURIComponent(r.file.value.split('Special:FilePath/')[1]);
    byWord.set(r.word.value, [...(byWord.get(r.word.value) ?? []), name]);
  }
  return byWord;
}

/** Plusieurs fichiers pour un mot : le choix forcé, sinon le fichier sans précision entre parenthèses. */
function pickFile(word, speaker, names) {
  const plain = `LL-Q150 (fra)-${speaker.name}-${word}.wav`;
  const forced = FORCE_FILE[word] && `LL-Q150 (fra)-${speaker.name}-${FORCE_FILE[word]}.wav`;
  return names.find(n => n === forced) ?? names.find(n => n === plain) ?? names[0];
}

/** Licence, auteur et adresse de téléchargement d'après l'API de Commons. */
async function commonsInfo(fileNames) {
  const info = new Map();
  for (let i = 0; i < fileNames.length; i += BATCH) {
    const titles = fileNames.slice(i, i + BATCH).map(n => `File:${n}`).join('|');
    const url = `${COMMONS}?${new URLSearchParams({ action: 'query', format: 'json', maxlag: '5', prop: 'imageinfo', iiprop: 'url|size|extmetadata', titles })}`;
    const res = await politeFetch(url);
    if (!res.ok) throw new Error(`Commons ${res.status}`);
    for (const page of Object.values((await res.json()).query.pages)) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      info.set(page.title.replace(/^File:/, ''), {
        url: ii.url.split('?')[0],
        page: ii.descriptionurl,
        size: ii.size,
        license: ii.extmetadata.LicenseShortName?.value ?? 'inconnue',
        licenseUrl: ii.extmetadata.LicenseUrl?.value ?? '',
      });
    }
    await sleep(PAUSE_MS);
  }
  return info;
}

/** Nom de fichier ASCII sûr (jamais deux mots pour le même nom : « mais » / « maïs »). */
export function slugs(words) {
  const used = new Set();
  return new Map(words.map(w => {
    const base = w.normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, '-') || 'x';
    let s = base;
    for (let n = 2; used.has(s); n++) s = `${base}-${n}`;
    used.add(s);
    return [w, s];
  }));
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function download(url, dest) {
  if (await exists(dest)) return;
  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`téléchargement ${res.status} : ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  await sleep(PAUSE_MS);
}

async function cmdFetch() {
  const words = await gameWords();
  const slug = slugs(words);
  const dir = path.join(OUT, SRC_DIR);
  await mkdir(dir, { recursive: true });

  const chosen = new Map();                         // mot -> { speaker, file }
  let todo = words;
  for (const speaker of [PRIMARY, ...FALLBACKS]) {
    if (!todo.length) break;
    const found = await filesBySpeaker(speaker, todo);
    for (const [w, names] of found) chosen.set(w, { speaker, file: pickFile(w, speaker, names) });
    todo = words.filter(w => !chosen.has(w));
    console.log(`${speaker.name} : ${found.size} mots trouvés, reste ${todo.length}`);
  }

  const info = await commonsInfo([...chosen.values()].map(c => c.file));
  const entries = [];
  for (const w of words) {
    const c = chosen.get(w);
    const i = c && info.get(c.file);
    if (!i) { entries.push({ mot: w, absent: true }); continue; }
    if (!OK_LICENSES.has(i.license)) { console.warn(`licence refusée (${i.license}) : ${c.file}`); entries.push({ mot: w, absent: true }); continue; }
    await download(i.url, path.join(dir, `${slug.get(w)}.wav`));
    entries.push({ mot: w, fichier: slug.get(w), locuteur: c.speaker.name, licence: i.license, page: i.page, secours: c.speaker !== PRIMARY });
  }
  await writeFile(path.join(OUT, SRC_DIR, 'mots.json'), JSON.stringify(entries, null, 1) + '\n');
  await mkdir(path.join(OUT, 'audio'), { recursive: true });
  await writeFile(path.join(OUT, 'audio/ATTRIBUTIONS.md'), attributions(entries));
  const missing = entries.filter(e => e.absent).map(e => e.mot);
  console.log(`${entries.length - missing.length}/${words.length} mots téléchargés ; absents : ${missing.join(', ') || 'aucun'}`);
}

function attributions(entries) {
  const done = entries.filter(e => !e.absent);
  const bySpeaker = new Map();
  for (const e of done) {
    const who = `${e.locuteur} — ${e.licence}`;
    bySpeaker.set(who, [...(bySpeaker.get(who) ?? []), e]);
  }
  const lines = [
    '# Attributions des voix (mots parlés)', '',
    'Prononciations enregistrées par des bénévoles avec **Lingua Libre** (Wikimédia France) et publiées sur',
    '**Wikimedia Commons**. Conversion en MP3 (coupe des silences, volume uniformisé) par EDUCA.', '',
  ];
  for (const [who, list] of bySpeaker) {
    lines.push(`## ${who} (${list.length} mots)`, '', list.map(e => `[${e.mot}](${e.page})`).join(' · '), '');
  }
  lines.push('Licences : CC0 = domaine public (https://creativecommons.org/publicdomain/zero/1.0/) ;',
    'CC BY-SA 4.0 = attribution + partage à l\'identique (https://creativecommons.org/licenses/by-sa/4.0/).', '');
  return lines.join('\n');
}

/* Coupe des silences aux deux bouts (on garde 30 ms), fondus courts, MP3 mono 24 kHz 32 kb/s.
   Volume : les mots durent 0,4 à 1,3 s, trop peu pour « loudnorm » (EBU R128 veut 400 ms mesurables) ;
   on mesure donc le niveau efficace (RMS) du mot et on applique un gain fixe + un limiteur de crêtes. */
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:detection=peak';
const TRIM_CHAIN = [TRIM, 'areverse', TRIM, 'afade=t=in:d=0.02', 'areverse', 'afade=t=in:d=0.005'].join(',');
const TARGET_RMS_DB = -20;             // niveau moyen visé (≈ -18 LUFS pour de la parole)
const PEAK_CEILING_DB = -1.5;          // crête maximale après gain
const MAX_GAIN_DB = 20;                // on ne remonte jamais un bruit de plus de 20 dB

function runFfmpeg(args) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg a échoué (${args.join(' ')}) : ${r.stderr.slice(-300)}`);
  return r.stderr;
}

/** Niveau efficace et crête (dB) d'un clip. */
function measure(file) {
  const log = runFfmpeg(['-i', file, '-af', 'astats=metadata=0', '-f', 'null', '-']);
  const overall = log.slice(log.lastIndexOf('Overall'));
  const rms = Number(/RMS level dB:\s*(-?[\d.]+)/.exec(overall)?.[1]);
  const peak = Number(/Peak level dB:\s*(-?[\d.]+)/.exec(overall)?.[1]);
  if (!Number.isFinite(rms) || !Number.isFinite(peak)) throw new Error(`mesure impossible : ${file}`);
  return { rms, peak };
}

function encodeOne(src, dest) {
  const tmp = path.join(os.tmpdir(), `educa-${process.pid}-${path.basename(dest)}.wav`);
  try {
    runFfmpeg(['-i', src, '-af', TRIM_CHAIN, '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', tmp]);
    const { rms } = measure(tmp);
    const gain = Math.min(MAX_GAIN_DB, TARGET_RMS_DB - rms).toFixed(2);
    const ceiling = (10 ** (PEAK_CEILING_DB / 20)).toFixed(3);
    runFfmpeg(['-i', tmp, '-af', `volume=${gain}dB,alimiter=limit=${ceiling}:attack=1:release=20:level=disabled`,
      '-c:a', 'libmp3lame', '-b:a', '32k', '-id3v2_version', '0', dest]);
  } finally {
    rmSync(tmp, { force: true });
  }
}

async function cmdEncode() {
  const entries = JSON.parse(await readFile(path.join(OUT, SRC_DIR, 'mots.json'), 'utf8')).filter(e => !e.absent);
  await mkdir(path.join(OUT, 'audio/mots'), { recursive: true });
  for (const e of entries) encodeOne(path.join(OUT, SRC_DIR, `${e.fichier}.wav`), path.join(OUT, 'audio/mots', `${e.fichier}.mp3`));
  const map = Object.fromEntries(entries.map(e => [e.mot, e.fichier]));
  await mkdir(path.join(OUT, 'js/data'), { recursive: true });
  await writeFile(path.join(OUT, 'js/data/wordaudio.js'),
    `/* Généré par scripts/voix-libre.mjs — ne pas éditer. mot -> audio/mots/<fichier>.mp3 */\nexport const WORD_FILES = ${JSON.stringify(map, null, 1)};\n`);
  console.log(`${entries.length} fichiers MP3 écrits dans audio/mots/`);
}

const cmd = process.argv[2];
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = { fetch: cmdFetch, encode: cmdEncode }[cmd];
  if (!run) { console.error('usage : node scripts/voix-libre.mjs fetch|encode'); process.exit(2); }
  run().catch(err => { console.error(err.message); process.exit(1); });
}
```

## Annexe 2 — `manifest.json` proposé (JSON valide, remplace le fichier actuel)

Changements : nom/description de la v2 (l'actuel dit « Apprendre en Jouant … pour chaque enfant du monde »), icône
**maskable séparée**, `categories`, `orientation: any`, `dir`, `theme_color` aligné sur la balise `<meta>` actuelle
(`#15803d` — à confirmer visuellement, le manifeste actuel dit `#7C3AED`). `id`, `scope`, `start_url` inchangés.

```json
{
  "id": "./",
  "name": "EDUCA — Apprendre à lire avec Kaya",
  "short_name": "EDUCA",
  "description": "Apprendre à lire en français en jouant avec Kaya, le bébé jaguar. Gratuit, hors-ligne, aucune donnée ne quitte l'appareil.",
  "lang": "fr",
  "dir": "ltr",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0F172A",
  "theme_color": "#15803d",
  "categories": [
    "education",
    "kids"
  ],
  "prefer_related_applications": false,
  "icons": [
    {
      "src": "icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Annexe 3 — `scripts/make-icons.mjs` (testé : icône maskable relue à l'œil, étoile à 165 px du centre)

Usage : `CHROMIUM_PATH=/usr/bin/chromium node scripts/make-icons.mjs` (utilise `playwright-core`, déjà en devDependency).

```js
#!/usr/bin/env node
/* scripts/make-icons.mjs — icônes pleine page (maskable, Apple) à partir de icons/icon.svg
   Usage : CHROMIUM_PATH=/usr/bin/chromium node scripts/make-icons.mjs
   - icon-maskable-512.png : fond plein cadre, contenu réduit à 72 % (zone de sécurité Android : cercle de 80 %)
   - apple-touch-icon.png  : 180x180 plein cadre, sans coins arrondis ni transparence (iOS remplit le transparent en noir) */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.EDUCA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.EDUCA_OUT || path.join(ROOT, 'icons');
const SAFE_SCALE = 0.72;

const svg = await readFile(path.join(ROOT, 'icons/icon.svg'), 'utf8');
/* Même dessin : on retire les coins arrondis (rx) et on réduit le contenu autour du centre. */
const fullBleed = (scale) => svg
  .replace(/ rx="\d+"/, '')
  .replace(/(<text[\s\S]*?<polygon[\s\S]*?\/>)/, `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">$1</g>`);

async function render(browser, markup, size, file) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
  await writeFile(file, await page.screenshot({ type: 'png', omitBackground: false }));
  await page.close();
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
await render(browser, fullBleed(SAFE_SCALE), 512, path.join(OUT, 'icon-maskable-512.png'));
await render(browser, fullBleed(0.9), 180, path.join(OUT, 'apple-touch-icon.png'));
await browser.close();
console.log('icônes écrites dans', OUT);
```

## Annexe 4 — Gabarits Android (Bubblewrap)

**`twa/twa-manifest.json`** — validé par `TwaManifest.validate()` de `@bubblewrap/core` 1.27.0 (retour `null`) et utilisé
par `TwaGenerator` pour générer un projet Android (0 permission, `targetSdkVersion 36`). Solution A (origine
`daveinout.github.io`, sous-dossier `/edugame/`) :

```json
{
  "packageId": "io.github.daveinout.educa",
  "host": "daveinout.github.io",
  "name": "EDUCA — Apprendre à lire avec Kaya",
  "launcherName": "EDUCA",
  "display": "standalone",
  "orientation": "default",
  "themeColor": "#15803d",
  "themeColorDark": "#0F172A",
  "navigationColor": "#0F172A",
  "navigationColorDark": "#0F172A",
  "navigationDividerColor": "#00000000",
  "navigationDividerColorDark": "#00000000",
  "backgroundColor": "#0F172A",
  "enableNotifications": false,
  "startUrl": "/edugame/index.html",
  "iconUrl": "https://daveinout.github.io/edugame/icons/icon-512.png",
  "maskableIconUrl": "https://daveinout.github.io/edugame/icons/icon-maskable-512.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "educa"
  },
  "appVersionCode": 1,
  "appVersion": "1.0.0",
  "shortcuts": [],
  "generatorApp": "bubblewrap-cli",
  "webManifestUrl": "https://daveinout.github.io/edugame/manifest.json",
  "fallbackType": "customtabs",
  "features": {},
  "alphaDependencies": {
    "enabled": false
  },
  "enableSiteSettingsShortcut": false,
  "isChromeOSOnly": false,
  "isMetaQuest": false,
  "fullScopeUrl": "https://daveinout.github.io/edugame/",
  "minSdkVersion": 23,
  "fingerprints": []
}
```

Solution B (domaine personnalisé, ici `educa.example.org` **fictif**) : remplacer seulement ces champs :

```json
{
  "host": "educa.example.org",
  "startUrl": "/index.html",
  "iconUrl": "https://educa.example.org/icons/icon-512.png",
  "maskableIconUrl": "https://educa.example.org/icons/icon-maskable-512.png",
  "webManifestUrl": "https://educa.example.org/manifest.json",
  "fullScopeUrl": "https://educa.example.org/"
}
```

**`twa/assetlinks.template.json`** (à ne PAS publier tel quel ; à copier vers `.well-known/assetlinks.json` à la racine
de l'origine, avec les deux vraies empreintes ; `bubblewrap fingerprint generateAssetLinks` produit le même format,
vérifié avec `DigitalAssetLinks.generateAssetLinks`) :

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "io.github.daveinout.educa",
    "sha256_cert_fingerprints": [
      "EMPREINTE-SHA256-DE-LA-CLE-D-ENVOI (bubblewrap fingerprint list)",
      "EMPREINTE-SHA256-DE-LA-CLE-DE-SIGNATURE-GOOGLE-PLAY (Console Play > Intégrité de l'application)"
    ]
  }
}]
```

## Annexe 5 — Plan B Capacitor 8 (iOS + Android natifs)

**`capacitor.config.json`** — chargé sans erreur par `npx cap add android` (Capacitor CLI 8.5.3) ; le plugin
`@capacitor-community/text-to-speech@8.0.2` a été détecté et enregistré (`com.getcapacitor.community.tts.TextToSpeechPlugin`),
les 908 Ko de l'appli copiés dans `android/app/src/main/assets/public`. Le projet généré cible `minSdkVersion 24`,
`compileSdk/targetSdk 36` et déclare **une seule permission : `INTERNET`** (par défaut).

```json
{
  "appId": "io.github.daveinout.educa",
  "appName": "EDUCA",
  "webDir": "www",
  "server": { "androidScheme": "https" },
  "android": { "allowMixedContent": false, "webContentsDebuggingEnabled": false },
  "ios": { "contentInset": "never" }
}
```

Chaîne : `node scripts/build-site.mjs www && npx cap sync` puis `npx cap open android` / `npx cap open ios`
(Android Studio >= 2025.2.1 ; Xcode >= 26, macOS).

**`js/services/tts-shim.js`** — donne un `speechSynthesis` minimal à l'Android WebView à partir du plugin ; `voice.js` n'a rien à
changer sinon **une première ligne `import './tts-shim.js';`** (le module doit s'évaluer avant celui de `voice.js`, qui lit
`speechSynthesis` au chargement). **Testé uniquement avec un faux plugin (Node), pas sur un appareil** : le réglage de la
vitesse (`rate`) du plugin diffère peut-être de celui du Web (à régler sur un téléphone).

```js
/* ============================================================
   SERVICES/TTS-SHIM.JS — Voix native quand « speechSynthesis » n'existe pas
   Android WebView (donc Capacitor Android) n'a pas speechSynthesis (MDN, crbug 40417848).
   Importé AVANT voice.js, ce module installe une version minimale de
   speechSynthesis / SpeechSynthesisUtterance appuyée sur le plugin
   @capacitor-community/text-to-speech : voice.js n'a rien à changer.
   Navigateur normal, PWA installée ou TWA : ne fait rien (speechSynthesis existe).
   ============================================================ */

const FLUSH = 0;   // QueueStrategy.Flush : une nouvelle phrase coupe la précédente

export function installNativeTts(root = globalThis) {
  if (typeof root.speechSynthesis !== 'undefined') return false;
  const plugin = root.Capacitor?.isNativePlatform?.() ? root.Capacitor.Plugins?.TextToSpeech : null;
  if (!plugin) return false;

  let voices = [];
  let current = null;

  class Utterance {
    constructor(text = '') {
      this.text = text; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null;
      this.onstart = null; this.onend = null; this.onerror = null;
    }
  }

  const settle = (u, event, handler) => {
    if (current !== u) return;               // énoncé déjà remplacé ou annulé
    current = null;
    synth.speaking = false;
    u[handler]?.(event);
  };

  const synth = {
    onvoiceschanged: null, speaking: false, pending: false,
    getVoices: () => voices,
    resume() {},
    cancel() {
      const u = current;
      current = null;
      synth.speaking = false;
      Promise.resolve(plugin.stop()).catch(() => {});
      u?.onerror?.({ error: 'canceled' });
    },
    speak(u) {
      current = u;
      synth.speaking = true;
      const index = voices.indexOf(u.voice);
      u.onstart?.({});
      plugin.speak({
        text: u.text, lang: u.lang || 'fr-FR', rate: u.rate, pitch: u.pitch, volume: u.volume,
        ...(index >= 0 ? { voice: index } : {}), category: 'ambient', queueStrategy: FLUSH,
      }).then(() => settle(u, {}, 'onend'), () => settle(u, { error: 'synthesis-failed' }, 'onerror'));
    },
  };

  root.SpeechSynthesisUtterance = Utterance;
  root.speechSynthesis = synth;

  plugin.getSupportedVoices().then(({ voices: list }) => {
    voices = list.map(v => ({ name: v.name, lang: v.lang, localService: v.localService, default: v.default, voiceURI: v.voiceURI }));
    synth.onvoiceschanged?.({});
  }).catch(() => { /* pas de voix : voice.js passe en « sans voix » */ });
  return true;
}

installNativeTts();
```

**`tests/unit/tts-shim.test.mjs`** — 7 tests passés (`node --test`) : rien si `speechSynthesis` existe ou hors natif ; voix +
`onvoiceschanged` ; `speak` → `onstart`/`onend` avec l'indice de voix ; `cancel` → `stop()` + `canceled` ; erreur du plugin ;
une phrase récente remplace la précédente.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNativeTts } from '../../js/services/tts-shim.js';

const tick = () => new Promise(r => setTimeout(r, 0));

function fakeRoot({ speakImpl, native = true } = {}) {
  const calls = { speak: [], stop: 0 };
  const plugin = {
    getSupportedVoices: async () => ({ voices: [
      { name: 'Anna', lang: 'en-US', localService: true, default: false, voiceURI: 'a' },
      { name: 'Thomas', lang: 'fr-FR', localService: true, default: true, voiceURI: 't' },
    ] }),
    speak: async opts => { calls.speak.push(opts); return speakImpl ? speakImpl(opts) : undefined; },
    stop: async () => { calls.stop++; },
  };
  return { calls, root: { Capacitor: { isNativePlatform: () => native, Plugins: { TextToSpeech: plugin } } } };
}

test('ne fait rien si speechSynthesis existe déjà (navigateur, PWA, TWA)', () => {
  const root = { speechSynthesis: {}, Capacitor: { isNativePlatform: () => true } };
  assert.equal(installNativeTts(root), false);
});

test('ne fait rien hors application native', () => {
  const { root } = fakeRoot({ native: false });
  assert.equal(installNativeTts(root), false);
  assert.equal(root.speechSynthesis, undefined);
});

test('expose les voix et prévient avec onvoiceschanged', async () => {
  const { root } = fakeRoot();
  assert.equal(installNativeTts(root), true);
  let changed = 0;
  root.speechSynthesis.onvoiceschanged = () => { changed++; };
  assert.deepEqual(root.speechSynthesis.getVoices(), []);
  await tick();
  assert.equal(changed, 1);
  assert.deepEqual(root.speechSynthesis.getVoices().map(v => v.name), ['Anna', 'Thomas']);
});

test('speak : onstart puis onend, avec l\'indice de la voix choisie', async () => {
  const { root, calls } = fakeRoot();
  installNativeTts(root);
  await tick();
  const u = new root.SpeechSynthesisUtterance('Bonjour');
  u.lang = 'fr-FR'; u.rate = 0.9; u.pitch = 1.05;
  u.voice = root.speechSynthesis.getVoices()[1];
  const events = [];
  u.onstart = () => events.push('start');
  u.onend = () => events.push('end');
  root.speechSynthesis.speak(u);
  assert.equal(root.speechSynthesis.speaking, true);
  await tick();
  assert.deepEqual(events, ['start', 'end']);
  assert.equal(root.speechSynthesis.speaking, false);
  assert.deepEqual(calls.speak[0], { text: 'Bonjour', lang: 'fr-FR', rate: 0.9, pitch: 1.05, volume: 1, voice: 1, category: 'ambient', queueStrategy: 0 });
});

test('cancel : arrête le plugin et signale « canceled », sans onend', async () => {
  let release;
  const { root, calls } = fakeRoot({ speakImpl: () => new Promise(r => { release = r; }) });
  installNativeTts(root);
  await tick();
  const u = new root.SpeechSynthesisUtterance('Long texte');
  const events = [];
  u.onend = () => events.push('end');
  u.onerror = e => events.push(e.error);
  root.speechSynthesis.speak(u);
  root.speechSynthesis.cancel();
  release();
  await tick();
  assert.deepEqual(events, ['canceled']);
  assert.equal(calls.stop, 1);
});

test('une erreur du plugin devient onerror « synthesis-failed »', async () => {
  const { root } = fakeRoot({ speakImpl: () => { throw new Error('moteur absent'); } });
  installNativeTts(root);
  await tick();
  const u = new root.SpeechSynthesisUtterance('Salut');
  const events = [];
  u.onerror = e => events.push(e.error);
  root.speechSynthesis.speak(u);
  await tick();
  assert.deepEqual(events, ['synthesis-failed']);
});

test('une phrase plus récente remplace la précédente (pas de onend en retard)', async () => {
  const resolvers = [];
  const { root } = fakeRoot({ speakImpl: () => new Promise(r => resolvers.push(r)) });
  installNativeTts(root);
  await tick();
  const log = [];
  const a = new root.SpeechSynthesisUtterance('A'); a.onend = () => log.push('A');
  const b = new root.SpeechSynthesisUtterance('B'); b.onend = () => log.push('B');
  root.speechSynthesis.speak(a);
  root.speechSynthesis.speak(b);
  resolvers.forEach(r => r());
  await tick();
  assert.deepEqual(log, ['B']);
});
```

## Annexe 6 — Construction du site (partagée par la CI et Capacitor)

**`scripts/build-site.mjs`** (testé : copie les mêmes 8 éléments que la CI actuelle, 908 Ko, 75 fichiers ; ajoute
automatiquement `audio/`, `confidentialite.html`, `.well-known/`, `CNAME` dès qu'ils existent) :

```js
#!/usr/bin/env node
/* ============================================================
   scripts/build-site.mjs — assemble l'application (et rien d'autre) dans un dossier
   Usage : node scripts/build-site.mjs _site     (CI : site publié)
           node scripts/build-site.mjs www       (Capacitor : webDir)
   Ne copie ni archive/, rapports/, ops/, tests/, scripts/ ni audio-src/ (WAV sources).
   ============================================================ */
import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.EDUCA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? '_site');
const ITEMS = [
  'index.html', 'manifest.json', 'sw.js', 'LICENSE',
  'css', 'js', 'fonts', 'icons', 'audio',
  'confidentialite.html',           // politique de confidentialité publique (exigée par les deux magasins)
  '.well-known',                     // assetlinks.json (TWA) : seulement si le site a son propre domaine
  'CNAME',                           // domaine personnalisé GitHub Pages
];

const exists = p => access(p).then(() => true, () => false);

await mkdir(OUT, { recursive: true });
const copied = [];
for (const item of ITEMS) {
  const from = path.join(ROOT, item);
  if (!(await exists(from))) continue;
  await cp(from, path.join(OUT, item), { recursive: true });
  copied.push(item);
}
console.log(`${copied.length} éléments copiés dans ${OUT} : ${copied.join(', ')}`);
```

**`.github/workflows/pages.yml`** — étape de construction et d'envoi (versions courantes au 13/10/2026 :
`upload-pages-artifact` v5.0.0, `deploy-pages` v5.0.1, `configure-pages` v6.0.0 ; **les mettre à niveau ensemble et
essayer sur une branche**, je n'ai pas pu lancer la CI) :

```yaml
      - name: Construire le site (l'application seulement)
        run: node scripts/build-site.mjs _site
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: _site
          include-hidden-files: true      # indispensable pour .well-known/assetlinks.json
      - id: deployment
        uses: actions/deploy-pages@v5
```
(`actions/setup-node` n'est utilisé que dans le job `test` : ajouter `actions/setup-node` avec `node-version: 22` au job
`deploy` pour exécuter le script.)

---

# Sources

**Mesures faites pendant cette recherche (API publiques, 13/10/2026)** — API MediaWiki de Commons
(`commons.wikimedia.org/w/api.php`, `imageinfo`, `categoryinfo`) ; SPARQL de Lingua Libre
(`lingualibre.org/bigdata/namespace/wdq/sparql`) ; API Wikidata (`wbgetentities`) ; API Digital Asset Links
(`digitalassetlinks.googleapis.com/v1/statements:list`) ; registre npm ; API GitHub ; MDN browser-compat-data ; données caniuse ;
`@bubblewrap/core` 1.27.0 et Capacitor CLI 8.5.3 exécutés en local.

- Wikimedia, politique de User-Agent : https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
- Wikimedia, politique des robots : https://wikitech.wikimedia.org/wiki/Robot_policy
- Lingua Libre (Meta) : https://meta.wikimedia.org/wiki/Lingua_Libre/fr ; archive du wiki : https://archive.lingualibre.org/wiki/LinguaLibre:Main_Page
- Commons, catégorie des prononciations françaises : https://commons.wikimedia.org/wiki/Category:Lingua_Libre_pronunciation-fra
- Licence CC BY-SA 4.0 (texte officiel) : https://creativecommons.org/licenses/by-sa/4.0/legalcode
- Base audio libre de mots français (Shtooka, 2006) : https://linuxfr.org/news/base-audio-libre-de-mots-francais
- Kalulu, pédagogie : https://onlit.org/wp-content/uploads/2024/12/La-pedagogie-Kalulu.pdf ; dépôt public : https://github.com/c24b/kalulu_app_br
- Common Voice, français « Scripted Speech 25.0 » (Mozilla Data Collective) : https://mozilladatacollective.com/datasets/cmn5zugst00w3nv07upovf2bg
- MDN browser-compat-data, SpeechSynthesis : https://github.com/mdn/browser-compat-data/blob/main/api/SpeechSynthesis.json (bogue Chromium : https://crbug.com/40417848)
- caniuse, Opus / MP3 : https://caniuse.com/opus , https://caniuse.com/mp3
- Bubblewrap : https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli ; PWABuilder, Android et FAQ des liens d'actifs :
  https://github.com/pwa-builder/PWABuilder/blob/main/docs/builder/asset-links-faq.md ; iOS : https://github.com/pwa-builder/PWABuilder/blob/main/docs/builder/app-store.md
- Digital Asset Links : https://developers.google.com/digital-asset-links/v1/getting-started
- Google Play, niveau d'API cible : https://developer.android.com/google/play/requirements/target-sdk
- Google Play, exigences de test des nouveaux comptes personnels : https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play, politique Familles : https://support.google.com/googleplay/android-developer/answer/9893335
- Apple, App Review Guidelines (4.2, 1.3, 5.1.1, 5.1.4, 2.5.6) : https://developer.apple.com/app-store/review/guidelines/
- WebKit, plafond de 7 jours d'ITP et exemption des applications de l'écran d'accueil : https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- Capacitor, prérequis : https://capacitorjs.com/docs/getting-started/environment-setup ; plugin TTS : https://github.com/capacitor-community/text-to-speech
- FTC, règle COPPA modifiée (22/04/2025, conformité 22/04/2026) : https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule
- Action GitHub `upload-pages-artifact` (fichiers cachés) : https://github.com/actions/upload-pages-artifact

---

# Recommandations à implémenter (liste numérotée, fichiers à créer ou modifier)

## Voix humaine
1. **Créer `scripts/voix-libre.mjs`** (Annexe 1, testé : 293 fichiers téléchargés, convertis, relus par Chromium) ;
   **`.gitignore`** : ajouter `audio-src/` ; **`package.json`** : scripts `voix:fetch` (`EDUCA_NO_FALLBACK=1 node
   scripts/voix-libre.mjs fetch`) et `voix:encode`.
2. **Lancer `fetch`** (≈ 10 min, tient compte des erreurs 429) : produit `audio-src/*.wav` (25 Mo, non versionné),
   `audio-src/mots.json` et **`audio/ATTRIBUTIONS.md`**. **Faire écouter** les 268 fichiers par l'enseignante /
   l'orthophoniste (priorité : vis, est, os, fait, tout, plus, sept, six, dix, neuf, a / à, les / des / mes) ; corriger
   `FORCE_FILE` dans le script si besoin.
3. **Lancer `encode`** : écrit `audio/mots/*.mp3` (268 fichiers, **0,81 Mo**) et **`js/data/wordaudio.js`** ; puis
   `npm run release` (le cache hors-ligne passe de 0,62 à ~1,4 Mo ; `audio/ATTRIBUTIONS.md` et `audio-src/` ne sont pas mis
   en cache : `release.mjs` ignore les `.md`, et `audio-src` n'est pas dans ses `ENTRIES`).
4. **Modifier `js/services/voice.js`** : `import { WORD_FILES } from '../data/wordaudio.js'` ; fonction `playWord(word)` qui
   joue `audio/mots/${WORD_FILES[mot]}.mp3` via `playFile()` (déjà là) si le mot est connu, sinon synthèse ; appeler
   `playWord` dans `seq()` pour `{ word }` ; pour `slowWord` : `audio.playbackRate = 0.85` (+ `preservesPitch`) ; ne rien
   changer en mode muet / lecteur d'écran.
5. **Créer `tests/unit/wordaudio.test.mjs`** : chaque entrée de `WORD_FILES` correspond à un fichier existant ; noms ASCII
   sans doublon ; la liste des mots du jeu sans voix (10 à 35) est explicite. Ajouter un test e2e « le mot joué vient
   d'un fichier » si possible.
6. **`README.md`** (« Crédits et licences ») : voix de Poslovitch (Lingua Libre, Wikimedia Commons, **CC0**), lien vers
   `audio/ATTRIBUTIONS.md`, et précision que le dossier `audio/` a sa propre licence ; **espace des grands** : lien « Crédits ».
7. **Sons purs (37)** : faire enregistrer (protocole en A4.6, avis d'`educa-orthophoniste`), convertir avec la même chaîne
   (dossier `audio-src/sons/`), déposer `audio/sons/<id>.mp3` et régénérer **`js/data/sounds.js`** (`SOUND_FILES`, hook
   existant). En attendant, option « 10 voyelles de Poslovitch » (A4.6, point 2).
8. *(facultatif)* Enregistrer les 35 mots manquants et les 19 phrases ; sinon la synthèse continue de les dire.

## Mobile
9. **`manifest.json`** (Annexe 2) : nom et description de la v2, icônes `any` et `maskable` **séparées**, `categories`,
   `orientation: any`, `theme_color` identique à la balise `<meta>` ; ne **jamais** changer `id` après publication.
10. **Créer `scripts/make-icons.mjs`** (Annexe 3, testé et vérifié à l'œil) → **`icons/icon-maskable-512.png`** et
    **`icons/apple-touch-icon.png`** ; **`index.html`** : `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`.
11. **Créer `confidentialite.html`** (version HTML de `CONFIDENTIALITE.md`, sans ressource externe) et un lien depuis
    l'espace des grands (Apple 5.1.1(i), Google Play) ; c'est l'URL à saisir dans les deux consoles.
12. **Créer `scripts/build-site.mjs`** (Annexe 6, testé : copie exactement la liste actuelle de la CI) ;
    **`.github/workflows/pages.yml`** : remplacer le `cp -r …` par `node scripts/build-site.mjs _site`, passer
    `actions/upload-pages-artifact` de `@v3` à **`@v5`** et ajouter `with: include-hidden-files: true`.
13. **Décider l'origine** : (A) créer `DaVeinOUT/DaVeinOUT.github.io` avec `.well-known/assetlinks.json` + `.nojekyll`, ou
    (B, recommandé) acheter un domaine, créer **`CNAME`** et **`.well-known/assetlinks.json`** dans le dépôt `edugame`,
    régler le DNS et activer HTTPS dans Settings > Pages.
14. **Créer `twa/twa-manifest.json`** (Annexe 4, validé par `@bubblewrap/core` 1.27.0) et
    **`twa/assetlinks.template.json`** (non servi) ; **`.gitignore`** : `*.keystore`, `app-release*`, `twa-build/`.
15. **Captures pour les fiches** dans un dossier non servi (`store/`) : >= 4 captures téléphone (1080x1920) et 2 tablette,
    avec un profil de démonstration sans prénom réel ; image de présentation 1024x500.
16. **Console Play** : catégorie Éducation ; public cible 5-12 ans (ou 5-15 avec écran d'âge neutre) ; « Sécurité des
    données » = aucune donnée collectée ni partagée ; « aucune publicité » ; questionnaire IARC ; URL de confidentialité
    (point 11) ; lancer le **test fermé de 14 jours avec 12 testeurs** (enseignants, parents) dès que l'AAB est prêt.
17. **Plan B Capacitor / iOS App Store** : **`capacitor.config.json`** (Annexe 5), devDependencies `@capacitor/core`,
    `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`, `@capacitor-community/text-to-speech`,
    **`js/services/tts-shim.js`** + **`tests/unit/tts-shim.test.mjs`** (Annexe 5) avec `import './tts-shim.js'` en
    **première ligne de `voice.js`** ; `npx cap add android|ios`, `npx cap sync` ; `Info.plist` : `NSMicrophoneUsageDescription` ;
    export de sauvegarde par partage natif.
18. **Faire la liste d'essais B4.4** sur de vrais appareils avant toute soumission.
