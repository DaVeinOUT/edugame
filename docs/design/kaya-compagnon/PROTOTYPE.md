# Prototype local de Kaya — 25 octobre 2026

## Réalisé

Kaya entier est rendu à l'accueil et dans la zone réservée au-dessus de la leçon. Le secours SVG entier est présent immédiatement. Le compagnon ne recouvre pas l'exercice et ses commandes restent des boutons HTML : masquer/afficher, et calmer les gestes à l'accueil. Le choix visuel est conservé pendant l'ouverture du jeu ; il ne modifie aucune donnée de progression.

Le prototype 3D est **un vrai modèle procédural articulé**, constitué de maillages sphériques et d'un tube courbe, éclairés dans une scène WebGL. Sa source reproductible est `js/ui/kaya-model.js`, création originale EDUCA sous la licence MIT du dépôt. Les rosettes sont dessinées de façon déterministe dans une texture locale de 512 × 256 pixels. Aucun modèle, texture ou service distant n'est appelé pendant le jeu. Le SVG n'est pas présenté comme une image générée par IA.

Il s'agit d'une étape technique et visuelle provisoire : aucun GLB, rig avec skin, pelage ou jeu de clips glTF n'est livré. Les articulations tête/pattes/queue et les poses sont calculées dans `poseJaguar`. Les poses présentes sont repos avec respiration et clignement, salut de patte, attention, aide, parole approximative, petite joie et repos yeux fermés. La fidélité artistique à l'illustration de référence reste à valider.

## Comportement et intégration

`js/core/companion.js` choisit les états sans dépendre de WebGL. L'audio réel et le geste sont indépendants : une salutation ou une petite célébration peut se poursuivre pendant la parole. Une aide interrompt la célébration et ne met pas une réaction tardive en attente. Navigation, masquage et pause annulent les réactions et la parole visuelle.

`kayaEl` conserve l'API des écrans existants. `setMood` reçoit déjà les retours des activités évaluées. Les événements d'accueil, d'attention, d'aide et de pause sont reliés dans les écrans. `observeCompanions` est monté une fois dans `main.js` ; il détruit la scène précédente avant d'en ouvrir une autre. `voice.onPlayback` déclenche les mouvements de bouche au début et à la fin de la lecture réelle. Ce n'est pas une synchronisation phonémique.

Le renderer est chargé par import dynamique local et ne bloque pas les activités. Un import absent, un refus de WebGL ou une perte réelle du contexte déclenche le secours SVG. Les ressources propres à la scène (géométries, matériaux, texture, contexte, écouteurs et observateurs) sont libérées au départ.

## Budgets et hors ligne

- Three.js r180 / 0.180.0, deux modules minifiés locaux et licence MIT sous `js/vendor/three/` : 720 024 octets non compressés, mesurés par `wc -c`.
- Contrôleur, quatre modules UI, SVG source et CSS : 25 253 octets lors de la mesure initiale ; le total exact évolue avec les corrections, refaire `wc -c js/core/companion.js js/ui/kaya*.js css/kaya.css js/vendor/three/*.js`.
- Une seule scène ; taille du canvas plafonnée à 256 pixels CSS et densité à 2 ; cadence plafonnée à environ 30 images/s ; aucune ombre dynamique.
- Pas de boucle `requestAnimationFrame` hors écran, onglet caché, compagnon masqué ou réduction des mouvements (système, profil et commande locale). Dans ces modes, une pose fixe peut être redessinée lors d'un changement utile.
- Le moteur et les fichiers Kaya sont inclus dans le précache global. L'import dynamique retarde l'exécution JavaScript, **pas** le téléchargement du paquet hors ligne. Le SVG n'attend pas le moteur.

La stabilité de cadence, l'énergie et l'absence de pertes de contexte sur une tablette ou un téléphone physiques restent à mesurer. Les résultats Chromium avec rendu logiciel ne constituent pas une mesure de performance matérielle.

## Vérifications exécutées

- `node --test tests/unit/companion.test.mjs` : 5 tests réussis (échéances, priorités, parole séparée du geste, navigation, repos, masquage, mode discret).
- `node --test tests/e2e/kaya.test.mjs` : 3 tests réussis dans Chromium réel avec WebGL logiciel autorisé. Vérification du contexte WebGL 2 et lecture d'un fragment non transparent du maillage ; le test ne se limite pas à vérifier la présence d'un canvas.
- Parcours : accueil puis leçon, réponse réellement persistée, zone du compagnon séparée de l'exercice, trois allers-retours collection/accueil, une scène au maximum et aucune RAF restante sur la collection.
- Réduction des mouvements système/profil, masquage par Entrée et affichage sans débordement à 390 × 844.
- Import de renderer bloqué, WebGL refusé, initialisation de texture Canvas2D refusée (contexte créé puis libéré) et contexte perdu avec `WEBGL_lose_context` : secours entier et accès à la leçon conservés.
- Contrôle complémentaire du premier test après ajout de la pause réellement hors écran et du gestionnaire de visibilité (événement simulé) : réussi. Une capture réelle à 390 × 844 a été inspectée pendant l'intégration.

Les tests globaux, le cache régénéré, la relecture indépendante et les corrections d'intégration sont consignés par l'agent principal dans `docs/workflow/PROGRESS.md`.

## Prochaine étape artistique et matérielle

Créer/valider une fiche originale face, trois quarts, profil et dos à partir de la référence du bébé jaguar ; affiner proportions, museau et rosettes du prototype. Pour la cible de production, produire un GLB local avec source éditable, rig/skin, clips nommés (`idle`, `greeting`, `attentive`, `speaking`, `celebrating`, `helping`, `resting`), licence/provenance et budgets mesurés. Aucun outil Blender ni asset GLB n'était disponible au début de ce lot. Le prototype procédural n'est pas déclaré équivalent à ce livrable.

Vérifier ensuite sur iPhone/Android/tablette physiques : cadrage, énergie, pause réelle en arrière-plan, clavier/lecteur d'écran et préférence de confort. Une validation humaine de l'identité artistique reste requise avant de produire de nombreux assets.
