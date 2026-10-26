# Kaya — retouche artistique 2, 26 octobre 2026

Cette version est une **retouche de la source Blender v1 existante**, ouverte par
`scripts/kaya/iterate_v2.py`. Le générateur v1 n’est jamais appelé. La v1 et sa
[fiche de personnage](../CHARACTER-SHEET.md) restent conservées. Il s’agit d’une
itération artistique comparative ; la finition finale n’est pas acquise par le
seul résultat des tests ou de l’export GLB.

## Changements effectivement apportés

- Sculpture proportionnelle des joues, du museau et de la bordure des orbites ;
  le corps conserve ses 9 592 sommets, 12 525 polygones et poids. Le déplacement
  maximal est de 0,01986 unité de source, sans reconstruction du modèle.
- Globes reculés et moins saillants, pupilles réduites, iris ambrés élargis avec
  variations radiales de couleur ; éclats plus petits et brillances adoucies.
- Topologie locale des paupières affinée, peau reliée à la courbure du visage et
  fine ligne de fermeture. Le clignement rétracte et comprime légèrement les
  globes derrière la peau : c’est une animation stylisée, pas une simulation
  anatomique. La fermeture suit une courbe douce avec un bref maintien fermé.
- Menton et nez rapprochés, nez moins bombé, expression de sourire ajoutée à la
  bouche. `Talk` reste indépendant de ce sourire et disponible pour l’audio réel.
- Rosettes d’origine adoucies, atlas maintenu en 1024 × 1024. Rugosité augmentée
  et petites normales de fibres en 128 × 128 ; aucun objet de fourrure, simulation,
  shader distant ou calcul procédural pendant le jeu.
- Quelques triangles des pièces rigides d’œil ont été retirés pour financer la
  retouche de surface et les morphs, sans changer les 14 articulations.

Un premier essai de Blink avait sa peau derrière la cornée ; un autre produisait
deux surfaces fermées trop plates. Les poses ont été inspectées, ces essais
corrigés, et les images livrées ont été régénérées après la correction finale.

## Sources et reproduction

Blender **4.5.9 LTS** portable a réellement été exécuté sous
`/Volumes/Blender/Blender.app/Contents/MacOS/Blender`. Sa provenance et la somme du
DMG sont documentées dans [MODEL-PIPELINE.md](../MODEL-PIPELINE.md). Aucune nouvelle
installation système n’a été faite pour ce lot.

Pour refaire la retouche initiale, utiliser un dossier isolé et sa copie de la
source v1 empaquetée. Cela préserve toute retouche manuelle ultérieure de v2 :

```sh
TASK_KAYA_REPRO=/tmp/educa-kaya-v2-reproduction
mkdir -p "$TASK_KAYA_REPRO/docs/design/kaya-compagnon/production"
cp docs/design/kaya-compagnon/production/kaya-production-v1.blend "$TASK_KAYA_REPRO/docs/design/kaya-compagnon/production/"
'/Volumes/Blender/Blender.app/Contents/MacOS/Blender' --background --factory-startup --python scripts/kaya/iterate_v2.py -- --root "$TASK_KAYA_REPRO" --render
python3 scripts/kaya/validate_glb.py "$TASK_KAYA_REPRO/assets/kaya/kaya-production-v2.glb"
```

Cette commande ouvre la source v1, écrit uniquement les fichiers v2, puis contrôle
que la source v1 n’a pas changé. `--skip-baseline` évite de rendre à nouveau les
deux vues de référence lors d’un ajustement ; il ne régénère jamais la v1.

La retouche isolée et la réexportation de la source v2 ont aussi été exécutées
par l’intégration : comptes, positions par maillage à 10⁻⁵ et même SHA-256 sur
cette machine. [Preuve de reproduction](../../../../verification/2026-10-26/kaya-v2/reproduction.json).
Cela ne garantit pas une identité binaire sur toutes les versions de Blender.
Le GLB précédent reste [archivé intact](../kaya-production-v1.glb), hors du site.

- [kaya-production-v2.blend](kaya-production-v2.blend) : source éditable, poids,
  UV, matériaux, morphs et huit pistes NLA. Ouverture dans une pose calme.
- [kaya-fur-atlas-v2.png](kaya-fur-atlas-v2.png) et
  [kaya-fur-normal-v2.png](kaya-fur-normal-v2.png) : textures empaquetées dans la
  source et embarquées dans le GLB ; elles ne sont pas des images IA nouvelles.
- [retouch-metrics.json](retouch-metrics.json) : mesures et empreinte de la source
  v1 effectivement ouverte.
