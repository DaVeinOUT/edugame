# État de reprise — EDUCA

## Résultat vérifié — 25 octobre 2026

Reprise depuis `be93e10` : `git fetch origin main` puis `git merge --ff-only origin/main`, déjà à jour. Répertoire propre au départ ; aucune modification locale écrasée. Le code vérifié a été commité dans `1fb925f` après revue du diff. Une nouvelle passe avant livraison a corrigé l’ordre du relevé à pagehide et l’arrêt audio à la fermeture des cartes. Résultat actuel : 137 tests unitaires et 35 parcours navigateur réussis ; cache `educa-9526902335` vérifié sur une copie exacte de l’index. Les preuves précédentes ci-dessous restent datées de leur passe. Les commits `1fb925f` et `07557e2` ont été poussés sur main sans force. `preview/v11` supprimée après preuve d’ascendance ; branche audio/PR3 conservée et testée (97 unités, 21 navigateur). Références locales nettoyées ; main reste la branche par défaut. Voir [BRANCHES.md](BRANCHES.md). Le lot artistique Kaya et la traçabilité des aides sont en cours.

Skills delivery/reliability/kaya-3d/card-art appliqués. Rôles configurés effectivement utilisés : fiabilité, Kaya, cartes, reviewer et pédagogie ; trois sous-agents simultanés maximum. L’agent principal a intégré les fichiers partagés et exécuté les vérifications finales.

## Lots livrés

1. **Fiabilité locale.** `store.js` conserve les écritures échouées, retente trois fois, journalise les écritures multi-clés et récupère le journal après redémarrage. Verrou Web Locks avant chargement, écran de reprise/export pour une autre ouverture ; sans Web Locks, écriture refusée explicitement et export disponible. Bandeau de panne avec réessai/export. `sanitizeDevice` protège anciens réglages et PIN valide. Imports bornés, acquis réunis sans additionner les compteurs, choix locaux conservés sur appareil déjà utilisé. Voix strictement locale même avec préférence distante ancienne ; annulation TTS/fichiers/WebAudio et bouche liée à la lecture réelle. Une mise à jour ne recharge plus une page dont la sauvegarde échoue.
2. **Kaya fonctionnel.** Contrôleur pur `js/core/companion.js`, événements réels accueil/aide/réussite/attention/repos, présence entière dans la mise en page de l’accueil et de la leçon. Masquage, mouvements limités, secours SVG entier, commandes DOM et nettoyage à navigation.
3. **Prototype réellement 3D.** Maillages articulés originaux reproductibles dans `js/ui/kaya-model.js`, respiration, clignements, salut, aide, bouche approximative et joie ; un seul renderer local. Three.js r180 / 0.180.0, MIT, **720 024 octets** de modules, aucun CDN. Pause hors écran/arrière-plan, réduction système/profil et repli après module absent, refus d’initialisation ou contexte perdu vérifiés. **Ce prototype procédural ne livre pas le GLB de production avec rig/skin/clips exportés.** Source, provenance, budgets et limites : [PROTOTYPE.md](../design/kaya-compagnon/PROTOTYPE.md).
4. **Deux cartes IA.** `son-m` et `r_first` à partir des PNG existants, quatre WebP total **286 918 octets**, grandes cartes + vignettes, textes HTML/Andika, manifeste et secours. Diplômes consultables. Modale native : inertie, Tab/Maj+Tab, Échap, retour navigateur, restitution du focus, nettoyage à navigation ; un conflit de stockage reste verrouillé après fermeture. Voir [INTEGRATION.md](../design/cartes-ia/INTEGRATION.md).
5. **Temps, données et classe.** `play-time.js` enregistre le temps actif toutes les 5 s, à la visibilité, à pagehide et à la sortie, même sans réponse. Inactivité réelle, attribution par jour local et profil initial, pas de double comptage au bilan, plafond vérifié entre questions/lettres. Effacement inclut IndexedDB et rapporte un échec partiel. Migration persistante des repères forme/numéro/points : 30 anciens profils de même animal testés sans changer leurs IDs/progrès. Création sous PIN, y compris depuis Données adulte. L’étape de classe est explicitement un accès autorisé ; elle n’assigne pas automatiquement une leçon ni un acquis. Onglets adultes reliés à leurs panneaux, navigation clavier par flèches/Home/End.

