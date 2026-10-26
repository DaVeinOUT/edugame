# Kaya : source sculptable, rig et export local

## Statut artistique

Ce lot construit un **candidat de modèle de production**, différent du prototype
de primitives du navigateur. Le personnage est original EDUCA, sous la licence
MIT du dépôt. La [fiche de personnage](CHARACTER-SHEET.md) et l’illustration
`exploit-premiere-lecon-source-v1.png` servent de références ; aucune des images
n’est renommée ou présentée comme un maillage. La validation de l’identité
artistique reste distincte de la validation du GLB et de son intégration.

Le rendu stylisé utilise des surfaces lisses et une peinture locale ; il ne
reproduit pas la fourrure détaillée de la fiche. Une amélioration artistique ne
peut pas être déduite de la seule présence de rig ou d’animations.

## Outil réellement employé

Au départ, aucun Blender, bpy, trimesh, NumPy ou pygltflib n’était disponible dans
le Python système. Un Blender officiel **4.5.9 LTS, macOS arm64**, a été téléchargé
dans `/tmp/educa-blender-4.5.9/` et monté en lecture seule sous `/Volumes/Blender`.
Il n’a pas été installé dans `/Applications` et n’entre pas dans le jeu.

- DMG : <https://download.blender.org/release/Blender4.5/blender-4.5.9-macos-arm64.dmg>
- Sommes officielles : <https://download.blender.org/release/Blender4.5/blender-4.5.9.sha256>
- SHA-256 vérifié : `e3a3d7aac381fb4e4d05197f99cd8899484d7e8bc4497c134066e6733f372238`
- API d’export : <https://docs.blender.org/api/4.5/bpy.ops.export_scene.html>
- Documentation glTF : <https://docs.blender.org/manual/en/4.5/addons/import_export/scene_gltf2.html>

Blender reste un logiciel sous sa propre licence GPL. La géométrie et la peinture
originales créées par le script restent des assets EDUCA sous MIT ; Blender n’est
pas redistribué avec l’application.

## Reproduction

Depuis la racine du dépôt, avec ce binaire ou un `BLENDER_PATH` équivalent :

```sh
BLENDER_PATH='/Volumes/Blender/Blender.app/Contents/MacOS/Blender' sh scripts/kaya/build.sh --render
```

Le script ne télécharge rien et n’installe aucune dépendance. Il utilise bpy et
NumPy livrés avec Blender. La graine `20261025`, les proportions, la palette, les
rosettes, les poids et les animations sont explicites dans
`scripts/kaya/build_model.py`.

Une seconde construction propre a été exécutée sous
`/tmp/educa-kaya-reproduction`, sans toucher à l’asset livré. Le JSON glTF, les
comptes, les durées et les ensembles de positions arrondies à 10⁻⁵ unité étaient
identiques ; les deux exports passent le validateur. L’export Blender n’est pas
bit-à-bit déterministe : l’ordre de certains triangles/sommets peut varier. La
somme SHA ci-dessous identifie donc l’asset effectivement livré, pas une promesse
de hash identique à chaque reconstruction.

- `kaya-production-v1.blend` : source éditable, armature, groupes de poids,
  matériaux, UV et actions/NLA. Le fichier s’ouvre au repos ; les autres pistes
  sont présentes mais muettes pour éviter leur superposition.
- `kaya-fur-atlas-v1.png` : peinture de rosettes reproductible, également empaquetée
  dans la source et embarquée dans le GLB. Elle est procédurale, pas générée par IA.
- `model-metrics.json` : version et comptes mesurés lors de la construction.
- `preview-three-quarter.png` : rendu de travail Blender ; les captures du parcours
  réel et l’acceptation artistique relèvent de l’intégration principale.
- `assets/kaya/kaya-production-v1.glb` : seul modèle consommable par le jeu.

La source peut être sculptée et repeinte dans Blender. Conserver une nouvelle
version avant toute retouche manuelle : relancer le générateur remplace les
fichiers v1 par son résultat déterministe.

Après une retouche dans Blender, exporter la source éditée sans relancer le
générateur. Le script suivant ne sauvegarde et ne remplace jamais le `.blend` ;
il réactive les huit pistes NLA pour l’export, y compris celles muettes à
l’ouverture de la source :

```sh
'/Volumes/Blender/Blender.app/Contents/MacOS/Blender' --background --python scripts/kaya/export_blend.py -- --source docs/design/kaya-compagnon/production/kaya-edited-v2.blend --output assets/kaya/kaya-edited-v2.glb
python3 scripts/kaya/validate_glb.py assets/kaya/kaya-edited-v2.glb
```

