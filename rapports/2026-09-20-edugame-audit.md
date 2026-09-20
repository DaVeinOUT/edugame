# Audit EDUCA — 2026-09-20

> Audit complet du projet `edugame` (PWA d'alphabétisation pour non-lecteurs).
> 14 propositions, hiérarchisées : 🔴 critiques · 🟠 UX/pédagogie · 🟡 code/perf · 🟢 features.

## État des lieux

**Points forts constatés :**
- Accessibilité non-lecteurs réelle : tout est doublé en audio (`Voice.speak`), pas de clavier imposé, indices visuels (emoji) partout.
- PWA hors-ligne fonctionnelle, chemins relatifs (GitHub Pages OK), polices mises en cache.
- Zéro dépendance externe : SVG inline, WebAudio pour les effets, TTS système trié par qualité de voix.
- Cartes à collectionner **méritées** (exploits réels, jamais aléatoires) — excellent design pédagogique.
- Mode révision des erreurs (`startReview`), niveau recommandé selon l'âge, anti double-clic.

---

## 🔴 Critique / Bloquant

### 1. `sw.js` : stratégie cache-first trop agressive pour l'app
- **Problème :** pour `index.html` et les JS, une fois servis depuis le cache, aucune requête réseau n'est tentée. Un utilisateur en ligne ne recevra jamais la nouvelle version sans vider manuellement le cache (le bump `CACHE_NAME` ne suffit pas car l'ancien SW répond tant qu'il contrôle la page).
- **Solution :** stale-while-revalidate pour HTML/JS/CSS (servir le cache, mettre à jour en arrière-plan). Garder cache-first uniquement pour les fonts Google. Éventuellement afficher un toast « Nouvelle version disponible — toucher pour mettre à jour » via `registration.waiting`.

### 2. `_shuffle()` biaisé
- **Problème :** `Array.sort(() => Math.random() - 0.5)` produit des permutations non uniformes (statistiquement mesurable sur 26 lettres).
- **Solution :** Fisher-Yates avec `crypto.getRandomValues()`.

---

## 🟠 UX / Pédagogie

### 3. Confusions visuelles de lettres non gérées
- `b/d`, `p/q`, `i/j`, `m/n` sont les confusions classiques des 4-6 ans. Actuellement aucune détection spécifique.
- **Solution :** matrice de confusion dans les stats ; si une paire revient ≥ 2 fois, proposer une série ciblée (ex. « b ou d ? » avec appuis visuels différenciés).

### 4. Accents non enseignés dans le Constructeur
- `étoile`, `rivière`, `île` : l'enfant tape `e` pour `é` sans explication.
- **Solution :** tuiles affichant la lettre accentuée (é, è, î…) + mention audio « avec l'accent ». Préparer le terrain pour les syllabes.

### 5. Espace Parents
- Aucun moyen de connaître la progression réelle.
- **Solution :** accès discret (long press sur le titre du hub), graphe lettres acquises / en cours / non vues, temps de jeu, voix choisie. Verrouillé par un mini-défi « adulte » (ex. « Écris le nombre 42 » ou appui long 3 s).

### 6. Feedback de fin de session trop binaire
- Les étoiles ne reflètent que la précision globale ; rater 5 lettres d'affilée en fin de partie ≠ 5 erreurs dispersées.
- **Solution :** message verbal contextuel (« Tu as assuré au début, on révise les dernières ensemble ? ») fondé sur la position des erreurs.

---

## 🟡 Code / Performance

### 7. Memory leak dans les particules
- `_spawnParticles` / `_particles` : timers non annulés si l'enfant quitte l'écran avant la fin.
- **Solution :** stocker les ids de timers, les `clearTimeout` dans `quit()` de chaque jeu.

### 8. Event handlers inline multipliés
- Chaque `_renderOptions` / `showCollection` assigne des `onclick` nouveaux. Fonctionne, mais fragile sur mobiles basiques.
- **Solution :** délégation d'événements sur les conteneurs (`optionsGrid`, `collectionGrid`, `builderBank`).

### 9. Cibles tactiles < 44 px
- `diff-card`, `option-btn`, `tile` : à vérifier/renforcer (`min-height: 44px; min-width: 44px`) — recommandation WCAG / Apple HIG pour les petites mains.

### 10. Progression non sauvegardable ailleurs que sur l'appareil
- Profil, XP et cartes vivent dans `localStorage` : perdus en cas de désinstallation ou de changement de téléphone.
- **Solution :** bouton « Exporter ma progression » (JSON téléchargeable) + import, sans serveur.

### 11. iOS : gyroscope bloqué sans permission
- Sur iOS 13+, `deviceorientation` exige `DeviceOrientationEvent.requestPermission()` (geste utilisateur requis). L'effet 3D carte est donc inerte sur iPhone/iPad.
- **Solution :** détecter iOS, afficher un bouton « Activer l'effet 3D » dans l'overlay carte.

**Remarque SEO/fiche store :** la description du manifest contient « sans honte » (présent dans le texte d'origine) ; à harmoniser avec celle du README s'il s'agit d'un reliquat.

---

## 🟢 Nouvelles fonctionnalités (vision long terme)

### 12. Mode silencieux global
Bouton 🔇 persistant (classe/bibliothèque) — inverse de la promesse « tout-audio », donc garder les sous-titres visuels actifs.

### 13. Indicateur hors-ligne réel
Au boot : si `navigator.onLine === false` et SW non prêt, afficher « Mode hors-ligne partiel » plutôt qu'un écran cassé.

### 14. Multilingue
L'architecture (tout via `Voice.speak`) le permet : externaliser les libellés dans `lang/fr.json`, viser créole / anglais / espagnol ensuite.

---

## Plan d'action proposé

- **Phase 1 (correctifs) :** points 1, 2, 7, 8, 9 — un commit « fiabilisation ».
- **Phase 2 (pédagogie) :** points 3, 4, 5, 6.
- **Phase 3 (outillage) :** points 10, 11, puis 12-14 selon priorité.

*Rapport rédigé lors de l'audit du 2026-09-20. Sources externes non consultées (recherche web indisponible pendant l'audit — erreurs réseau) ; les points 1, 9 et 11 reposent sur les standards PWA/WCAG/iOS connus, à revalider avant implémentation.*