Les nouveaux assets sont inclus dans build et précache complet. Le diagnostic adulte vérifie le cache du worker actif, sépare voix système locale et téléchargement, et propose un essai audio. Les documents, agents et outils restent exclus du site assemblé.

## Vérifications finales réellement exécutées

- `npm test` : **137/137 réussis**, aucun ignoré.
- `CHROMIUM_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npm run test:e2e` : **33/33 réussis**, aucun ignoré, Chromium **155.0.8059.40** via Brave local.
- Contrôle ciblé supplémentaire après renforcement de l’assertion hors ligne : Kaya WebGL à l’accueil puis les deux cartes après coupure réseau, **1/1 réussi**.
- `npm run release` puis `node scripts/release.mjs --check` : **à jour**, `educa-c64a74d3f0`, **376 fichiers** listés.
- `node scripts/build-site.mjs /tmp/educa-site-final` : assemblage réussi. Parcours sur ce site assemblé : rechargement hors ligne, Kaya 3D et carte illustrée fonctionnels, aucune erreur JS ; documentation et outils absents, assets et licence présents.
- `git diff --check` : réussi. Relectures indépendantes ciblées : constats corrigés ; aucun défaut bloquant nouveau identifié dans la dernière passe.
- Captures du parcours réel à 390 × 844 inspectées : accueil entier, collection, moto et première leçon. Ce sont des preuves de navigateur de bureau, pas de matériel mobile.

Les défauts ont été reproduits avant correction : écriture perdue, copie concurrente, modale échappée, préférence distante, annulation audio, réglages abîmés, et rechargement pendant une sauvegarde en panne. Le clavier de départ échouait avec **1 réponse** ; sa synchronisation a été corrigée en gardant l’assertion des quatre réponses. Les régressions d’accessibilité introduites pendant le lot ont été corrigées, puis la suite entière relancée. Les échecs hors ligne de l’intégration intermédiaire ne figurent pas parmi les résultats finaux : après stabilisation et release, les parcours passent.

Preuves, commandes et captures : [validation du 25 octobre](../verification/2026-10-25/VALIDATION.md). Les 97 tests et 19/20 navigateur de l’audit sur `fd23ac1` restent des résultats historiques distincts.

## Limites et prochaine action exacte

1. **Kaya de production** : produire un GLB original avec source éditable, rig/skin et clips nommés à partir du prototype et de la référence. Aucun GLB ni outil Blender n’était présent au départ. Valider identité/proportions sur une fiche face, trois quarts, profil et dos avant multiplication d’assets. Ne pas présenter le prototype de primitives comme ce livrable final.
2. **Matériel et accessibilité manuelle** : essayer iPhone/Android/tablette physiques, lecteur d’écran, vraie mise en arrière-plan, cadence et énergie. Les mesures logicielles headless ne prouvent pas ces résultats.
3. **Observation pédagogique** : l’aide explicite reste `outcome: help`. Les écoutes des options via 🔊 ne sont pas toutes distinguées des autres aménagements dans les agrégats ; traiter cette traçabilité sans modifier rétroactivement les acquis. La relecture ciblée ne constitue ni validation professionnelle ni preuve d’efficacité.
4. **Illustrations** : 81 cartes gardent leur rendu existant ; Tour sans asset isolé. Étendre seulement après validation des deux prototypes, avec paquet d’images versionné et téléchargement vérifié plutôt qu’ajout massif au précache.

À la reprise : lire ce document et PLAN, vérifier Git et relancer le contrôle release avant tout changement. Les lots 1–5 sont réalisés dans le périmètre décrit ; le lot 6 et la cible artistique/GLB restent ouverts.

## Lot suivant ouvert

Fiche quatre vues générée avec image_gen et conservée sous `docs/design/kaya-compagnon/production/`. Blender officiel portable 4.5.9 arm64, hash vérifié, est disponible hors du dépôt ; première version de modèle organique riggé/animé en correction artistique, non encore adoptée dans le jeu. Traçabilité des aides en cours dans un lot distinct. Voir le rapport de branches à la prochaine mise à jour.
