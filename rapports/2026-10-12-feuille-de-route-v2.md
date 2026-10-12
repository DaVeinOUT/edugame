# EDUCA v2 — ce qui a été fait, et la suite proposée (avec le « comment »)

Date : 2026-10-12 · Branche : `educa-v2` · Demande de Dave : rendre le jeu « le plus jouable possible »,
recommandable en classe pour les enfants dyslexiques, avec un Élo façon échecs non pénalisant ;
carte blanche (3D permise, cours à refaire).

## 1. Fait dans cette refonte (testé)

| Point | Réalisation | Où |
|---|---|---|
| Cours « basiques » | Vraie méthode : 66 étapes graphème→phonème sourcées, leçons oreille→écrit, mots 100 % décodables, mots-outils, phrases, étape-contraste b/d/p/q | `js/data/curriculum.js`, `js/core/` |
| Élo | Élo bienveillant (record prudent qui ne baisse jamais, titres d'échecs, promotion), moteur adaptatif à 80 % | `js/core/elo.js`, `rapports/2026-10-12-elo-bienveillant.md` |
| Dyslexie | Andika, espacement 3 crans, muettes grisées, coloration en option, voix lente, sous-titres, sans chrono, confusions travaillées ensemble | `css/app.css`, `js/ui/theme.js` |
| Sons purs | Synthèse des consonnes + enregistrement par l'adulte | `js/services/phonemes.js`, `recordings.js` |
| Classe | Profils par animal, étape de la classe, temps max, mode silencieux, tableau de bord imprimable, export/import | `js/screens/adult.js` |
| Jouabilité | Un bouton « Jouer », chemin visuel, Kaya expressif, cartes 3D méritées, étoiles, pauses proposées | `js/screens/` |
| Robustesse (brief A1-A5, B1-B5, C1-C5) | Polices locales, licences, cache généré, mise à jour sous contrôle, publication de l'appli seule, filet d'erreurs, plan B sans voix, stockage protégé + schéma + migration v1, tests + CI, icônes allégées, CSP stricte, modules ES | `sw.js`, `scripts/`, `tests/`, `.github/` |
| Confidentialité | Aucune collecte ; voix locales prioritaires ; effacement | `CONFIDENTIALITE.md` |

Vérification : `npm test` (54 tests) et `npm run test:e2e` (5 tests navigateur : profil sans lire,
leçon complète, espace adulte protégé, sons purs, fonctionnement hors-ligne).

## 2. Proposé ensuite (par ordre d'impact), avec la manière de le faire

1. **Relecture humaine et test pilote** — *le plus important avant de recommander le jeu.*
   Faire relire `js/data/curriculum.js` (ordre, mots, phrases, textes de Kaya) par une enseignante de CP
   et une orthophoniste ; test pilote dans 1 ou 2 classes (6 semaines) avec un test de lecture d'une minute
   avant/après, groupe témoin si possible. Aucune promesse d'efficacité avant.
2. **Voix humaine de référence** — enregistrer une voix (bénévole, studio associatif) pour les ~36 sons,
   les syllabes et les mots : déposer `audio/sons/<son>.mp3` (mono, 48-64 kb/s), lister les fichiers
   dans `js/data/sounds.js`, lancer `npm run release`. L'ordre de lecture des sons est déjà prévu
   (voix de l'adulte > fichiers > synthèse > voix du téléphone).
3. **Test de positionnement** (7-12 ans) — 3 items son→lettre par étape, du début à la fin, arrêt après
   3 étapes ratées, départ à la première non acquise ; s'appuie sur `planPractice` et `elo.update`
   (θ initial plus juste). Écran à ajouter : `js/screens/placement.js`.
4. **Fiches imprimables et test d'une minute** — une page par étape (syllabes, mots, phrases, dictée),
   générée depuis le parcours (`cur.readableAt`, `cur.syllablesFor`) avec une feuille de style
   d'impression ; un chronomètre côté adulte seulement pour la fluence.
5. **Tempo de classe** — plafond de 2 étapes par semaine en mode classe et alerte douce si moins de 8 sons
   en 9 semaines (Goigoux 2016) : calcul à partir de `path` et `stats.days`.
6. **Accessibilité poussée** — audit axe-core intégré à `tests/e2e` (contrastes AA, rôles), mode
   contacteur (balayage automatique du focus), alternative au tracé (WCAG 2.5.7 : toucher les points de la
   lettre dans l'ordre).
7. **Kaya montre la bouche** — une animation de la bouche par son (lèvres fermées pour m, dents sur la
   lèvre pour f…) dans `js/ui/kaya.js` ; et des accessoires pour Kaya à « acheter » avec les étoiles
   (motivation par l'effort, jamais par l'argent).
8. **Créole et autres langues** — extraire les libellés d'interface (`js/i18n/fr.js`), puis un « mode
   Haïti/Guyane » : ordre et contrastes adaptés (u, eu ; « en » = [an] en français, [in] en créole), validé
   par des enseignants locaux.
9. **Petits textes décodables** — histoires de 3 à 6 phrases par période, lues puis questions
   d'images ; lecture à voix haute à un adulte proposée chaque jour.
10. **Diffusion** — licence à confirmer (MIT ou CC BY-SA), dépôt sur la Forge des communs numériques
    éducatifs (ÉduCommun), fiche INSHEA et « Ressources pour l'école inclusive ».
11. **3D (option)** — la 3D actuelle (cartes holographiques, promotion) reste légère ; un Kaya en 3D
    (WebGL) est possible mais coûteux sur les téléphones d'entrée de gamme : à réserver à un mode « belle
    tablette », sans jamais gêner la lecture.

## 3. Ce qui attend Dave

- Choisir la licence (MIT provisoire).
- Relire et ouvrir la PR `educa-v2` → `main` (la publication ne se fait qu'après les tests).
- Trouver l'enseignante/orthophoniste relectrice et une classe pilote.
