# Exécutions et limites — 25 octobre 2026

Version de référence : `fd23ac1`. Aucun correctif de l’application appliqué pendant l’audit. Les fichiers de documentation ont ensuite été placés dans `docs/` pour leur partage.

## Tests du dépôt

Commandes exécutées : installation exacte du lockfile avec `npm ci --ignore-scripts`, `npm test`, `node scripts/release.mjs --check`, puis `npm run test:e2e` avec `CHROMIUM_PATH` pointant vers le Chromium headless installé sur la machine de l’audit.

- Installation : 2 dépendances de développement ; 0 vulnérabilité signalée par npm sur ces dépendances à cette date. Ce résultat ne constitue pas un audit de sécurité de l’application.
- Tests unitaires : **97 réussis**, 0 échec, 0 ignoré.
- Release : `sw.js à jour (educa-6650d2536f, 361 fichiers)`.
- Suite navigateur : **19 réussis sur 20**, 1 échec, 0 ignoré ; environ 188,6 secondes.
- Les 6 tests du fichier `a11y.test.mjs` passent.
- Échec : `tests/e2e/smoke.test.mjs:313`, « au clavier seul (ou au contacteur), on joue une leçon » ; assertion à la ligne 338, `réponses données au clavier : 2`.
- Relance ciblée avec `node --test --test-name-pattern='au clavier seul' tests/e2e/smoke.test.mjs` : 1 test exécuté, même échec avec `réponses données au clavier : 1`.

## Reproductions complémentaires

- `results.json` : inventaire, sauvegarde échouée, import du plafond, deux stores concurrents, contrôle entièrement aidé, avancement après deux échecs, leçon silencieuse initiale, diplôme invisible, fuite de focus modal et effacement incomplet d’IndexedDB.
- `additional-results.json` : 4 réponses au clavier après attente des états de l’activité ; création de profil jusqu’à l’accueil sous WebKit, sans erreur JavaScript relevée.
- Les trois captures montrent des écrans à largeur de 390 pixels. Les données des profils sont fictives et préparées pour l’inspection ; elles ne prouvent pas un apprentissage réel.

Le contrôle axe complémentaire de l’onglet Appareil, sans l’ajustement de fond du test du dépôt, ne relève aucune violation dans les catégories demandées. Il laisse 216 nœuds à vérifier pour le contraste et un résultat à vérifier pour la correspondance nom/libellé. Ces résultats incomplets ne sont pas des violations confirmées.

Le premier script a d’abord buté sur le défaut modal : après une fuite de focus, Échap ne fermait pas la carte et l’overlay interceptait le retour. Il a ensuite été adapté pour recentrer le focus dans le dialogue avant Échap afin de poursuivre les autres vérifications. Le code de l’application n’a pas été changé.

## Scripts partagés

Les deux scripts de reproduction sont inclus. Leurs chemins d’import ont été rendus relatifs au dépôt pour le partage ; le navigateur peut être choisi avec `CHROMIUM_PATH`, sinon Playwright utilise son navigateur installé. Ces ajustements de portabilité ne constituent pas une nouvelle exécution de l’audit.

Ils attendent le serveur du dépôt sur `http://127.0.0.1:8766/`. Les démarrer depuis la racine après avoir installé les outils de test. Le serveur peut être lancé ainsi dans un terminal séparé :

```sh
node --input-type=module -e "import { startServer } from './tests/e2e/server.mjs'; const { url } = await startServer(process.cwd(), 8766); console.log(url);"
```

Puis exécuter le script souhaité :

```sh
node docs/audits/2026-10-25/preuves/educa-audit-20261025.mjs
node docs/audits/2026-10-25/preuves/educa-audit-keyboard-webkit.mjs
```

Les essais utilisent des contextes navigateur isolés et des profils fictifs. Ils écrivent leurs sorties dans `/private/tmp/educa-audit-20261025` ; adapter ce chemin sur un autre système. Ne pas les pointer vers un site de production ou une session utilisateur existante.

## Limites

Pas de mesure Lighthouse ou de Core Web Vitals terrain ; pas de certification WCAG ; pas d’essai physique iPhone/iPad/Android ; pas de preuve réseau d’une transmission TTS ; pas de validation humaine de tous les phonèmes ou questions ; pas d’étude d’apprentissage ; pas d’inspection des réglages privés de production GitHub Pages. Les sources publiques sont citées dans `../AUDIT.md`.