Cette voie a aussi été exécutée sur la source v1 vers un fichier temporaire et
son GLB a passé le validateur. Le `.blend` livré est resté inchangé.

## Construction anatomique

Le corps, le cou, la tête, les joues, le museau, les oreilles, les épaules et les
pattes sont réunis puis reconstruits par voxel remesh, relaxation et réduction.
Le maillage de fourrure est continu ; deux cavités d’yeux sont sculptées dans
la tête avant UV et skinning. Les yeux ne sont pas seulement ajoutés sur une
sphère convexe. Paupières, iris, museau inférieur, moustaches et queue restent
des pièces anatomiques éditables et pondérées.

Les avant-bras sont dégagés du ventre sous les épaules et les pattes arrière
restent derrière les pattes avant. La preuve du salut a permis de corriger un
défaut de skinning : des sommets intérieurs de patte restaient attachés au torse
et formaient une pointe étirée. La pondération finale couvre toute la patte et le
geste a été adouci ; les nouvelles poses ont été inspectées après correction.

Les rosettes irrégulières sont peintes sur un atlas 1024 × 1024 local, avec
transitions elliptiques vers le museau, la poitrine et les pattes crème. Il n’y a
ni simulation de pelage ni texture distante. La queue est effilée, fermée et
arrondie à son extrémité.

## Rig, morphs et contrat de rendu

Le GLB est exporté en repère **Y vers le haut, visage vers +Z**. Une armature
partagée comporte 14 articulations : `root`, `spine`, `head`, `jaw`,
`upperarm.L`, `upperarm.R`, `paw.L`, `paw.R`, `hindpaw.L`, `hindpaw.R`,
`tail.0` à `tail.3`. Chaque sommet exporté a de vrais indices de joints et poids
normalisés ; le corps contient des mélanges de poids aux transitions.

Morphs : `Blink` sur chacune des deux paupières ; `Talk` sur la bouche. Les pistes
de morphs et d’os partagent les noms NLA et sont regroupées en huit clips :
`idle`, `greeting`, `attentive`, `speaking`, `helping`, `encouraging`,
`celebrating`, `resting`. Le renderer doit mixer les transitions en douceur,
limiter les gestes pendant une leçon, et lier la bouche à la lecture effective.
Ce ne sont pas des visèmes ni une synchronisation phonémique.

Le contrôleur EDUCA continue de décider les états ; le modèle ne reçoit aucune
réponse cible, ne calcule aucun gain et n’appelle aucun service conversationnel.
Le secours SVG et l’arrêt du rendu restent indispensables.

## Vérification des exports

```sh
python3 scripts/kaya/validate_glb.py assets/kaya/kaya-production-v1.glb
```

Ce vérificateur standard-library contrôle l’en-tête GLB, les données finies,
les poids, les 14 joints, les huit clips, les morphs et un mouvement réel de la
patte dans le salut. Il refuse les buffers/images externes, les décodeurs
obligatoires, plus de 50 000 triangles ou un GLB de plus de 2 Mio. Ces plafonds
ne remplacent pas une mesure sur tablette physique.

Pour rendre les déformations de source et les comparer au parcours réel :

```sh
'/Volumes/Blender/Blender.app/Contents/MacOS/Blender' --background --python scripts/kaya/render_proof.py -- --root "$PWD"
```

Les PNG sous `animation-proof/` proviennent de pistes du rig, pas d’images IA.
Ils ne prouvent ni le rendu du jeu ni les performances matérielles. Les preuves
du jeu, du hors ligne et du cycle de vie sont consignées dans PROGRESS.md.

## Mesures du candidat final de ce lot

`validate_glb.py` a été exécuté avec succès sur le GLB figé :

- 1 869 788 octets (environ 1,78 Mio), 42 652 triangles, 23 518 sommets exportés et pondérés.
- Une skin, 14 joints, un atlas PNG embarqué, aucun décodeur obligatoire ni URI externe.
- Surface principale : 9 592 sommets, 12 525 polygones, une seule composante connectée ;
  4 560 sommets ont plusieurs poids non nuls aux zones de transition.
- Durées mesurées : idle et resting 4 s ; greeting, encouraging et celebrating 2,4 s ;
  attentive 3 s ; speaking 2 s ; helping 3,2 s.
- SHA-256 du GLB : `b4e379ed9e170c21ce68818f1b720bfa2c6b467a860f4154bfd1632eca198ed9`.

Le maillage continu, le rig, les poids et les morphs sont réellement livrés.
La qualité artistique reste une **itération 1** : le visage est encore très
stylisé et lisse et les contours des yeux restent graphiques. Cette limite est
distincte de la validation technique et doit rester visible dans le bilan final.
