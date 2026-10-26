# Vérification de l’implémentation — 25 octobre 2026

Base récupérée : `be93e10`, branche `main`, répertoire initialement propre. Travail non commité, sans push ni déploiement. Les audits sur `fd23ac1` sont des preuves antérieures distinctes.

## Résultats finaux

| Commande réellement exécutée | Résultat |
| --- | --- |
| `npm test` | 137 réussis, 0 échec, 0 ignoré — [journal](unit-tests.log) |
| `CHROMIUM_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npm run test:e2e` | 33 réussis, 0 échec, 0 ignoré — [journal](browser-tests.log) |
| Même navigateur, `node --test --test-name-pattern='installation complète' tests/e2e/cards.test.mjs` | 1 réussi, assertion supplémentaire de rendu 3D après coupure réseau — [journal](offline-3d.log) |
| `npm run release` et `node scripts/release.mjs --check` | `educa-c64a74d3f0`, 376 fichiers, à jour |
| `node scripts/build-site.mjs /tmp/educa-site-final` | 12 éléments racine copiés, assets et licence inclus, docs/tests/outils exclus |
| `git diff --check` | réussi |

Navigateur contrôlé : Chromium 155.0.8059.40, binaire Brave local via Playwright. La 3D est testée avec WebGL, y compris lecture de pixels ; il ne s’agit pas d’une simple assertion sur un attribut de canvas.

Contrôle complémentaire sur le site **assemblé** sous `/tmp/educa-site-final` : création d’un profil témoin, installation du worker, accueil WebGL, coupure réseau, rechargement, accueil WebGL puis décodage de la grande carte `son-m`. Aucune erreur JavaScript. Vérification filesystem de l’absence de `docs`, `.agents`, `.codex`, `tests` et `scripts` ; licence Three.js copiée.

## Risques exercés

- Reprise d’écritures après panne/quota, journal partiel et deuxième réouverture ; deux stores et deux onglets, fermeture du détenteur du verrou.
- Anciens profils, migration de 30 enfants de même animal, conservation des IDs/progrès, collisions de repères, import divergent et paramètres locaux explicites `null` conservés.
- Préférence distante ancienne exclue, absence de voix locale, début/fin audio réels, annulation du secours WebAudio.
- Temps actif sans réponse, intervalles idempotents, visibilité/pagehide, inactivité, minuit et horloge reculante ; aucune séance inventée par le compteur.
- Modales au clavier, inertie, retour navigateur, focus restitué et verrou applicatif conservé.
- Cartes après rechargement et sans réseau, image manquante, réduction des mouvements, diplômes et compteur conservés.
- Kaya dans une leçon réelle avec réponse persistée, trois navigations, une scène, zéro RAF hors écran/collection, réduction système/profil, masquage clavier, renderer absent, WebGL refusé, Canvas2D refusée et contexte perdu.
- Effacement des sons IndexedDB ; création depuis le formulaire adulte autorisé puis reverrouillage ; mise à jour refusant de recharger des progrès non sauvegardés.
- Contrôles axe-core sérieux/critiques des parcours existants, mondes clair/sombre, niveaux, classe, espace adulte et pages publiques.

## Défauts reproduits puis corrigés pendant ce travail

Au départ : 97 tests unitaires verts et test clavier rouge (1 réponse). Sauvegarde perdue après panne et écrasement par deuxième instance reproduits par tests d’abord rouges. Maj+Tab sortait des cartes ; ancienne préférence sélectionnait la voix distante. Annulation WebAudio et réglages d’appareil malformés reproduits par tests rouges.

L’intégration intermédiaire a révélé des attributs ARIA invalides sur Kaya, puis un nom accessible de profil ne correspondant pas au badge visible ; ces défauts ont été corrigés sans réduire les contrôles axe. Le test clavier attend désormais les choix/corrections utilisables en gardant l’exigence de quatre réponses. Une mise à jour pouvait recharger pendant une panne de sauvegarde : reproduction navigateur rouge, correctif et test vert. Le formulaire d’ajout depuis Données adulte était reverrouillé trop tôt : parcours corrigé et testé.

## Captures inspectées

Les images proviennent du parcours réel à 390 × 844, avec un profil témoin et réduction des mouvements. Les grandes illustrations ont été capturées après décodage.

- [Accueil avec vrai Kaya 3D](accueil-kaya.png)
- [Collection](collection.png)
- [Carte son m — moto](carte-son-m.png)
- [Carte première leçon](carte-premiere-lecon.png)

## Limites de la preuve

Aucun essai sur appareil mobile physique ni validation manuelle complète avec lecteur d’écran. Pas de mesure de cadence/énergie sur tablette. Le modèle est procédural et articulé ; aucun GLB de production avec rig/skin/clips exportés n’est livré. La cohérence de l’identité artistique reste à valider.

Les relectures indépendantes du diff et de l’aide n’ont trouvé aucun défaut bloquant nouveau après correction. Elles ne constituent pas une validation professionnelle ni une preuve d’efficacité pédagogique. L’écoute de certaines options via 🔊 reste une limite préexistante de traçabilité des aménagements ; l’aide explicite garde son résultat distinct.
