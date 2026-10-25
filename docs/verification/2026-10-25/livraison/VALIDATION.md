# Livraison et revue complémentaire — 25 octobre 2026

Code commité dans `1fb925f` après examen du diff ; aucun changement étranger identifié. Les fichiers du nouveau lot artistique ne sont pas inclus dans cette livraison initiale.

- `npm test` : **137/137**, [journal](unit-tests.log).
- Brave `npm run test:e2e` : **35/35**, aucun ignoré, [journal](browser-tests.log).
- Deux régressions supplémentaires couvertes : relevé à pagehide avant libération du verrou (défaut reproduit : 2,3 s devenaient 0 s), et fermeture synchrone de la voix de la carte avant la nouvelle consigne lors d’une navigation.
- Cache vérifié dans une copie exacte de l’index, excluant les assets du prochain lot en cours : `educa-9526902335`, 376 fichiers. `git diff --cached --check` réussi avant commit.

La PR3 est conservée car son commit `bd7f278` est absent de main. Vérification dans un worktree détaché isolé, sans installation de dépendances : [97/97 unités](pr3-unit.log), [21/21 parcours navigateur](pr3-browser.log), [release à jour](pr3-release.log), `educa-387454ca34`, 384 fichiers. Le worktree propre a été retiré sans force après suppression du seul symlink de dépendances créé pour le test. Ces preuves ne valident pas la qualité perceptive des consonnes : écoute humaine encore nécessaire. Aucun merge de PR3 n’a été effectué.
