# EDUCA — Apprendre en jouant 🐆

> Une école complète dans la poche — gratuite,  pour chaque enfant du monde.

EDUCA est un jeu d'alphabétisation pour les enfants qui ne savent pas encore lire.
Tout est **parlé à voix haute** et **illustré** : un enfant peut jouer sans lire un seul mot.

## 📁 Structure du projet

```
edugame/
├── index.html        ← LE JEU (la seule page à ouvrir / déployer)
├── manifest.json     ← installation sur téléphone (PWA)
├── sw.js             ← mode hors-ligne (service worker)
├── fonts/            ← polices OpenDyslexic (réglage confort, licence SIL/OFL)
├── css/
│   ├── base.css      ← styles de base, boutons, thèmes d'univers
│   ├── a11y.css      ← réglages confort (police dys, espacement, fond doux) + trace
│   ├── educa.css     ← accueil, hub, Kaya, cartes 3D, collection
│   └── game.css      ← mini-jeux (Lettres, Constructeur)
├── js/
│   ├── audio.js      ← la voix de Kaya + effets sonores
│   ├── comfort.js    ← réglages confort (dyslexie & handicap), persistants
│   ├── kaya.js       ← le dessin de Kaya (bébé jaguar SVG)
│   ├── card3d.js     ← effet 3D holographique des cartes
│   ├── cards.js      ← les 36 cartes à collectionner
│   ├── educa.js      ← profil, paliers (Découverte/Déchiffreur/Lecteur), hub
│   ├── letters.js    ← mini-jeu « Les Lettres »
│   ├── builder.js    ← mini-jeu « Le Constructeur »
│   └── trace.js      ← mini-jeu « Écris la lettre » (tracer au doigt, multisensoriel)
├── icons/            ← icônes de l'application
└── archive/          ← anciennes versions (NON utilisées par le jeu)
```

## 🚀 Tester en local

```bash
python3 -m http.server 8765
# puis ouvrir http://localhost:8765
```

## ⚠️ Règle d'or à chaque mise à jour

Avant de publier des changements, **augmenter le numéro de version dans `sw.js`** :

```js
const CACHE_NAME = 'educa-v11';   // → passer à v12, v13…
```

Sinon les téléphones gardent l'ancienne version en cache.

## 🧠 Principes du projet

1. **Tout-audio** : chaque texte a un équivalent parlé (`Voice.speak`) — le public ne sait pas lire.
2. **Jamais de clavier imposé** : tuiles-lettres, boutons, images.
3. **Phonétique française** : chaque mot d'association COMMENCE par sa lettre (« H comme Hibou »).
4. **Cartes méritées** : un exploit réel donne sa carte (jamais au hasard).
6. **Adapté à tous** : réglages confort persistants (police adaptée, espacement, fond doux, voix lente, pas de chrono) pensés avec les pratiques validées pour la dyslexie.
7. **Trois chemins de lecture** : Découverte (4-6 ans), Déchiffreur (7-9), Lecteur (10-12) — l'âge fixe le point de départ, la réussite propose la montée de palier (jamais imposée).
8. **Multisensoriel** : voir, entendre, et écrire au doigt — l'équivalent numérique de la lettre en relief.
