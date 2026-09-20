# Implémentation des améliorations EDUCA — 2026-09-20

> Suite de l'audit (`rapports/2026-09-20-edugame-audit.md`). Validation utilisateur : tout implémenter en autonomie. Cache passé à `educa-v8`.

## ✅ Réalisé

### Fiabilisation
1. **Service worker** (`sw.js`) : stratégie **stale-while-revalidate** pour HTML/JS/CSS — le cache sert immédiatement, le réseau met à jour en arrière-plan. Les mises à jour arrivent désormais seules. Fonts Google : cache-first conservé. Cache bumpé `v7 → v8` (README mis à jour).
2. **Fisher-Yates + `crypto.getRandomValues`** : remplace `sort(Math.random)` (biaisé) dans les deux jeux — permutations uniformes.
3. **Fuites de timers colmatées** : particules et enchaînements (`_particleTimers`, `_nextTimer`) sont enregistrés et annulés dans `quit()` / `closeCard()`.
4. **Délégation d'événements** : un seul écouteur par conteneur (`#optionsGrid`, `#builderBank`) au lieu d'un `onclick` par bouton.
5. **Cibles tactiles ≥ 44 px** : `option-btn`, `diff-card`, `choice-btn`, `minigame-card`, `coll-item` (`hub-collection-btn` l'était déjà).
6. **iOS gyroscope** (`card3d.js`) : `DeviceOrientationEvent.requestPermission()` demandée au premier toucher de l'overlay carte (geste valide iOS 13+). Sans accord, le flottement CSS prend le relais.

### Pédagogie
7. **Confusions visuelles b/d, p/q, i/j, m/n** : détectées à l'erreur → message audio ciblé (« elles se ressemblent beaucoup »), comptées dans les stats, et la révision porte sur les **deux** lettres de la paire (c'est la distinction qui est difficile).
8. **Accents enseignés** (Constructeur) : tuiles accentuées affichées avec l'accent + liséré doré, nommées à voix haute (« é, accent aigu ») quand on les tape et quand elles arrivent. L'accent devient un indice, pas un piège.
9. **Feedback de fin contextuel** : erreurs concentrées en fin de partie → « tu as été fort au début, les dernières étaient fatigantes » ; confusions → « entraînement spécial ? » ; sinon message standard.
10. **Espace parents léger** (écran Stats) : grille de maîtrise 26 lettres — vert (≥80 % après 3 vues) / orange (en cours) / gris (jamais vue) + suivi par lettre `{ok, seen}`, confusions et temps de jeu persistés dans `educaLetterStats`.

### Outillage
11. **Export / import de progression** (écran Stats) : JSON téléchargeable (profil + XP + cartes + stats + voix), réimportable sur un autre appareil. Sans serveur — les données restent aux familles. Fichier invalide → message parlé, rien d'écrasé.
12. **Mode silencieux** 🔇 : coupe voix et effets (persisté), remise en un tap. Pour la classe et la bibliothèque.
13. **Indicateur hors-ligne** : toast rassurant à l'ouverture sans connexion + à la perte/reprise du réseau (« pas grave, tout fonctionne ! »).

## Vérifications
- `node --check` OK sur les 7 fichiers JS + `sw.js`.
- Serveur local : `index.html`, `sw.js`, JS, CSS, manifest → tous 200.
- Pas de navigateur disponible sur cet hôte : **le test interactif réel reste à faire** (`python3 -m http.server 8765` + un téléphone, ou je le pilote si un navigateur est branché).

## ⏸️ Non fait (volontairement)
- **Système de connexions / usage en classe** : noté dans `memory/2026-09-20.md` — coopération et amélioration personnelle, jamais compétition. À cadrer ensemble avant tout dev (données d'enfants → RGPD, probablement comptes locaux/QR plutôt qu'un serveur).
- **Multilingue** : nécessite d'externaliser ~80 libellés ; prochaine phase si souhaité.

## Commit
- Un commit local « fiabilisation + pédagogie » regroupe ces changements. Rien n'a été poussé (validation avant publication).
