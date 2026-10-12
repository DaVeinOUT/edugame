# HANDOFF — état du chantier EDUCA (10 lignes max)

- **Chantier en cours : refonte « EDUCA v2 »** (carte blanche de Dave, 2026-10-12) sur la branche `educa-v2` (partie de `openclaw/T02`, commité). Objectif : vraie progression phonique, Élo bienveillant façon échecs (jamais en baisse), usage en classe / dyslexie. Plan détaillé : dernière entrée de `ops/journal.md`.
- **Fait et testé** (`npm test` = 37 tests verts) : `js/core/rng.js`, `seg.js` (notation « ch-a-t° », « m-ai|s:z-on »), `elo.js` (θ/variance, affichage = record de θ−σ, titres Pion→Roi), `srs.js` (Leitner 10 min/1 j/3 j/7 j/21 j), `schema.js` (multi-profils, migration v1, export/import).
- **Écrit mais PAS encore testé ni branché** : `js/services/{store,voice,sfx,errors}.js`, `js/ui/{dom,router}.js`. L'ancien jeu (`index.html` + `js/*.js` v1) tourne toujours, intact.
- **T01 à moitié** : polices woff2 locales + `css/fonts.css` générés par `scripts/fetch-fonts.mjs` (licences dans `fonts/licenses/`) ; reste à retirer Google Fonts de `index.html` et `sw.js`.
- **Outillage** : Node 22 (`/usr/local/bin/node`), Chromium (`/usr/bin/chromium`), `playwright-core` en dev, `tests/e2e/server.mjs` (serveur statique de test).
- **Recherches** confiées à des sous-agents → `rapports/2026-10-12-{recherche-elo,progression-lecture,dyslexie-et-classe,audio-phonemes}.md` : vérifier leur présence/complétude, relancer celles qui manquent (consignes résumées dans le journal).
- **Prochaine étape** : test de `store.js` → `js/i18n/fr.js` → données du parcours `js/data/curriculum.js` (d'après le rapport progression) → `js/core/select.js` + `session.js` → `js/main.js` + écrans (profils, accueil, chemin, activités, résultats Élo, espace adultes) → bascule d'`index.html` en modules → `sw.js` généré + CI.
- **Hook GateGuard actif** : chaque création de fichier via Write est d'abord refusée ; énoncer les faits (appelants, API, données, consigne) puis relancer.
- **Attend Dave** : licence (MIT provisoire) ; validation pédagogique du parcours ; police par défaut (Andika proposée).
