# État de reprise — EDUCA

## Dernier état vérifié — 25 octobre 2026

Les changements applicatifs sont commités et poussés sur **main** :

- `1fb925f` : fiabilité locale, compagnon 3D initial et deux cartes.
- `07557e2` et `7b7ca8d` : preuves, reprise et nettoyage des branches.
- `ded9863` : traçabilité des aides et aménagements.
- `1307ee5` : nouveau GLB riggé, source Blender, présence agrandie, contrôles et intégration.

Aucune modification étrangère identifiée lors des revues du diff. Aucun reset ni
push forcé. main reste la branche principale et `origin/HEAD` pointe vers elle.
La CI applicative de `1307ee5` a réussi : unités, cache, navigateur et publication du workflow existant. Le commit de preuves suivant ne change pas les ressources jouées. Les résultats locaux finaux ci-dessous sont également acquis.

## Branches et pull requests

`preview/v11` a été supprimée après preuve d’ascendance : aucun commit propre,
histoire intégralement accessible depuis main. `fix/consonnes-voix-humaine` et sa
PR3 ouverte sont conservées : commit `bd7f278` non intégré, 24 MP3 humains et
changements audio utiles. Vérification isolée de cette branche : **97/97 unités**,
**21/21 navigateur**, release à jour. Pas de merge aveugle avec les protections
audio récentes de main. PR1/PR2 fusionnées ; leurs branches étaient déjà absentes.
`fetch --prune` et vérification des références effectués, sans autre branche
locale à supprimer. [Rapport complet](BRANCHES.md).

## Kaya : prototype, candidat artistique, livraison finale

- **Prototype fonctionnel conservé** : historique dans [PROTOTYPE.md](../design/kaya-compagnon/PROTOTYPE.md) et les commits. Il ne constitue pas le modèle de production.
- **Candidat artistique v1 intégré** : nouveau maillage anatomique continu, cavités d’yeux, visage/proportions, atlas de rosettes, pattes potelées et queue arrondie. GLB local de **1 869 788 octets**, **42 652 triangles**, 23 518 sommets pondérés, un skin et **14 joints**. Huit clips : idle, greeting, attentive, speaking, helping, encouraging, celebrating, resting ; morphs de paupières et bouche. Ce n’est pas un simple export des primitives du prototype.
- **Source et fabrication** : [fiche quatre vues et prompt](../design/kaya-compagnon/production/CHARACTER-SHEET.md), `.blend` éditable, atlas et [pipeline reproductible](../design/kaya-compagnon/production/MODEL-PIPELINE.md). Blender officiel portable 4.5.9, hash du binaire vérifié ; aucune installation système ni dépendance distante dans le jeu. Reproduction propre validée géométriquement et export de la source éditée vérifié sans écraser le `.blend`. L’export n’est pas garanti identique bit à bit.
- **Présence réelle** : accueil agrandi, salut facultatif au clic/clavier, repos/réveil ; leçon compacte dans sa zone réservée. AnimationMixer et fondus, parole approximative liée au début/fin audio réels. Masquage, pause hors écran/arrière-plan, mouvements réduits et secours SVG immédiat. Chargement annulé si masqué ou démonté ; textures, squelettes et ressources GPU libérés.
- **Qualité artistique finale ouverte** : le rendu reste volontairement lisse et graphique, avec des contours d’yeux à affiner. Il ne prétend pas égaler la finition/fourrure de la fiche. Les validations artistiques et matérielles restent distinctes des contrôles techniques.

Le GLB figé porte le SHA-256
`b4e379ed9e170c21ce68818f1b720bfa2c6b467a860f4154bfd1632eca198ed9`.
Une déformation de patte au salut a été reproduite puis corrigée dans les poids
et l’anatomie ; les preuves ont été refaites ensuite.

[Accueil](../verification/2026-10-25/kaya-production/accueil.png),
[exercice compact](../verification/2026-10-25/kaya-production/exercice.png),
[vidéo](../verification/2026-10-25/kaya-production/animations-parcours.webm).
La chronologie distingue les actions réelles des déclenchements techniques de
clips ; aucune preuve de démonstration n’est présentée comme un apprentissage.

## Lot 6 : aides et observations livré

Journal local des **128 dernières réponses documentées** : réécoute, option
ou texte audio demandé, lecteur d’écran déclaré, aide explicite, guidage de
construction. Le panneau adulte et le CSV montrent le périmètre et l’historique
non détaillé. Les anciens résultats ne sont pas reclassés comme autonomes.
Une demande audio ne prouve pas qu’un son a été entendu. Import/fusion par ID
d’événement, limites et anciens profils vérifiés. Scores, SRS, Élo, étoiles,
cartes et conditions de gain restent inchangés. [Contrat](SUPPORT-OBSERVATIONS.md).

Les lots de fiabilité précédents restent présents : journal des sauvegardes,
verrou entre onglets, reprise/export après panne, voix strictement locale,
compteur actif idempotent, effacement IndexedDB, badges de profils et création
sous PIN. Les cartes `son-m` et `r_first` restent illustrées (286 918 octets), avec
diplômes, textes HTML et secours.

## Validation finale réellement exécutée

- `npm test` : **149/149**, aucun ignoré.
- Brave `npm run test:e2e` : **41/41**, aucun ignoré.
- WebKit desktop headless **27.2** : GLB puis réponse de leçon, aucune erreur JS ; ce n’est pas un essai Safari/iPhone physique.
- `npm run release` puis `node scripts/release.mjs --check` : **educa-4c87e707ca**, **381 fichiers**, à jour.
- `scripts/build-site.mjs` : modèle, chargeur et licence inclus ; docs/source Blender/tests/outils exclus. GLB et carte ouverts après coupure réseau sur le site assemblé. Dossier final reconstruit et fichiers vérifiés identiques.
- Revue indépendante ciblée et `git diff --check` réussis. Poids/fondus en réduction, annulation pendant chargement, vrais pixels, vrais mouvements d’os et poses des paupières vérifiés.
- Un passage intermédiaire était à 40/41 : focus repris après Maj+Tab par un autofocus tardif. Défaut corrigé par un focus modal synchrone ; assertion conservée et étendue à deux frames, puis suite entière relancée.

[Preuves finales détaillées](../verification/2026-10-25/kaya-production/VALIDATION.md).
Les passes précédentes de 137/35 puis 145/39 restent archivées ; les 97/19-sur-20
de l’audit initial sur `fd23ac1` sont historiques, pas les résultats présents.
Moteur et chargeur locaux : 870 319 octets. GLB et cartes précachés entièrement ;
le chargement différé ne réduit pas le téléchargement d’installation.

## Prochaine action exacte et limites

1. Comparer le candidat à la fiche et affiner le regard, les transitions du museau et le traitement des rosettes/fourrure stylisée, en conservant les budgets et une nouvelle version de source avant retouche. `scripts/kaya/export_blend.py` exporte une source retouchée sans la régénérer.
2. Essayer iPhone/Android/tablette physiques : cadence, énergie, vraie mise en arrière-plan, lecteur d’écran et confort tactile. Aucun de ces résultats matériels n’est inventé ; le matériel n’est pas disponible dans cette session.
3. Étendre les observations/contenus et les 81 illustrations restantes après validation des prototypes. La revue des aides n’est ni une validation professionnelle ni une preuve d’efficacité pédagogique.

À la reprise : lire cet état et PLAN, vérifier Git et le cache avant changement.
Le prototype technique, l’itération artistique 1 et la livraison finale restent
explicitement distincts ; le lot 6 global n’est pas déclaré terminé.
