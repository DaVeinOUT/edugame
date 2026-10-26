# Consigne à copier dans Codex sur VS Code

```text
Dans le dépôt EDUCA, lis docs/README.md, docs/audits/2026-10-25/AUDIT.md et docs/design/cartes-ia/README.md. La demande est de rendre les cartes à collectionner plus visuelles avec des illustrations générées par IA.

Une maquette est disponible dans docs/design/cartes-ia/images/proposition-collection-v1.png. Deux illustrations sources sans textes sont déjà disponibles : son-m-moto-source-v1.png et exploit-premiere-lecon-source-v1.png. Les prompts de génération se trouvent dans PROMPTS_IMAGES.md. Inspecte ces images et le code actuel avant d’agir.

Réalise un prototype fonctionnel limité aux cartes son-m et r_first. Préserve les identifiants, les conditions de gain, les profils sauvegardés et les autres cartes avec leur rendu existant. Le visuel Tour de la planche est une référence pour la suite ; il n’existe pas encore d’asset isolé à intégrer.

Génère des versions optimisées des sources pour l’exécution et des vignettes, en préservant les PNG originaux dans docs. Place les fichiers consommés par l’application dans un dossier explicite, par exemple assets/cards/. Ne fais pas consommer les PNG de documentation par le jeu. N’appelle aucune IA depuis le navigateur du joueur.

Ajoute un manifeste reliant les images aux identifiants des cartes et un rendu de secours lorsqu’une image manque. Fais apparaître les illustrations dans la grille de collection et dans la grande carte. Prévois des dimensions explicites, un cadrage où le sujet reste entier et une ouverture rapide. Garde le graphème, le titre, le mot d’appui et les compteurs en vrai texte HTML ; utilise Andika pour les lettres à apprendre. N’utilise pas la planche comme image d’une carte complète et ne découpe pas ses textes pour les afficher.

Le style doit se rapprocher de la maquette : image dominante, lumière chaleureuse, présence de Kaya pour l’exploit, cadre de famille sobre et reflet discret. Le son m doit rester associé à moto, tel qu’il figure dans les données. Vérifie la lisibilité à la taille d’une vignette et sur téléphone. Limite les reflets et les mouvements permanents pour conserver la lecture nette.

Corrige les défauts liés à ce composant : focus visible, comportement modal complet, Échap, Tab/Maj+Tab, restitution du focus et retour navigateur. Respecte la réduction des mouvements. Affiche les diplômes déjà gagnés dans la collection sans modifier leurs conditions de gain.

Inclue les nouveaux assets dans scripts/build-site.mjs et dans la politique de cache hors ligne. Mesure leur poids et ne te contente pas de loading=lazy si le service worker télécharge tout à l’installation. Pour ce prototype de deux cartes, assure la disponibilité complète après téléchargement réussi ; décris la stratégie qui sera utilisée pour étendre la collection.

Vérifie : ancien profil, nouvelle carte gagnée, carte consultée après rechargement, absence d’image, ouverture sans réseau, clavier, réduction des mouvements, petits écrans et conservation du compteur. Exécute les tests pertinents, régénère sw.js avec npm run release et vérifie node scripts/release.mjs --check. Ne masque pas le test clavier précédemment en échec : distingue sa correction d’un éventuel défaut d’interface.

Termine par les changements réalisés, les images effectivement intégrées, leur poids, les résultats des vérifications et la liste des autres cartes restant à illustrer. Ne remplace pas tout le catalogue dans ce premier lot et ne présente pas les 83 images comme déjà produites.
```
