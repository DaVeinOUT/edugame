# Livraison et nettoyage des branches — 25 octobre 2026

La branche principale GitHub reste **main** (métadonnée relue après nettoyage), et `origin/HEAD` pointe vers `origin/main`. La livraison vérifiée comporte `1fb925f` (application, ressources et tests) et `07557e2` (preuves et reprise), poussés normalement sur main sans force.

## Comparaison des trois branches initiales

| Branche | État et preuve | Décision |
| --- | --- | --- |
| `main` — initialement `be93e10` | Branche par défaut, code vérifié et livraison de la mission | Conservée comme principale |
| `preview/v11` — `b0dd4ed550ae4087bacda9aac9af39eb7f897ada` | Ancêtre strict de main ; comparaison à `be93e10` : 9 commits côté main, **0** côté preview ; aucun commit `main..preview` | Supprimée sur GitHub par `git push origin --delete preview/v11`, sans force ; histoire entièrement accessible depuis main |
| `fix/consonnes-voix-humaine` — `bd7f27820b35caf07364d91843bc30409df4499f` | Un commit propre, parent `fd23ac1`, patch distinct de PR2. Ajoute 24 MP3 humains, leur provenance/extraction et des changements d’interruption audio | **Conservée**, travail utile non intégré, PR3 ouverte |

La tête de preview a été relue avec `git ls-remote --heads origin preview/v11` juste avant suppression ; son SHA était toujours celui comparé. Aucun travail propre n’a été supprimé. Aucune branche locale de travail supplémentaire n’existait : seule main était locale.

## Pull requests vérifiées

- [PR1](https://github.com/DaVeinOUT/edugame/pull/1), `educa-v2` : fusionnée le 19 octobre 2026 ; branche déjà absente avant ce nettoyage.
- [PR2](https://github.com/DaVeinOUT/edugame/pull/2), `fix/sons-lecteur-commun` : fusionnée le 19 octobre 2026 ; branche déjà absente avant ce nettoyage.
- [PR3](https://github.com/DaVeinOUT/edugame/pull/3), `fix/consonnes-voix-humaine` : ouverte, non fusionnée, conservée. La branche audio ne se réduit pas à PR2 : son commit est postérieur et son patch-ID est différent.
- Aucune PR associée à `preview/v11` dans l’inventaire complet des trois PR du dépôt.

PR3 vérifiée dans un worktree détaché isolé à `bd7f278` : **97/97 unités**, **21/21 navigateur**, release `educa-387454ca34` à jour (384 fichiers). Journaux dans [la validation de livraison](../verification/2026-10-25/livraison/VALIDATION.md). Le worktree propre a été retiré sans forçage. La qualité perceptive des consonnes reste à écouter par un humain ; ces résultats ne l’attestent pas.

Ne pas reprendre PR3 aveuglément : elle supprime le synthétiseur de secours et remanie les mêmes fonctions de voix que les protections de confidentialité et d’annulation de main. Une future intégration doit préserver ces protections et comparer les nouveaux sons aux sons embarqués actuels.

## Références locales

Commandes exécutées après suppression : `git fetch --prune origin`, `git remote set-head origin -a`, `git remote prune origin --dry-run`. Aucun autre nettoyage nécessaire. Références restantes : main, origin/main, origin/fix/consonnes-voix-humaine, origin/HEAD → origin/main. Aucun reset ni suppression locale forcée.

Le connecteur GitHub a servi à lire dépôt/PR ; Git et gh ont couvert les références de branches, fonctionnalité absente des outils du connecteur disponibles.

Livraisons suivantes poussées sur la même branche principale : `ded9863` (aides) et `1307ee5` (Kaya riggé). La CI applicative a réussi sur ces deux commits. La branche audio conserve son SHA initial ; aucune fusion ni suppression supplémentaire.
