# Documents de travail d’EDUCA

## Reprise du travail avec agents et skills

- [Message à copier dans Codex sur VS Code](workflow/CONTINUER.md)
- [Mission et critères des lots](workflow/PLAN.md)
- [État courant et prochaine action](workflow/PROGRESS.md)
- [Kaya compagnon : comportement et vraie 3D](design/kaya-compagnon/README.md)

Les instructions partagées sont dans [AGENTS.md](../AGENTS.md), les cinq rôles dans `.codex/agents/` et les quatre skills dans `.agents/skills/`. L’état de l’implémentation et ses vérifications figurent dans PROGRESS.md ; les audits ci-dessous restent les preuves de leur référence historique.

## Audit du 25 octobre 2026

- [Audit complet : preuves, priorités et feuille de route](audits/2026-10-25/AUDIT.md)
- [11 lots de consignes à transmettre à Codex](audits/2026-10-25/PROMPTS_CODEX.md)
- [Exécutions et limites des vérifications](audits/2026-10-25/preuves/VALIDATION.md)

L’audit porte sur `fd23ac1`. Les défauts décrits sont à revérifier sur la version courante avant correction. L’ajout de ces documents ne signifie pas qu’ils sont déjà corrigés.

## Design et cartes illustrées par IA

- [Analyse du design et direction artistique proposée](design/cartes-ia/README.md)
- [Consigne d’intégration à copier dans Codex](design/cartes-ia/PROMPT_CODEX.md)
- [Prompts exacts ayant servi à générer les images](design/cartes-ia/PROMPTS_IMAGES.md)

![Trois propositions de cartes illustrées](design/cartes-ia/images/proposition-collection-v1.png)

Ces fichiers sont versionnés pour être accessibles depuis VS Code après récupération du dépôt. Ils restent hors du site assemblé par `scripts/build-site.mjs` : les deux sources isolées sont maintenant intégrées via des WebP dédiés dans assets/cards/ ; la planche reste une proposition de référence.
