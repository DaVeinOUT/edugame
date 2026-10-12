# HANDOFF — état du chantier EDUCA

> 10 lignes maximum. Réécrit à la fin de chaque tâche par `educa-scribe`.
> C'est le premier fichier lu au début de chaque session : la session précédente est perdue, pas ça.

- **Dernière tâche :** T02 — **done** (QA PASS), branche `openclaw/T02`. T01 reste **blocked** (pas de réseau sortant ; repérage détaillé dans le commit/journal précédent : graisses Nunito 400/700/900, Orbitron 700/900, Rajdhani 500/700 ; `@font-face` dans `css/a11y.css` ; retirer `index.html` l.15-17 et `sw.js` l.8, 45, 57-70 ; `CACHE_NAME` → `educa-v13`).
- **Fichiers touchés (T02) :** `LICENSE` (MIT, Copyright Dave/DaVeinOUT), `fonts/LICENSE.txt` (copyright OpenDyslexic + OFL 1.1 verbatim + avis Bitstream Vera), `README.md` (section « Crédits et licences »), `ops/*`.
- **Décisions :** MIT posé à titre **provisoire** ; avis Bitstream Vera ajouté car les woff viennent probablement du paquet npm `open-dyslexic` (ancienne version, licence Bitstream) — version exacte non vérifiée (pas de fontTools). `fonts/LICENSE.txt` ne contient plus de balises Jekyll (cause du retrait en de6c5fb ; Jekyll est de toute façon désactivé).
- **Décisions en vigueur :** jamais de push sur `main` ; une tâche = une branche `openclaw/<id>` ; aucune dépendance réseau ; bump de `CACHE_NAME` à chaque changement d'asset applicatif (T02 n'en touche aucun).
- **Prochaine étape :** ouvrir la PR `openclaw/T02` → `main` en demandant à Dave MIT vs CC BY-SA ; puis T03 (ou T01 si réseau/woff fournis).
- **Attend Dave :** choix de licence du projet ; réseau ou woff pour T01 ; idéalement remplacer les woff OpenDyslexic par une release officielle récente (OFL pure).
