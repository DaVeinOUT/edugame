# Site assemblé et compatibilité — 26 octobre 2026

Le site assemblé a passé le parcours dans les deux moteurs locaux, sans erreur
JavaScript ni erreur de console. Aucun fichier du runtime n’a été modifié pour
ces vérifications.

| Moteur mesuré | Pilote WebGL mesuré | Résultat |
| --- | --- | --- |
| Brave / Chromium 155.0.8059.40 | ANGLE, Vulkan, SwiftShader Device | Réussi |
| WebKit desktop headless 27.2 | Apple GPU | Réussi |

Le profil de contrôle est fictif, isolé dans chaque contexte navigateur. Le
viewport est 390 × 844 ; ce n’est pas une émulation matérielle d’iPhone. Le mode
lecteur d’écran du profil est déclaré pour éviter une double voix pendant le
parcours ; aucun lecteur d’écran manuel n’a été évalué ici.

## Identité du modèle réellement reçu

Modèle servi : `assets/kaya/kaya-production-v2.glb`, **2 013 720 octets**.
SHA-256 figé et vérifié :

```text
042dc1f4ed484c0f3fc9b565b2004903f6d4cd8bce011e967bfd0e9d79b4aa0c
```

Chaque moteur a reçu cinq réponses GLB pendant le parcours. Leurs corps ont été
lus et hachés, et correspondent tous à ce SHA, y compris la réponse du renderer
après rechargement sans réseau. La vérification ne se limite pas au chemin du
modèle ou à un attribut HTML. [Métadonnées complètes](proof.json).

## Parcours exécuté sur le site assemblé

1. Accueil avec GLB v2, maillage rendu et fragment WebGL non transparent.
2. Navigation vers une leçon, présence compacte au-dessus de l’exercice, sans
   recouvrement, puis une réponse réellement sauvegardée.
3. Retour à l’accueil, attente du service worker et vérification de son cache
   complet par le diagnostic de l’application.
4. Coupure réseau et rechargement : accueil GLB v2 rendu, SHA des octets reçus
   identique à l’asset figé.
5. Consultation, décodage et retournement des grandes cartes `son-m` et `r_first`.
6. Décodage sans réseau des **35 fichiers MP3** du manifeste, et requête Range
   sur `s.mp3` répondant **206**, avec les deux octets demandés.

Le relevé de pixel provoque explicitement une pose `attentive` pour redessiner
le canvas avant sa lecture, sans conserver un framebuffer coûteux. C’est un
déclenchement technique de vérification ; il n’est pas présenté comme une
réaction naturelle ou une réponse évaluée.

## Assemblage et cache

Le harnais assemble une fois le site dans un dossier temporaire neuf, partagé
par les deux moteurs. Les octets de tous les assets requis sont comparés aux
sources avant le parcours. L’identité du modèle et le contrôle release sont
revérifiés ensuite pour détecter un asset déplacé pendant le test.

- GLB v2, **quatre images de cartes** et **35 MP3** inclus et hachés.
- `docs/`, `.agents/`, `.codex/`, `scripts/`, `tests/` absents du site.
- Aucune source `.blend` ni sauvegarde GLB v1 dans le site ; seul le GLB v2 y est servi.
- **416 fichiers assemblés**, licences et notes servies comprises.
- Cache **educa-20de197a2b**, **405 fichiers** listés, à jour avant et après.

Journaux : [assemblage](build.log), [release avant](release-before.log),
[release après](release-after.log).

## Reproduction

```sh
EDUCA_EXPECTED_KAYA_SHA256=042dc1f4ed484c0f3fc9b565b2004903f6d4cd8bce011e967bfd0e9d79b4aa0c \
CHROMIUM_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' \
node scripts/kaya/check-built-runtime.mjs
```

Le harnais n’installe aucun navigateur. Un exécutable manquant est consigné
comme indisponible et ne devient pas un résultat réussi. Le fichier `proof.json`
contient les versions, pilotes, cadres de rendu, octets, hashes et résultats.

## Captures du parcours réel

- Chromium : [accueil](chromium-hub.png), [leçon](chromium-lesson.png),
  [carte sans réseau](chromium-offline-card.png).
- WebKit : [accueil](webkit-hub.png), [leçon](webkit-lesson.png),
  [carte sans réseau](webkit-offline-card.png).

## Limites

Ces moteurs desktop ne prouvent ni une cadence ni une consommation sur téléphone
ou tablette physiques. Le décodage des MP3 ne prouve pas leur perception ou leur
qualité pédagogique. Aucune validation artistique finale, écoute humaine,
évaluation professionnelle ou conformité complète n’est annoncée par ce contrôle.
