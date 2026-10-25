# EDUCA — instructions partagées pour Codex

## Mission et sources

EDUCA accompagne l’apprentissage de la lecture en français avec Kaya, des exercices progressifs et des profils locaux. Lire `docs/README.md`, puis les documents utiles au lot courant. La mission active et ses critères sont dans `docs/workflow/PLAN.md` ; l’état vérifié est dans `docs/workflow/PROGRESS.md`. Les audits sont des preuves datées à revérifier, pas une liste de corrections déjà appliquées.

Le besoin actuel inclut un Kaya compagnon expressif avec une cible de vraie 3D, et des cartes illustrées par IA. Le cahier des charges de Kaya est dans `docs/design/kaya-compagnon/README.md`. Les sources de cartes et leur consigne sont dans `docs/design/cartes-ia/`.

## Continuité du travail

Pour une mission autorisée, implémenter, vérifier, corriger puis avancer vers le lot suivant tant que le périmètre n’est pas terminé. Ne pas s’arrêter à un plan ni demander systématiquement « je continue ? ». Résoudre les choix réversibles raisonnables avec les informations disponibles.

Mettre à jour `PROGRESS.md` après un lot : résultat concret, fichiers, commandes et résultats, défauts restants, prochaine action exacte. Avant une limite de contexte ou de session, laisser une reprise exploitable. Au redémarrage, lire cet état et vérifier le code avant de reprendre ; ne pas déclarer terminé un lot simplement documenté.

Un outil absent, un modèle 3D manquant ou une validation humaine non réalisée doit être décrit précisément. Continuer les travaux indépendants possibles. Si toute la suite dépend réellement d’une information ou permission, la demander clairement ; une limite de session ne peut pas être supprimée par ces instructions. Aucune consigne ne permet de contourner les permissions, les règles supérieures ou un refus d’approbation.

## Agents

Pour les lots comportant des travaux indépendants, déléguer à des sous-agents lorsqu’ils sont disponibles. L’agent principal garde la conception d’ensemble, les fichiers partagés et l’intégration. Utiliser au plus trois sous-agents simultanés ; réduire le nombre si le lot ne le justifie pas.

Rôles du projet définis dans `.codex/agents/` :

- `educa_reliability` : sauvegardes, migrations, voix locale, service worker, temps actif.
- `educa_kaya` : comportement du compagnon, modèle et animation 3D, rendu de secours.
- `educa_cards` : illustrations, manifeste, grandes cartes et vignettes.
- `educa_reviewer` : relecture indépendante des risques, tests et accessibilité ; pas de modification sans mission explicite.
- `educa_pedagogy` : cohérence des apprentissages et qualité des observations ; pas de validation professionnelle inventée.

Avant chaque délégation, préciser les fichiers possédés, les critères et les dépendances. Deux agents n’éditent pas le même fichier simultanément. Le principal intègre les points communs tels que `js/main.js`, la voix, les styles globaux, les manifestes, le build et `sw.js`. Les sous-agents ne font pas de commit, push ou installation de dépendance sans coordination. Si ces outils n’existent pas dans le client, exécuter les mêmes responsabilités en séquence et le signaler honnêtement.

## Skills du dépôt

Lire le skill correspondant à la tâche, sans charger toute la bibliothèque :

- `.agents/skills/educa-delivery/SKILL.md` : reprise, découpage, intégration et vérification d’un lot.
- `.agents/skills/educa-reliability/SKILL.md` : données, audio, hors-ligne et compteur de temps.
- `.agents/skills/educa-kaya-3d/SKILL.md` : compagnon et vraie 3D avec repli accessible.
- `.agents/skills/educa-card-art/SKILL.md` : illustration des cartes et intégration des fichiers statiques.

Les skills disponibles sur une machine ne sont pas nécessairement installés sur une autre. Les quatre ci-dessus sont partagés dans le dépôt. Utiliser un outil de génération d’images disponible quand une illustration est demandée ; ne pas présenter du CSS ou un SVG comme une image générée par IA, ni une image 3D comme un maillage animé.

## Invariants techniques et produit

- Conserver les identifiants de profils, cartes et contenus ; migrer les données persistées de façon explicite et testée.
- Préserver le jeu local, l’absence de compte obligatoire, les données de l’enfant sur son appareil et les ressources servies localement. Aucune génération d’images ou de conversation distante pendant le jeu par défaut.
- Conserver la séparation `core/`, `data/`, `services/`, `activities/`, `screens/`, `ui/`. Le comportement du compagnon doit être indépendant de son moteur de rendu.
- L’ajout d’une bibliothèque 3D est possible si nécessaire : version fixée, servie localement, périmètre isolé, licence et poids documentés. Il ne justifie pas une réécriture générale.
- Kaya accompagne la lecture : ne masque pas les choix, ne donne pas la réponse évaluée et laisse des pauses. La réussite autonome, les aménagements et le guidage restent distinguables.
- La 3D est un enrichissement visuel : une panne WebGL, un modèle absent ou un appareil modeste ne bloque jamais une leçon. Réduction des mouvements, clavier et lecteur d’écran restent pris en compte.
- Garder l’aspect bienveillant : pas de classement des enfants, d’obligation de connexion, de sanction ou de perte affective si l’enfant quitte.
- Respecter les modifications présentes avant le lot. Ne jamais supprimer des données ou réinitialiser Git pour faciliter une correction.

## Vérification et livraison

Reproduire un défaut avant de le corriger. Ajouter les tests utiles au comportement ou au risque, sans tests de simple copie du code. Exécuter `npm test` et les parcours navigateur pertinents via `npm run test:e2e` ; `CHROMIUM_PATH` peut désigner un navigateur local. Ne pas supprimer les assertions pour obtenir un résultat vert.

Le test clavier avait échoué sur la référence `fd23ac1` ; les preuves sont dans l’audit. Vérifier son état actuel et corriger sa synchronisation sans masquer un défaut du produit. Distinguer résultat historique et test nouvellement exécuté.

Après modification de l’application ou de ses ressources, lancer `npm run release`, puis `node scripts/release.mjs --check`. Si un nouveau dossier d’assets est créé, l’inclure dans `scripts/build-site.mjs` et dans la stratégie hors ligne ; définir ce qui est réellement téléchargé. Les documents de `docs/`, `.agents/` et `.codex/` ne sont pas des assets à servir aux enfants.

Chaque lot doit avoir un résultat visible ou testable, un diff examiné et une revue ciblée. Les commits/pushs suivent l’autorisation de la mission ; les instructions du dépôt n’autorisent pas une publication externe supplémentaire. Ne pas annoncer un déploiement, une conformité ou une efficacité pédagogique sans preuve correspondante.
