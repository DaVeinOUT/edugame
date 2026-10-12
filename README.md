# EDUCA — Apprendre à lire avec Kaya 🐆

> Une méthode de lecture complète dans la poche : gratuite, hors-ligne, pensée pour les enfants
> dyslexiques et pour la classe. Aucun compte, aucune publicité, aucune donnée ne quitte l'appareil.

EDUCA apprend à lire en français aux enfants de 4 à 12 ans qui ne savent pas encore lire (y compris les
lecteurs plus âgés en difficulté). **Tout est parlé** par Kaya, un bébé jaguar : un enfant peut jouer sans
lire un seul mot et sans clavier.

## Ce que fait EDUCA

- **Une vraie méthode, explicite et systématique** : le *son* des lettres (pas seulement leur nom), une
  correspondance graphème→phonème par étape, en **66 étapes** ordonnées d'après les sources (Dehaene et
  al. 2012, Kalulu 2025, Goigoux 2016) : voyelles et consonnes qu'on peut prolonger d'abord, `ou` et les
  lettres muettes tôt, consonnes brèves avant les sons nasaux, `b/d/p/q` éloignés puis contrastés,
  règles (`c`, `g`, `s`) après leur valeur de base. Détail : [`rapports/2026-10-12-pedagogie-sources.md`](rapports/2026-10-12-pedagogie-sources.md).
- **Chaque leçon va de l'oreille à l'écrit** : écouter le son → le reconnaître → lire des syllabes →
  lire des mots → reconnaître un mot entendu → l'écrire avec des tuiles-graphèmes → lire une phrase.
  Tout mot à lire est **100 % décodable** avec ce qui a déjà été appris (calculé, testé).
- **Des sons purs** (« mmm », jamais « me ») : synthétisés pour les consonnes, ou — mieux — **enregistrés
  par l'enseignant ou le parent** au micro, dans l'espace des grands.
- **Répétition espacée** (boîtes de Leitner) : ce qui est fragile revient au bon moment.
- **L'Élo bienveillant**, comme aux échecs : chaque exercice est un adversaire ; la « force de lecture »
  de l'enfant monte quand il réussit et **ne baisse jamais** (on affiche son record, calculé avec
  prudence). Titres : Pion → Cavalier → Fou → Tour → Dame → Roi. Aucun classement entre enfants.
  Détail : [`rapports/2026-10-12-elo-bienveillant.md`](rapports/2026-10-12-elo-bienveillant.md).
- **Réglages pour les enfants dyslexiques, par enfant** : police Andika (conçue pour les lecteurs
  débutants) ou OpenDyslexic, espacement des lettres en 3 crans, lettres muettes grisées, coloration
  syllabique en option, fond doux, voix lente, sous-titres, moins d'animations, mode lecteur d'écran.
  Aucun chronomètre, erreurs corrigées tout de suite et sans reproche.
- **En classe** : plusieurs enfants sur une tablette (chacun touche *son* animal), étape de la classe
  imposée par l'enseignant, temps de jeu maximum par jour, mode silencieux, tableau de bord par enfant
  (force de lecture honnête et sa courbe, sons maîtrisés, confusions b/d…, temps de jeu, idées
  d'activités hors écran, impression), export/import de sauvegarde.
- **Motivation** : un seul gros bouton « Jouer », le chemin des 66 sons, 77 cartes à collectionner
  (méritées, jamais au hasard) révélées en 3D, cérémonie de promotion d'échecs, étoiles d'effort.
- **Hors-ligne d'abord** : après la première visite, tout fonctionne sans internet ; mise à jour proposée
  depuis l'accueil, jamais au milieu d'une leçon.

## Jouer

Ouvrir la page publiée (GitHub Pages), puis « Ajouter à l'écran d'accueil » pour l'installer comme une
application. En local :

```bash
python3 -m http.server 8765    # puis http://localhost:8765
```

## Développer

Aucune dépendance à l'exécution (HTML, CSS, JavaScript en modules natifs). Outils de développement :

```bash
npm install                     # playwright-core (tests navigateur) — développement seulement
npm test                        # tests unitaires : moteur, parcours, Élo, séances (Node, sans navigateur)
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e   # bout en bout : profil, leçon, espace adulte, sons, hors-ligne
npm run release                 # régénère la liste hors-ligne de sw.js (à lancer après chaque changement)
```

La CI (`.github/workflows/pages.yml`) lance tous les tests **avant** de publier, et ne publie que
l'application (pas `archive/`, `rapports/`, `ops/`, `tests/`).

```
index.html            page unique (CSP stricte, aucun script en ligne)
sw.js                 hors-ligne (liste générée par scripts/release.mjs)
css/                  app.css (thèmes, confort dys, écrans), cards.css (cartes 3D), fonts.css (généré)
js/main.js            démarrage
js/core/              logique pure, testée : seg (graphèmes/syllabes), curriculum, elo, srs, select,
                      questions, session, schema, rng
js/data/              curriculum.js (66 étapes, ~230 mots illustrés, mots-outils, phrases), sounds.js
js/services/          store (sauvegarde locale), voice (Kaya, sous-titres), phonemes (sons purs),
                      recordings (voix de l'adulte), sfx, errors (filet de sécurité)
js/ui/                router, dom, kaya, word (coloration), cards, elo, overlay, fx, theme, caption
js/screens/           welcome, profiles, hub, path, lesson, collection, ladder, games, trace, adult
js/activities/        choice (écoute, son, syllabe, mot, phrase), build (écrire), intro, trace
tests/unit/, tests/e2e/   tests node:test (+ Playwright pour le navigateur)
rapports/             recherches et décisions ; ops/ : suivi du chantier (HANDOFF, backlog, journal)
```

## Principes (les lois du projet)

1. **Tout-audio** : chaque consigne est parlée (et sous-titrée) — le joueur ne sait pas lire.
2. **Jamais de clavier imposé** : tuiles, boutons, images.
3. **Phonétique française** : on apprend le son, on ne lit que du décodable.
4. **Cartes méritées** : un exploit réel donne sa carte, jamais au hasard.
5. **Bienveillance** : aucune sanction, aucun chrono, l'Élo ne baisse jamais, aucun classement.
6. **Adapté à tous** : réglages de confort par enfant, sans étiquette.
7. **Multisensoriel** : voir, entendre, tracer au doigt.
8. **Aucune donnée ne quitte l'appareil** : voir [`CONFIDENTIALITE.md`](CONFIDENTIALITE.md).

## Crédits et licences

- **Code d'EDUCA** : licence MIT (voir `LICENSE`) — *choix provisoire, en attente de validation par Dave.*
- **Polices** (SIL Open Font License 1.1, textes dans `fonts/licenses/` et `fonts/LICENSE.txt`) :
  Andika (SIL International), Nunito, Orbitron, Rajdhani, OpenDyslexic (Abbie Gonzalez).
- **Images** : émojis du système de l'appareil (aucune image téléchargée).
- **Sources pédagogiques** : listées dans les rapports du dossier `rapports/`.
