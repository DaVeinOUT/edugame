---
name: educa-kaya-3d
description: Concevoir ou implémenter Kaya comme compagnon animé d’EDUCA, avec comportement réactif, vraie scène 3D et repli accessible. À utiliser pour le personnage, ses animations et son intégration aux événements du jeu.
---

# Kaya compagnon et 3D

Lire `docs/design/kaya-compagnon/README.md`. Inspecter `js/ui/kaya.js`, `js/ui/caption.js`, `js/services/voice.js` et leurs appelants avant de remplacer une interface.

Préserver l’identité du bébé jaguar et la cohérence avec les illustrations dans `docs/design/cartes-ia/images/`. Une génération d’image donne une référence ou un sprite, pas un GLB avec rig et clips. Identifier précisément les modèles, textures, animations, outils et licences réellement disponibles.

Séparer une machine d’états testable du renderer. L’état dépend des événements du jeu et de la voix ; le renderer 3D et le repli 2D consomment la même interface. Prévoir pause/reprise et destruction. Les anciens petits portraits peuvent rester utilisés là où un personnage entier détournerait l’attention.

Pour la 3D, employer une bibliothèque locale à version fixée si nécessaire, charger les assets localement et documenter le poids. Utiliser un vrai maillage animé ou un modèle procédural réellement 3D avec une provenance reproductible ; signaler honnêtement la qualité provisoire. Un personnage constitué de primitives n’est pas une direction artistique finale validée.

Contrôler la boucle de rendu, plafonner la densité de pixels, arrêter le travail hors écran/onglet caché et libérer géométries, matériaux, textures et écouteurs à la destruction. Tester l’absence de modèle, la perte de contexte WebGL et les navigations répétées. Prévoir un repli qui laisse l’exercice fonctionnel.

La voix et les animations doivent s’arrêter ensemble lors d’une navigation. Ne pas confondre sous-titre, début audio réel et fin audio ; si les visèmes ne sont pas disponibles, présenter les mouvements de bouche comme approximatifs.

Respecter réduction des mouvements, clavier, lecteur d’écran, zones sûres et choix de masquer Kaya. Un geste affectueux reste facultatif et ne conditionne aucun acquis. Ne pas ajouter de service conversationnel distant ni de permission micro permanente.

Références à consulter lors du choix technique : documentation officielle du moteur utilisé, loader glTF/GLB, animations et libération des ressources. Faire passer les critères du cahier des charges avant les effets décoratifs.
