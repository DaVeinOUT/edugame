# HANDOFF — état du chantier EDUCA (10 lignes max)

- **Chantier « EDUCA v2 »** (carte blanche de Dave), branche `educa-v2` (rien poussé, `gh` non connecté). v1 retirée du code (reste dans l'historique git).
- **Jouable de bout en bout** : `index.html` (CSP stricte, `media-src 'self' blob:`) → `js/main.js` ; écrans `js/screens/` (profils par animal, accueil « Jouer », chemin 66 sons, leçon + bilan Élo/cartes, positionnement dès 7 ans, **niveaux des grands CE1→3e** `levels.js`, collection, échelle d'échecs, jeux libres, tracé, espace des grands protégé) ; exercices `js/activities/` (dont `text.js` : trou, question, texte, mot à toucher, ordre).
- **Moteur pur testé** `js/core/` : seg, elo (affichage = record θ−σ), srs (Leitner, promotion seulement à l'échéance), select (80 %), session (+ plafond quotidien, temps actif), placement, levels (déblocage contrôle ≥70 % ou Élo, modules en chaîne), schema (profils bornés, import = copie la plus avancée), time (jour local, temps actif).
- **Données** : `js/data/curriculum.js` (66 étapes sourcées) ; `js/data/levels.js` écrit par l'agent enseignant (n3 CE1-CE2, n4 CM1-CM2, n5 6e-5e ; n6 4e-3e en cours) + rapport `rapports/2026-10-13-niveaux-ce1-3e.md`.
- **Tests** : `npm run check` (unitaires + liste hors-ligne) · `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` (8 parcours). `npm run release` après tout changement de fichier servi.
- **Revue de code du 13/10** : 15 constats tous corrigés (`ops/REVUE-2026-10-13.md`).
- **En cours (agents)** : niveaux n6 + rapport (agent enseignant) ; recherche voix humaine Lingua Libre + appli mobile TWA (`rapports/2026-10-13-voix-humaine-et-mobile.md`, à implémenter ensuite). Puis : relecture enseignant/orthophoniste des niveaux et du chemin.
- **Hook GateGuard** : 1re édition de chaque fichier refusée tant qu'on n'a pas énoncé les faits (appelants, API, données, consigne citée) ; relancer ensuite.
- **Attend Dave** : licence (MIT provisoire) ; relecture humaine des contenus ; PR vers `main`.
