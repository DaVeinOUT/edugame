# Mission de continuation EDUCA

État initial de cette feuille de route : 25 octobre 2026, code applicatif de référence `fd23ac1`, audit et concepts de cartes partagés dans `97cba34`. Les cases ci-dessous concernent l’implémentation dans le jeu, pas la simple rédaction des documents.

## Résultat recherché

Une application de lecture fiable, avec des données locales préservées, des cartes illustrées et Kaya comme compagnon animé, expressif et discret. La cible de Kaya comprend un personnage entier et une vraie 3D avec un repli fonctionnel. La demande s’inspire de la présence des compagnons animés de ChatGPT ; l’identité, les assets et le comportement restent propres à EDUCA.

## Ordre de travail

- [x] **1 — État actuel et socle de fiabilité.** Vérifier les défauts de l’audit et corriger les P1 : sauvegarde/reprise, concurrence, voix locale, modales et test clavier. Le résultat doit être vérifié, avec anciennes données conservées. Les explorations du compagnon et des cartes peuvent se faire en parallèle sur des fichiers distincts.
- [x] **2 — Compagnon fonctionnel.** Implémenter la machine d’états et l’interface commune, relier les événements réels, proposer accueil/aide/réussite/pause et un affichage qui ne couvre pas l’exercice. Maintenir un renderer 2D utilisable.
- [x] **3 — Prototype Kaya en vraie 3D.** Inventorier l’outillage et les assets ; produire ou intégrer un modèle local reproductible avec provenance et animations identifiées. Vérifier navigation, arrêt du rendu, fallback et fonctionnement sans réseau. Voir le cahier des charges. Un sprite ou une image ne coche pas ce lot.
- [x] **4 — Deux cartes illustrées dans le jeu.** Intégrer `son-m` et `r_first` à partir des sources disponibles, en grandes cartes et en miniatures ; garder les textes natifs ; inclure les assets dans le build/cache et rendre les diplômes consultables.
- [x] **5 — Consolidation données et classe.** Traiter limite quotidienne, restauration, effacement, assignations et identification des élèves, selon les lots de l’audit.
- [ ] **6 — Qualité et étendue.** Faire la revue des comportements, des compétences et de l’accessibilité ; améliorer les contenus et le tableau adulte par incréments ; étendre les illustrations après validation des prototypes.

État vérifié au 25 octobre 2026 : lots 1–5 réalisés dans le périmètre détaillé dans [PROGRESS.md](PROGRESS.md), 137 tests unitaires et 33 parcours navigateur réussis. Le lot 3 est un **prototype procédural réellement 3D** ; le GLB de production avec rig/skin/clips et les validations artistiques/matérielles restent à réaliser. Pour le lot 5, l’étape de classe autorise un accès et reste explicitement distincte d’une affectation automatique.

Continuation vérifiée : traçabilité des aides livrée dans `ded9863` ; candidat GLB avec source Blender, rig et huit clips dans `1307ee5`, 149 tests unitaires et 41 parcours navigateur réussis. Le candidat artistique v1 est intégré et distinct du prototype procédural ; l’acceptation artistique finale, les essais matériels et l’étendue du lot 6 restent ouverts.

## Critères communs

Chaque lot a un comportement visible, des vérifications adaptées, une revue et un état de reprise. Les tests du moteur et les contrôles hors ligne restent valides. Ne pas affaiblir une assertion pour cacher un défaut. Des médias générés, un plan rédigé ou un écran de démonstration isolé ne prouvent pas une intégration au parcours réel.

La feuille de route est **terminée** lorsque les lots autorisés sont réalisés et vérifiés. Si une dépendance empêche toute suite utile, son état est **bloquée avec reprise documentée** : préciser ce qui manque et ne pas déclarer les lots correspondants terminés. Ne pas inventer un fonctionnement autonome infini. Tout élargissement important ou action externe suit les autorisations de la mission.
