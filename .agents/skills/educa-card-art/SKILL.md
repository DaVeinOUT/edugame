---
name: educa-card-art
description: Produire ou intégrer les illustrations de cartes EDUCA, leur manifeste et leurs vignettes sans changer les conditions de gain. À utiliser pour la collection illustrée et son rendu dans le jeu.
---

# Cartes illustrées EDUCA

Lire `docs/design/cartes-ia/README.md` et `PROMPT_CODEX.md` dans le même dossier. Examiner les images existantes avant de les régénérer. Les deux sources isolées concernent `son-m` et `r_first` ; la Tour n’existe encore que dans la planche.

Utiliser un générateur d’images disponible pour les nouvelles illustrations demandées et consigner prompt, référence, fichier et version. Sans cet outil, signaler ce manque et poursuivre le composant/les assets déjà disponibles ; ne pas fabriquer une fausse provenance IA.

Garder les originaux hors du paquet du jeu, produire des images et vignettes optimisées, associer les chemins aux identifiants dans un manifeste. Afficher graphèmes et libellés en HTML avec les polices du projet. Un son reste associé au mot d’appui réel des données ; les étapes sans objet d’appui demandent une composition spécifique.

Préserver les conditions de gain, le compteur et les profils existants. La collection et la révélation doivent toutes deux afficher l’illustration. Prévoir un rendu sans image, des noms accessibles, un focus visible et les diplômes.

Mesurer le poids, le cadrage en miniature et la netteté des textes. Coordonner assets, build et cache avec le principal : le chargement différé ne réduit pas un précache global. Générer les visuels en amont du jeu et ne transmettre aucune donnée d’enfant au générateur.
