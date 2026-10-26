# Intégration des sons de PR3 — 26 octobre 2026

Source de la PR : `bd7f27820b35caf07364d91843bc30409df4499f`.
Base main préservée : `81db9854287b09d2af387bba639a254ecbe24e60`.
Travail réalisé dans le worktree séparé `/tmp/educa-pr3-integration`, avec fusion
préparée par l’agent principal. Ce document ne certifie pas une fusion GitHub.

## Apports repris

- 24 MP3, **66 672 octets** ajoutés. Ils sont identiques octet par octet aux
  fichiers de la PR : [inventaire et SHA-256](audio-assets.json).
- Le manifeste couvre 36 phonèmes avec 35 fichiers uniques (`w` emploie `ou`).
  Les attributions et le script d’extraction/conversion de la PR sont conservés.
- Remplacer ou arrêter un fichier renvoie une annulation distincte d’une erreur.
  Cette annulation ne déclenche pas de synthèse de secours par-dessus la lecture
  suivante, même sans changement de génération.
- Un son demandé directement interrompt la séquence en cours. À l’intérieur
  d’une séquence, le son reste dans sa génération (`interrupt: false`).
- Les mots proposés dans « Quel mot commence par… » appartiennent désormais à
  la même séquence que sa consigne ; aucune boucle indépendante ne les reprend
  après une autre lecture ou une navigation.

## Protections de main conservées

Les voix distantes restent exclues, y compris avec une ancienne préférence.
La bouche reste liée aux événements de lecture réels. Les gardes de génération,
`cancelUtterance`, l’annulation WebAudio par `AbortSignal`, la révocation des URL
d’enregistrements remplacés et les modes silencieux/lecteur d’écran restent présents.

`phonemes.js` est conservé comme secours local après échec du MP3, puis la voix
système locale peut servir en dernier recours. Les anciens tests du secours
synthétisé sont conservés à côté des tests de décodage des enregistrements.
Les hooks `noteSupport` des activités restent présents ; ce lot ne modifie ni
leur journal, ni le score, ni les acquis. Le stockage, les migrations, le verrou
et les fichiers Kaya ne diffèrent pas de la base main.

## Vérifications

- Deux régressions ont d’abord échoué sur la voix de main : remplacement d’un
  fichier déclenchant une synthèse concurrente, et son direct laissant la suite
  des mots se jouer. [Résultat avant correction](voice-regressions-before.log).
- `npm test` : **154/154 réussis**, aucun ignoré — [journal](unit-tests.log).
- Tests ciblés voix/annulation : **11/11 réussis**. Ils couvrent aussi préférence
  distante ancienne, MP3 absent, lecture effective, mode silencieux et lecteur d’écran.
- Brave `npm run test:e2e` : **45/45 réussis**, aucun ignoré —
  [journal](browser-tests.log).
- `node scripts/release.mjs --check` : **educa-22be3a4534, 405 fichiers**, à jour —
  [journal](release.log). Les 24 MP3 sont ajoutés au précache complet.
- `node scripts/build-site.mjs /tmp/educa-pr3-site` : assemblage réussi —
  [journal](build.log). Les 24 nouveaux fichiers assemblés correspondent à leurs
  SHA-256 ; documentation et outils restent exclus du site.
- `git diff --check` : réussi ; aucun marqueur de conflit restant.

Le décodage des 35 fichiers après installation puis coupure réseau et la réponse
audio Range sont testés. Un MP3 manquant est aussi exercé sous CSP réelle : le
WAV local est lu, puis `stop` arrête audio et bouche. Ces contrôles ne prouvent
pas ce qu’un enfant entend sur un téléphone.

## Limites perceptives

Les consonnes sont extraites puis prolongées ou coupées à partir de mots ; le
`v` combine notamment une partie voisée et du souffle de `f`, comme décrit dans
les attributions et le script. Le test spectral vérifie quelques propriétés
techniques (énergie, durée et séparation de fréquence), pas leur validité
pédagogique ou la qualité perceptive de chaque phonème.

Une écoute humaine des 36 phonèmes et des exercices concernés sur téléphone,
casque et haut-parleur reste nécessaire. Aucun essai sur appareil physique ni
validation professionnelle n’est annoncé dans ce lot.
