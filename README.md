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
├── css/
│   ├── base.css      ← styles de base, boutons, thèmes d'univers
│   ├── educa.css     ← accueil, hub, Kaya, cartes 3D, collection
│   └── game.css      ← mini-jeux (Lettres, Constructeur)
├── js/
│   ├── audio.js      ← la voix de Kaya + effets sonores
│   ├── kaya.js       ← le dessin de Kaya (bébé jaguar SVG)
│   ├── card3d.js     ← effet 3D holographique des cartes
│   ├── cards.js      ← les 36 cartes à collectionner
│   ├── educa.js      ← profil, navigation, hub, révélation de carte
│   ├── letters.js    ← mini-jeu « Les Lettres »
│   └── builder.js    ← mini-jeu « Le Constructeur »
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
const CACHE_NAME = 'educa-v7';   // → passer à v8, v9…
```

Sinon les téléphones gardent l'ancienne version en cache.

## 🧠 Principes du projet

1. **Tout-audio** : chaque texte a un équivalent parlé (`Voice.speak`) — le public ne sait pas lire.
2. **Jamais de clavier imposé** : tuiles-lettres, boutons, images.
3. **Phonétique française** : chaque mot d'association COMMENCE par sa lettre (« H comme Hibou »).
4. **Cartes méritées** : un exploit réel donne sa carte (jamais au hasard).
5. **Léger et hors-ligne** : zéro librairie externe, pensé pour les petits téléphones et les zones sans connexion.
