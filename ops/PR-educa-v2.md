# PR : EDUCA v2 — méthode de lecture complète, niveaux CE1 → 3e, voix humaine, prête pour le mobile

Branche `educa-v2` → `main` (à ouvrir par Dave : `gh auth login`, puis
`git push -u origin educa-v2 && gh pr create --base main --head educa-v2 --title "EDUCA v2" --body-file ops/PR-educa-v2.md`).

## Résumé

- **Apprendre à lire** : chemin de 66 sons ordonné d'après les sources (rapport `rapports/2026-10-12-pedagogie-sources.md`),
  leçons de l'oreille vers l'écrit, mots 100 % décodables, sons purs, répétition espacée, test de positionnement dès 7 ans.
- **Élo bienveillant** (comme aux échecs, jamais en baisse, aucun classement) : titres Pion → Grand Maître ; la jauge
  ouvre aussi les niveaux des grands (seuils calés par simulation sur la difficulté réelle).
- **Niveaux des grands CE1 → 3e** : 4 niveaux, 40 modules + 4 contrôles (727 questions) d'après les programmes en vigueur,
  relus par un regard d'orthophoniste et corrigés (jamais d'orthographe fautive montrée, réponses mélangées, règle rappelée
  et affichée par l'aide, 🔊 masqué pour les homophones) ; contrôle d'entrée dès 10 ans ; révisions espacées ; diplômes.
- **Voix humaine** : 268 mots et 11 voyelles (Lingua Libre, domaine public), contrôle acoustique automatique ; la synthèse
  complète. Outil reproductible `scripts/voix-libre.mjs`.
- **Accessibilité** : audit axe-core WCAG 2.2 AA de chaque écran (clair, sombre, adulte, exercices), clavier/contacteur,
  mode lecteur d'écran testé ; réglages dyslexie par enfant.
- **Classe** : plusieurs enfants par tablette, étape de la classe, plafond quotidien (temps actif), vue de la classe
  imprimable et exportable en tableur (CSV local).
- **Mobile** : PWA installable (bouton dans l'espace des grands), manifeste et icônes, page de confidentialité,
  gabarits Android TWA et plan iOS (`twa/README.md`).
- **Confidentialité** : aucun serveur, aucune requête tierce, rien ne quitte l'appareil (`CONFIDENTIALITE.md`).

## Plan de test

- [x] `npm run check` : 89 tests unitaires + liste hors-ligne à jour
- [x] `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` : 17 parcours (profil, leçon, niveaux, révisions, voix humaine,
      CSP blob, clavier, lecteur d'écran, hors-ligne, accessibilité axe-core, vue de la classe)
- [ ] La CI GitHub (première exécution avec les actions Pages v5/v6) passe sur la PR
- [ ] Écoute humaine des 268 mots et 11 voyelles (priorité : homographes) — voir `rapports/2026-10-13-voix-humaine-et-mobile.md`
- [ ] Relecture humaine des contenus (enseignant·e, orthophoniste) — points listés dans les rapports du 13/10
- [ ] Essai sur vrais appareils (Android ancien/récent, iPad, mode avion, sans voix, lecteur d'écran)
- [ ] Décisions de Dave : licence (MIT provisoire) ; origine pour l'application Android

🤖 Generated with [Claude Code](https://claude.com/claude-code)
