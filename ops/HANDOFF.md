# HANDOFF — état du chantier EDUCA (10 lignes max)

- **Chantier « EDUCA v2 »** (carte blanche de Dave), branche `educa-v2` (rien poussé, `gh` non connecté). v1 retirée du code (reste dans l'historique git).
- **Jouable de bout en bout** : `index.html` (CSP stricte) → `js/main.js` ; écrans `js/screens/` (profils, accueil « Jouer », chemin 66 sons, leçon, positionnement dès 7 ans, **niveaux CE1→3e** avec contrôles et contrôle d'entrée dès 10 ans, collection + diplômes, échelle d'échecs reliée aux niveaux, jeux libres, tracé, espace des grands).
- **Moteur pur testé** `js/core/` : seg, elo, srs, select, session (+ plafond, temps actif), placement, levels, schema (profils bornés), time (jour local).
- **Contenus** : `js/data/curriculum.js` (66 étapes) ; `js/data/levels.js` (4 niveaux, 40 modules + 4 contrôles, 727 questions, rapport `rapports/2026-10-13-niveaux-ce1-3e.md`, points à valider § 8) ; relecture orthophoniste EN COURS → `rapports/2026-10-13-relecture-orthophoniste.md` (à appliquer).
- **Voix humaine** (Lingua Libre, Poslovitch, CC0) : 268 mots `audio/mots/` + 11 voyelles `audio/sons/` ; outil `scripts/voix-libre.mjs` (fetch/encode/check/sounds ; ffmpeg via `FFMPEG=`) ; crédits `audio/**/ATTRIBUTIONS.md`.
- **Mobile** : manifeste v2, icônes maskable/Apple (`scripts/make-icons.mjs`), `confidentialite.html`, `scripts/build-site.mjs` + CI Pages à jour, gabarits TWA et guide `twa/README.md` (décision d'origine : Dave).
- **Tests** : `npm run check` (82 unitaires + liste hors-ligne) · `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` (9 parcours). `npm run release` après tout changement de fichier servi.
- **Hook GateGuard** : 1re édition de chaque fichier refusée tant qu'on n'a pas énoncé les faits ; relancer ensuite.
- **Attend Dave** : licence (MIT provisoire) ; écoute humaine des voix ; relecture humaine des contenus ; origine pour l'appli Android ; PR vers `main`.
