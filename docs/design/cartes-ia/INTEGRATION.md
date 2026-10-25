# Prototype intégré — 25 octobre 2026

Deux illustrations IA existantes sont maintenant consommées par le jeu : `son-m` (moto) et `r_first` (Kaya et son premier livre). Les PNG originaux restent dans `docs/design/cartes-ia/images/`. Aucun appel à un générateur n'a été ajouté au jeu et aucune image supplémentaire n'a été générée.

## Fichiers et poids mesurés

| Fichier dans `assets/cards/` | Dimensions | Octets |
| --- | --- | ---: |
| `son-m-640.webp` | 640 × 896 | 132 674 |
| `son-m-160.webp` | 160 × 224 | 16 158 |
| `r_first-640.webp` | 640 × 896 | 122 636 |
| `r_first-160.webp` | 160 × 224 | 15 450 |
| Total | | **286 918** (280,2 Kio) |

Conversion locale avec sharp 0.35.5 déjà disponible dans l'outillage, sans dépendance ajoutée au projet : redimensionnement à 640 ou 160 pixels de large, proportions conservées, WebP qualité 76 ou 78 respectivement, effort 6. Exemple reproductible avec sharp installé dans un environnement d'outillage :

```js
await sharp(source).resize({ width: 640 }).webp({ quality: 76, effort: 6 }).toFile(destination);
```

Le manifeste `js/data/card-art.js` relie les identifiants stables aux deux tailles, à la description, au nom de source, à la version et à la section de prompt de `PROMPTS_IMAGES.md`. Les conditions de gain et les identifiants des profils restent inchangés.

## Comportement du composant

La grille et la révélation utilisent les images optimisées, avec dimensions explicites. Le cadrage `contain` préserve les roues, le guidon, Kaya et le livre. Le graphème est en Andika ; titre, mot d'appui et compteur restent des éléments HTML. Tant qu'une image ne charge pas, l'ancien dessin ou l'émoji reste visible. Les autres cartes conservent leur illustration actuelle. Les diplômes sont désormais consultables dans une section de la collection.

La fenêtre emploie un dialogue natif et désactive explicitement l'arrière-plan. Tab/Maj+Tab restent dans la fenêtre ; Échap, bouton de fermeture et retour navigateur ferment la carte puis rendent le focus au déclencheur encore présent. Le focus reste visible sur la carte à retourner. Le déplacement et le gyroscope sont désactivés en réduction des mouvements. La carte n'oscille plus en permanence ; ses reflets sont réduits. La fenêtre défile sur un écran de faible hauteur.

## Vérifications exécutées pour ce composant

Défaut A04 reproduit avant modification avec Brave : Maj+Tab sortait de la fenêtre vers `body`, et `#app.inert` valait `false`.

Commande exécutée :

```sh
CHROMIUM_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' node --test --test-name-pattern='cartes illustrées|modale|fichier absent' tests/e2e/cards.test.mjs
```

Résultat : **3 tests réussis sur 3**. Ils vérifient ancien profil incomplet, compteur 24 préservé, 3 cartes sur 83 après rechargement, diplôme visible, Andika et texte moto, image entière, confinement Tab/Maj+Tab, inertie, Échap, retour navigateur, restitution du focus, fichier absent et réduction des mouvements. `node --check` passe pour `cards.js` et `overlay.js` ; `git diff --check` passe sur les fichiers du composant.

Captures inspectées à 390 × 844 (preuves locales de cette session) : `/tmp/educa-cards-collection-390.png`, `/tmp/educa-card-m-390.png`, `/tmp/educa-card-first-390.png`. Moto, roues et guidon entiers ; Kaya et livre entiers ; textes et bouton Continuer lisibles. Ce contrôle sur navigateur de bureau ne vaut pas essai sur téléphone physique.

Les quatre tests de `tests/e2e/cards.test.mjs` passent dans la suite finale de **33/33 parcours navigateur**, après régénération du service worker. Le test hors ligne a aussi été relancé seul après ajout de l’assertion du rendu Kaya WebGL avant consultation des deux cartes sans réseau : **1/1 réussi**. Les journaux et l’état du cache sont dans `docs/verification/2026-10-25/VALIDATION.md` et `docs/workflow/PROGRESS.md`.

## Build et téléchargement

L'intégration principale inclut `assets/` dans `scripts/build-site.mjs` et `scripts/release.mjs`. Pour ces deux cartes, les **quatre WebP sont précachés entièrement** avec l'application : `loading="lazy"` économise l'affichage, pas le téléchargement d'installation. Ils deviennent utilisables hors ligne lorsque cette installation a réellement réussi. Les PNG et les documents ne sont pas servis.

Pour étendre la collection, mesurer un petit lot représentatif et introduire un paquet d'illustrations versionné avec état de téléchargement vérifié, reprise et repli local. Ne pas ajouter 81 PNG au précache global ni annoncer tous les visuels disponibles hors ligne avant téléchargement.

## Illustrations restantes

**81 cartes** gardent leur rendu existant ; aucun asset isolé de Tour n'a été produit :

- 65 sons : `son-a`, `son-i`, `son-l`, `son-o`, `son-r`, `son-u`, `son-e`, `son-s`, `son-é`, `son-ou`, `son-muettes`, `son-f`, `son-ch`, `son-v`, `son-n`, `son-un`, `son-j`, `son-p`, `son-t`, `son-c`, `son-oi`, `son-d`, `son-è`, `son-g`, `son-b`, `son-on`, `son-es`, `son-qu`, `son-bdpq`, `son-est`, `son-an`, `son-en`, `son-au`, `son-k`, `son-ai`, `son-in`, `son-ain`, `son-z`, `son-oin`, `son-ui`, `son-doubles`, `son-e-è`, `son-eu`, `son-am`, `son-om`, `son-im`, `son-c-s`, `son-er`, `son-g-j`, `son-eau`, `son-s-z`, `son-et`, `son-ien`, `son-ent`, `son-x`, `son-gn`, `son-ez`, `son-ill`, `son-œu`, `son-ti`, `son-ph`, `son-y`, `son-ay`, `son-h`, `son-w`.
- 5 exploits : `r_streak`, `e_regular`, `e_perfect`, `e_persist`, `l_educa`.
- 7 titres : `titre-cavalier`, `titre-fou`, `titre-tour`, `titre-dame`, `titre-roi`, `titre-maitre`, `titre-grand-maitre`.
- 4 diplômes : `diplome-n3`, `diplome-n4`, `diplome-n5`, `diplome-n6`.
