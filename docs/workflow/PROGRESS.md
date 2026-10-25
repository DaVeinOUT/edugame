# État de reprise — EDUCA

## Fait et vérifié

- Audit de la référence `fd23ac1`, documents et preuves dans `docs/audits/2026-10-25/`.
- Audit et proposition de cartes poussés dans `97cba34` sur `main`.
- Trois cartes illustrées dans une planche et deux illustrations isolées disponibles dans `docs/design/cartes-ia/` ; elles ne sont pas encore intégrées au jeu.
- Kaya actuel : visage SVG dans `js/ui/kaya.js`, humeurs et animation de bouche estimée. Aucun maillage 3D ni renderer de compagnon entier n’a été ajouté au code de l’application.

## Mission actuelle

Installer les instructions partagées, cinq rôles d’agents et quatre skills du dépôt, puis transmettre un message permettant de poursuivre l’implémentation des lots de `PLAN.md`. Le présent lot configure et documente le travail futur ; il ne réalise pas encore les six lots applicatifs.

## Validation du dispositif de reprise

- `AGENTS.md`, cinq définitions de rôles `.codex/agents/` et quatre skills `.agents/skills/` ajoutés au dépôt. Configuration : agents activés, trois sous-agents simultanés maximum, sans modification du modèle ou des permissions héritées.
- Les quatre skills ont passé `quick_validate.py`, fourni avec le skill officiel `skill-creator`, avec PyYAML installé dans un environnement temporaire hors du projet.
- Les six fichiers TOML ont été parsés et leurs champs vérifiés ; les liens locaux des documents ont été contrôlés.
- Revue indépendante des instructions effectuée ; la distinction entre mission terminée et mission bloquée a été corrigée.
- Le cache de l’application reste à jour. Aucun fichier du moteur, des écrans ou du rendu de Kaya n’a été modifié dans ce lot.
- La commande CLI `--strict-config features list` n’est pas supportée par le client installé et n’a donc pas validé la découverte. La découverte effective des rôles et skills dans la session VS Code du destinataire reste à vérifier ; aucune exécution de ces cinq rôles dans VS Code n’est annoncée.

## Résultats de tests historiques à ne pas présenter comme nouveaux

Sur `fd23ac1` : 97 tests unitaires réussis ; 19 tests navigateur réussis sur 20 ; échec clavier également reproduit seul. Un parcours complémentaire avec attente des états permet quatre réponses au clavier. Le cache `educa-6650d2536f` était à jour. Voir les preuves pour les commandes et limites.

## Prochaine action de l’agent d’implémentation

Lire `AGENTS.md`, le skill `educa-delivery`, `PLAN.md` et le cahier Kaya. Vérifier Git et l’état réel des tests. Déléguer les travaux indépendants selon la disponibilité du client, avec fichiers attribués. Commencer par la sauvegarde et la synchronisation du test clavier ; explorer les assets/outils du compagnon en parallèle. Ne pas annoncer une 3D intégrée tant qu’elle n’est pas jouable dans le parcours réel.

## Format des prochains points de reprise

Pour chaque lot, remplacer ou compléter cet état par : objectif, résultat, fichiers, commandes et résultats réels, décisions, blocages précis, prochaine action. Garder un état court et courant ; conserver les rapports longs dans leurs documents dédiés.
