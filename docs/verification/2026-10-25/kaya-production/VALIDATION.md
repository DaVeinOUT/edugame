# Kaya artistique et lot 6 — validation du 25 octobre 2026

## Livrable vérifié

Le jeu charge `assets/kaya/kaya-production-v1.glb` et son atlas embarqué, avec une
skin de 14 articulations et huit clips. L’accueil lui réserve une place plus
grande ; la leçon conserve son compagnon compact au-dessus des exercices.
Salut et repos sont accessibles par des contrôles DOM. Le contrôleur reste
indépendant du modèle, sans réponse cible ni service distant.

Le code applicatif `1307ee5` est poussé sur main et sa [CI GitHub](https://github.com/DaVeinOUT/edugame/actions/runs/40224043835) a réussi ; [état archivé](ci.json).

Le modèle est distinct du prototype initial : surface anatomique continue,
cavités d’yeux sculptées, visage et proportions retravaillés, rosettes peintes,
pattes et queue, groupes de poids et morphs. La qualité reste une **itération
artistique 1**, lisse et graphique, sans prétendre égaler la fourrure et la
finition de la fiche ou constituer une validation artistique finale.

## Résultats réellement exécutés

| Vérification | Résultat |
| --- | --- |
| `npm test` | **149/149**, aucun ignoré — [journal](unit-tests.log) |
| Brave `npm run test:e2e` | **41/41**, aucun ignoré — [journal](browser-tests.log) |
| `npm run release` puis `node scripts/release.mjs --check` | **educa-4c87e707ca**, 381 fichiers, à jour |
| Site assemblé sous `/tmp/educa-production-site` | GLB et carte consultés après coupure réseau, sources/docs exclues — [contrôle](build-check.log) |
| WebKit desktop headless 27.2 | GLB chargé puis réponse dans la leçon, aucune erreur JS — [journal](webkit.log) |
| `validate_glb.py` | Skin, poids, clips, morphs, données finies, mouvement de patte, aucune URI distante ; moins de 50 000 triangles et de 2 Mio |
| Nouvelle construction propre Blender | Même JSON, comptes, durées et positions arrondies ; ordre binaire non garanti |
| Export depuis le `.blend` éditable sans régénération | Huit clips conservés et GLB valide ; source inchangée |
| `git diff --check` et revue indépendante ciblée | Réussis après corrections |

Le contrôle du site servi a été exécuté avant le dernier correctif de focus de
modale. Le dossier a ensuite été reconstruit avec le cache final ; l’identité
binaire du GLB, du chargeur, du document d’entrée, de l’overlay et du SW a été
contrôlée. La suite entière finale couvre ce correctif et l’ouverture hors ligne.

Les tests vérifient des pixels réellement dessinés, les quaternions d’un os de
la patte pendant le salut, les morphs et poids du repos après réduction des
mouvements, l’annulation d’un chargement masqué sans création GPU, la navigation,
les pannes de modèle/décodage/WebGL et la destruction des ressources.

Deux défauts découverts et corrigés pendant le lot : poids de skin provoquant une
nappe étirée au salut (nouveaux poids et contrôle des poses), et ancienne pose
restant visible si les fondus étaient rembobinés en mode réduit. Un passage
intermédiaire de la suite était à 40/41 : l’autofocus modal retardé pouvait
reprendre le focus après Maj+Tab. Il est désormais synchrone ; l’assertion est
conservée et vérifie également deux frames après la tabulation.

## Captures et preuves d’animation

- [Accueil réel](accueil.png), [exercice compact](exercice.png).
- [Salut](salut.png), [écoute](ecoute.png), [parole démontrée](parole.png), [aide](aide.png),
  [encouragement](encouragement.png), [célébration](celebration.png), [repos](repos.png).
- [Vidéo du parcours et des clips](animations-parcours.webm).
- [Chronologie, état, poids et poses du rig](proof.json), aucune erreur collectée.

Profil fictif isolé, viewport 390 × 844. La vidéo est muette : elle documente l’animation et l’interface, pas la qualité de la voix. Salut, repos, réveil, ouverture de leçon
et réponse sont des actions réelles. Les autres clips sont démontrés par des
événements techniques explicitement identifiés dans `proof.json` ; ils ne sont
pas présentés comme des réponses évaluées spontanées. La vidéo et les captures
ont été refaites après stabilisation du rig. Les anciennes preuves de travail
ont été déplacées dans un dossier temporaire, pas présentées comme finales.

Reproduction :

```sh
CHROMIUM_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' node scripts/kaya/capture-runtime.mjs
```

## Source, poids et limites

[Fiche et prompt](../../../design/kaya-compagnon/production/CHARACTER-SHEET.md),
[pipeline, source et validation](../../../design/kaya-compagnon/production/MODEL-PIPELINE.md).
GLB : 1 869 788 octets, 42 652 triangles, 23 518 sommets pondérés, un atlas.
Moteur r180 avec chargeur local : 870 319 octets. Les ressources sont précachées
entièrement ; le chargement JS différé ne réduit pas ce téléchargement.

Aucun test sur iPhone, Android ou tablette physiques, aucune mesure d’énergie ou
de cadence sur ces appareils. WebKit headless ne constitue pas un essai Safari
iOS. Les mouvements de bouche restent approximatifs, liés à la lecture réelle,
sans synchronisation phonémique. La fiche générée par IA est une référence
artistique ; le modèle et les déformations sont issus de la source Blender.
