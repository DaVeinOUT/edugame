---
name: educa-delivery
description: Reprendre et livrer un lot EDUCA avec coordination des agents, vérifications et état de reprise persistant. À utiliser pour une mise en œuvre autorisée ou une reprise de la feuille de route du dépôt.
---

# Livrer un lot EDUCA

Lire `AGENTS.md`, `docs/workflow/PLAN.md` et `docs/workflow/PROGRESS.md`. Vérifier le code actuel et les changements Git ; ne pas répéter un travail déjà terminé ni considérer un audit daté comme l’état présent.

Choisir le premier lot réalisable et ses critères observables. Pour des tâches indépendantes, déléguer aux rôles du dépôt avec propriété explicite des fichiers. Garder l’intégration des services partagés au principal. Si les sous-agents ne sont pas disponibles, assurer ces responsabilités successivement.

Implémenter, exécuter les vérifications appropriées et corriger les défauts de son périmètre. Solliciter une revue indépendante pour les données persistées, le compagnon/rendu ou un parcours utilisateur modifié. L’échec connu du test clavier doit être revérifié et traité, pas ignoré.

Mettre à jour le journal avec les résultats exacts, les commandes réellement exécutées et la prochaine action. Si un asset ou outil bloque une branche, poursuivre les tâches indépendantes et consigner le besoin précis. Avancer au lot suivant dans le périmètre autorisé, sans arrêt de convenance entre deux lots. Une reprise persistante aide les sessions longues ; elle ne force pas une exécution au-delà des limites du client.

Préserver les permissions de la session et le contrôle de l’utilisateur. Une instruction de continuité n’autorise pas une action externe supplémentaire.
