# Three.js r180 (0.180.0)

Moteur 3D local, licence MIT conservée dans `LICENSE`. Sources officielles :
https://github.com/mrdoob/three.js/tree/r180/build

`three.module.js` provient de `three.module.min.js`, `three.core.js` de
`three.core.min.js`. Seul le chemin d'import du premier est renommé pour viser
`./three.core.js`. Aucun CDN ni dépendance npm à l'exécution.

Poids non compressé : 338 900 + 381 124 = 720 024 octets (environ 703 Kio).
Les deux modules sont précachés à l'installation ; chargement JS dynamique pour
le compagnon, secours SVG immédiat. La licence est copiée dans le site assemblé.
Documentation de référence : https://threejs.org/docs/ et
https://threejs.org/manual/#en/cleanup
