
## 2026-09-21 19:07 — T01 (BLOQUÉE)
- Polices en local, suppression de Google Fonts
- branche : openclaw/T01 · session : a02a8de1-a3e8-4f19-8954-8ab4e650142f
- résumé : 

## 2026-09-21 21:00 — T02 (FAITE, QA PASS)
- Licences : `LICENSE` (MIT provisoire), `fonts/LICENSE.txt` (copyright OpenDyslexic + SIL OFL 1.1 verbatim + avis Bitstream Vera par précaution), section « Crédits et licences » dans le README.
- branche : openclaw/T02
- à trancher par Dave : MIT ou CC BY-SA pour le projet.

## 2026-09-21 19:18 — T02 (terminée)
- Licences manquantes (projet + OpenDyslexic OFL)
- branche : openclaw/T02 · session : 7ac014c9-a61f-44eb-ad7b-90af690ed73d
- résumé : La tâche T02 est terminée sur le disque et educa-qa a validé le critère de fin (PASS), mais **je n'ai pas pu faire le commit** : les commandes `git add` et `git commit` ont été refusées dans cette session. Rien n'a été poussé.  **Fichiers créés ou modifiés :** - `LICENSE` : licence MIT, `Copyright (c) 2025-2026 Dave (DaVeinOUT)`. C'est un choix provisoire, Dave doit trancher entre MIT et CC BY-SA 

## 2026-10-12 11:30-12:05 — Refonte EDUCA v2, session 1 (coupée par la limite d'usage)
- Demande de Dave : jeu « le plus jouable possible », recommandable en classe pour les dys, Élo type échecs non pénalisant, cours à repousser, carte blanche (3D permise), sauvegardes régulières.
- Architecture retenue (modules ES, zéro dépendance d'exécution) : `js/core/` (pur, testé sous Node), `js/data/` (parcours, lexique), `js/services/` (store, voice, sfx, errors, i18n), `js/ui/` (dom, router, kaya, cartes 3D, coloration syllabique), `js/screens/` (profils, onboarding, accueil, chemin, résultats, collection, espace adultes, positionnement), `js/activities/` (écoute/conscience phonologique, son→lettre, fusion de syllabes, lis le mot→image, construis le mot entendu avec tuiles-graphèmes, tracé avec ordre des traits, phrases).
- Données : clé `educa2:device` + une clé `educa2:p:<id>` par enfant ; profil = confort, elo {theta, v, n, peak, lastAt, history}, mem {idItem: {b, due, s, k, last}}, path {open, stars}, stats, cartes, wallet.
- Élo : P = g + (1−g)·σ(θ−d) (g = chance au QCM) ; mise à jour bayésienne approchée + bruit q=0.004/réponse ; affichage = max historique de θ−σ converti (1000 + 174·θ) ; titres Pion 0, Cavalier 600, Fou 800, Tour 1000, Dame 1200, Roi 1400 ; cible ≈ 80 % de réussite ; « je ne sais pas » = demi-information. Paramètres à recaler avec le rapport de recherche.
- Idées validées pour la suite : séance du jour en un bouton, chemin visuel par univers, cartes par son + cartes de titres, cérémonie de promotion, profils par animal (classe), espace adultes protégé (courbe Élo honnête, sons maîtrisés, confusions, activités hors écran, impression), étape imposée par l'enseignant, sous-titres, mode lecteur d'écran, mode contacteur, sons enregistrés des phonèmes (Piper ?) avec repli sur mot d'appui.
- Recherches lancées en sous-agents (à vérifier / relancer si absentes) : Élo en éducation (Math Garden, Pelánek, simulation Python) ; progression CGP française (guide orange 2019, CSEN, Kalulu, mots décodables + émojis) ; dyslexie et adoption en classe (espacement, polices, coloration syllabique, RGPD) ; audio des phonèmes hors-ligne (Piper, licences, formats).

## 2026-10-12 16:10-21:35 — Refonte EDUCA v2, session 2
- Recherche pédagogique sourcée (`rapports/2026-10-12-pedagogie-sources.md`) appliquée : parcours de 66 étapes (muettes en 12, brèves avant nasales, b/d/p/q éloignés + contraste, mots-outils décodables, coloration syllabique en option).
- Interface v2 complète (écrans, exercices, Kaya, cartes 3D, Élo, espace des grands), ancienne v1 retirée du code.
- Hors-ligne généré (`scripts/release.mjs`), mise à jour sous contrôle, CI tests → déploiement de l'appli seule, 5 tests e2e + 54 unitaires verts.
- Sons purs : synthèse WebAudio des consonnes + enregistrement par l'adulte (IndexedDB). Voix locales prioritaires (confidentialité).
- Docs : README v2, CONFIDENTIALITE.md, rapports Élo et feuille de route v2. Backlog mis à jour (T19, T22 à faire ; T10, T11, T20, T23 partiels).