- `assets/kaya/kaya-production-v2.glb` : ressource destinée au jeu. Le `.blend`,
  les rendus et ces documents restent hors du paquet servi aux enfants.

Après une retouche manuelle du `.blend` v2, exporter cette source sans relancer
`iterate_v2.py` (qui recommencerait depuis la v1) :

```sh
'/Volumes/Blender/Blender.app/Contents/MacOS/Blender' --background --python scripts/kaya/export_blend.py -- --source docs/design/kaya-compagnon/production/v2/kaya-production-v2.blend --output /tmp/kaya-v2-edited.glb
python3 scripts/kaya/validate_glb.py /tmp/kaya-v2-edited.glb
```

Cette voie a été exécutée vers `/tmp/educa-kaya-v2-edited-export.glb` : validation
réussie, huit clips conservés, source livrée inchangée. Résultat dans
[edited-export-validation.json](edited-export-validation.json).

## Budget et contrat vérifiés

Le [validateur existant](validation-report.json) a passé sur le GLB livré :

| Mesure | Résultat |
| --- | ---: |
| GLB | 2 013 720 octets, environ 1,92 Mio |
| Triangles | 39 216 |
| Sommets exportés et pondérés | 21 478 |
| Skin / articulations | 1 / 14 |
| Clips | 8, chacun avec 61 canaux |
| Images embarquées | 2 |
| Buffers ou images externes / décodeur obligatoire | aucun |

Clips et durées : `idle` 4 s, `greeting` 2,4 s, `attentive` 3 s, `speaking` 2 s,
`helping` 3,2 s, `encouraging` 2,4 s, `celebrating` 2,4 s, `resting` 4 s.
Les noms et le repère Y vers le haut / visage vers +Z restent inchangés.

Les morphs `Blink` commandent maintenant la peau, la ligne de fermeture et la
rétraction des éléments d’œil ; la bouche a `Talk` et `Smile`. Le moteur doit
toujours réserver `Talk` à la lecture effective et conserver la réduction des
mouvements, le secours et l’arrêt hors écran.

- SHA-256 GLB livré : `042dc1f4ed484c0f3fc9b565b2004903f6d4cd8bce011e967bfd0e9d79b4aa0c`.
- SHA-256 source v2 : `4626e576c8bb473a74922ae815640a75ce55ae9da62ee6a09e539a0e56d8457b`.
- SHA-256 source v1 préservée : `c87a1498a8852b64745e2b52bcc5c42fc08a122374a974d80af43e4d130f5d07`.

## Comparaisons et poses inspectées

Les comparatifs Blender emploient les mêmes lumières, la même pose `idle` à la
frame 1, une caméra orthographique d’échelle 3,15 et des images 800 × 960.
Cible caméra : `(0.06, 0, 1.36)`. Position face : `(0, -9, 2.55)` ; trois quarts :
`(4.25, -7.8, 2.75)`. Ce sont des rendus de source, distincts des captures du jeu.

- [Face avant v1](v1-before-front.png) / [face retouchée v2](v2-after-front.png).
- [Trois quarts v1](v1-before-three-quarter.png) /
  [trois quarts v2](v2-after-three-quarter.png).
- [Fermeture Blink](pose-blink-frame093.png),
  [salut](pose-greeting-frame037.png),
  [encouragement](pose-encouraging-frame037.png),
  [repos](pose-resting-frame025.png).

Pour reproduire les quatre dernières poses depuis le `.blend` v2 sans le modifier :

```sh
'/Volumes/Blender/Blender.app/Contents/MacOS/Blender' --background --python scripts/kaya/render_v2_proofs.py -- --root "$PWD"
```

## Écarts restant à travailler

Le regard est plus ambré et le museau plus fondu ; les contours et le relief des
yeux ouverts restent graphiques et demandent encore une retouche artistique.
La peau est mate et légèrement texturée, mais ne reproduit pas le pelage de la
fiche. Le modèle demeure assis et vertical, alors que la fiche montre une pose
quadrupède ; changer cette silhouette demande un travail de volume/rig distinct.

Les preuves de source ne certifient ni les transitions réelles dans EDUCA ni la
cadence, l’énergie ou la lisibilité sur une tablette physique. L’intégration
principale conserve les comparaisons en parcours, les tests hors ligne et les
contrôles d’accessibilité ; leur bilan reste dans PROGRESS.md. Aucune validation
artistique finale, pédagogique ou matérielle n’est déduite du GLB valide.
