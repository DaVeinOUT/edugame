# Kaya — itération artistique 2 intégrée, 26 octobre 2026

Retouche de la source Blender v1 existante, intégrée après la fusion PR3
`1f15f7e`. Ce lot livre une itération artistique comparative, pas une validation
de finition. Le prototype initial, la retouche v1, cette v2 et la qualité finale
restent des jalons distincts.

## Résultat visible et appréciation

Les iris sont plus ambrés et moins saillants, les contours moins noirs, le nez
et le menton rapprochés du museau. Peinture adoucie et matériau plus mat avec
normales locales suggèrent un pelage stylisé. Les paupières ont été retouchées
après inspection de fermetures incorrectes ; elles ferment maintenant avec une
fine ligne. Les clips gardent leurs noms et un morph de sourire complète la bouche.

L’amélioration observée dans le jeu reste mesurée : les yeux ouverts sont encore
graphiques, le pelage reste éloigné de la fiche, et la silhouette assise diffère
du quadrupède de référence. La revue indépendante confirme ces limites, sans
déduire une acceptation artistique des chiffres ci-dessous.

Sur l’accueil, un disclosure natif « Options de Kaya » regroupe masquer,
calmer et repos. Tab visite ses boutons, Échap referme et restitue le focus.
Les exercices conservent leur contrôle compact, au-dessus des choix.

## Comparaisons dans le véritable jeu

[Comparaison côte à côte](comparison/index.html),
[protocole et données](comparison/proof.json).

| Vue mobile | Avant v1 | Après v2 |
| --- | --- | --- |
| Face | [Accueil](comparison/v1-front-mobile-game.png) | [Accueil](comparison/v2-front-mobile-game.png) |
| Trois quarts | [Accueil](comparison/v1-three-quarter-mobile-game.png) | [Accueil](comparison/v2-three-quarter-mobile-game.png) |

Huit prises : deux versions × deux vues × viewports 390×844 et 1100×900.
Même application courante, menu, lumière, exposition 1,1, FOV 31°, pose idle t=0
avec mouvements réduits. Le GLB v1 archivé est substitué localement à la requête
du jeu ; aucune image de source n’est substituée au canevas. Chaque réponse GLB
est hachée et comparée au fichier annoncé. Les deux Box3 et l’échelle
`0.9966832762086089` sont identiques sur ce lot : le cadrage ne crée pas le progrès.
Les presets opt-in `?kaya-view=front` et `?kaya-view=three-quarter` ne configurent
que la caméra ; aucune URL d’asset externe n’est acceptée.

[Vidéo du parcours](runtime/animations-parcours.webm),
[salut](runtime/salut.png), [repos](runtime/repos.png),
[exercice réel](runtime/exercice.png), [chronologie](runtime/proof.json).
Le salut, le repos/réveil et la réponse de leçon utilisent les contrôles réels.
Les démonstrations d’écoute/parole/aide/encouragement/célébration sont explicitement
déclenchées et identifiées comme telles. Douze échantillons des contrôles rapides
salut→repos→réveil vérifient la somme des poids. La vidéo est muette et ne prouve
ni une synchronisation phonémique ni une qualité perceptive audio.

## Source et reproductibilité réellement exercées

[Source, textures, procédure et limites](../../../design/kaya-compagnon/production/v2/README.md).
GLB : **2 013 720 octets**, **39 216 triangles**, **21 478 sommets pondérés**,
un skin, **14 joints**, huit clips, deux images embarquées. Aucun décodeur ni URI
externe. SHA-256 : `042dc1f4ed484c0f3fc9b565b2004903f6d4cd8bce011e967bfd0e9d79b4aa0c`.
Le GLB est 143 932 octets plus lourd que v1 ; le nombre de triangles diminue.
Ces budgets ne sont pas une mesure de cadence ou d’énergie sur tablette.

Le GLB v1 reste archivé intact sous `docs/design/kaya-compagnon/production/`, avec
son `.blend`. Il n’est plus servi ni précaché. Une unité vérifie son SHA immuable.

Blender portable officiel 4.5.9 a été utilisé, sans installation système :

- `BLENDER_PATH=… sh scripts/kaya/build.sh /tmp/educa-kaya-v2-wrapper-export.glb`
  exporte la source v2 éditée et la valide, sans sauver le `.blend`.
- Copie de la source v1 empaquetée dans `/tmp/educa-kaya-v2-reproduction`, puis
  `Blender --background --python scripts/kaya/iterate_v2.py -- --root /tmp/educa-kaya-v2-reproduction`.
- Validation des trois exports, comparaison des positions par maillage arrondies
  à 10⁻⁵ et des empreintes : identiques lors de ces essais. Source éditée inchangée.

[Résultats](reproduction.json), [réexport](source-export.log),
[retouche isolée](reproduction.log). L’identité binaire observée ici n’est pas
garantie pour d’autres versions de Blender. `build.sh` exporte désormais la source
éditée ; il ne relance plus le générateur initial.

## Tests logiciels

- `npm test` : **156/156**, aucun ignoré — [journal](unit-tests.log).
- Brave `npm run test:e2e` : **46/46**, aucun ignoré — [journal](browser-tests.log).
- Nouveau test de fondu d’abord rouge : une transition interrompue remettait un
  poids sortant à 1 et faisait sauter la pose. Interpolation des poids courants
  sur 280 ms avec easing ; test de continuité, retour vers un clip déjà contributeur
  et réduction des mouvements réussis.
- Les assertions de repos ciblent explicitement les deux paupières, indépendamment
  des nouveaux morphs d’iris. [Relance ciblée Kaya](kaya-targeted.log).
- `npm run release`, puis `node scripts/release.mjs --check` :
  **educa-20de197a2b, 405 fichiers**, à jour — [journal](release.log).
- Site assemblé, vrai GLB et réponse de leçon persistée, rechargement sans réseau,
  deux cartes et 35 MP3 décodés, Range206 : réussis dans **Chromium 155**
  (SwiftShader mesuré) et **WebKit desktop 27.2** (Apple GPU).
  [Preuves de compatibilité](compatibility/VALIDATION.md).
- Docs, sources Blender et archive v1 exclues du site ; seul GLB v2 dans le paquet.
  Les 405 ressources du cache sont téléchargées entièrement ; le chargement
  différé ne réduit pas ce téléchargement.
- Revue indépendante du code, des sources et des captures : aucun blocage identifié.
  Modèle absent, décodage refusé, perte WebGL, annulation, navigations répétées,
  clavier, cartes, sauvegardes et voix locale restent couverts par les parcours.

## Essais physiques et artistiques restant à faire

Aucun essai iPhone, Android ou tablette physique réalisé dans ce lot. Restent à
mesurer la cadence, l’énergie, la vraie mise en arrière-plan, le toucher et
VoiceOver/TalkBack sur ces appareils ; écouter également les phonèmes sur casque
et haut-parleur. Les viewports et les moteurs desktop ne les remplacent pas.

Comparer la v2 à la fiche puis retravailler la continuité des yeux ouverts et la
silhouette si nécessaire. Ni l’identité artistique finale, ni une efficacité
pédagogique, ni une conformité globale ne sont déclarées par ces contrôles.
