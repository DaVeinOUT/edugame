# HANDOFF — état du chantier EDUCA (10 lignes max)

- **Chantier : refonte « EDUCA v2 »** (carte blanche de Dave, 2026-10-12), branche `educa-v2` (rien poussé, `gh` non connecté). L'ancienne v1 est supprimée du code (reste dans l'historique git).
- **Jouable de bout en bout** : `index.html` (CSP stricte) → `js/main.js` ; écrans `js/screens/` (création par animal, Qui joue ?, accueil « Jouer », chemin 66 étapes, leçon + bilan Élo/cartes, collection, échelle d'échecs, jeux libres, tracé, espace des grands protégé) ; exercices `js/activities/`.
- **Moteur pur testé** `js/core/` : seg (graphèmes, muettes = étape), elo (affichage = record de θ−σ, jamais en baisse), srs (Leitner), select (cible 80 %), session (leçon oreille→écrit, bilan), questions, curriculum ; données `js/data/curriculum.js` (66 étapes sourcées, ~230 mots illustrés, mots-outils, 19 phrases).
- **Tests** : `npm test` (54 unitaires) · `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` (4 bout-en-bout : profil, leçon, espace adulte, hors-ligne). `npm run release` régénère `sw.js` (à lancer après chaque changement de fichier servi ; la CI vérifie).
- **Recherche** : `rapports/2026-10-12-pedagogie-sources.md` (progression, dys, classe, sources) appliquée au parcours. Rapports Élo et audio pas encore écrits.
- **Prochaines étapes** : (1) sons des phonèmes ENREGISTRÉS (Piper hors-ligne → `audio/sons/*.mp3` + `js/data/sounds.js`) ; (2) rapport Élo + feuille de route ; (3) README, CONFIDENTIALITE.md, guide enseignant ; (4) revue de code (agents), accessibilité clavier/contacteur, test de positionnement, fiches imprimables.
- **Hook GateGuard** : chaque 1re création/édition d'un fichier est refusée tant qu'on n'a pas énoncé les faits (appelants, API, données, consigne citée) ; relancer ensuite.
- **Attend Dave** : licence (MIT provisoire) ; relecture pédagogique par un enseignant/orthophoniste ; choix pour la PR vers `main`.
