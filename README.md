# EDUCA — Apprendre à lire avec Kaya 🐆

> Une méthode de lecture complète dans la poche : gratuite, hors-ligne, pensée pour les enfants
> dyslexiques et pour la classe. Aucun compte, aucune publicité, aucune donnée ne quitte l'appareil.

EDUCA apprend à lire en français aux enfants de 4 à 12 ans qui ne savent pas encore lire (y compris les
lecteurs plus âgés en difficulté), puis les accompagne **du CE1 à la 3e** (comprendre, orthographe,
grammaire, conjugaison, vocabulaire). **Tout est parlé** par Kaya, un bébé jaguar : un enfant peut jouer
sans lire un seul mot et sans clavier.

## Ce que fait EDUCA

- **Une vraie méthode, explicite et systématique** : le *son* des lettres (pas seulement leur nom), une
  correspondance graphème → phonème par étape, en **66 étapes** : voyelles et consonnes qu'on peut prolonger
  d'abord, `ou` et les lettres muettes tôt, consonnes brèves avant les sons nasaux, `b/d/p/q` éloignés puis
  contrastés, règles (`c`, `g`, `s`) après leur valeur de base.
- **Chaque leçon va de l'oreille à l'écrit** : écouter le son → le reconnaître → lire des syllabes →
  lire des mots → reconnaître un mot entendu → l'écrire avec des tuiles → lire une phrase.
  Tout mot à lire est **100 % décodable** avec ce qui a déjà été appris.
- **Une vraie voix humaine** pour les mots du jeu et pour chaque son, voyelles et consonnes (enregistrements
  libres de Lingua Libre) : des **sons purs** (« mmm », jamais « me »), que l'enseignant ou le parent peut aussi
  enregistrer lui-même.
- **Test de positionnement** dès 7 ans : un grand qui lit déjà ne refait pas tout le chemin.
- **Les niveaux des grands (CE1 → 3e)** : 4 niveaux, 40 modules et 4 contrôles (environ 730 questions) d'après
  les programmes officiels en vigueur. Un niveau s'ouvre par son contrôle (70 %) **ou** quand la force de
  lecture monte ; dès 10 ans, le contrôle d'un niveau est proposé d'abord ; révisions espacées.
- **L'Élo bienveillant**, comme aux échecs : chaque exercice est un adversaire ; la « force de lecture »
  de l'enfant monte quand il réussit et **ne baisse jamais**. Titres : Pion → Cavalier → Fou → Tour → Dame →
  Roi → Maître → Grand Maître. Aucun classement entre enfants.
- **Répétition espacée** : ce qui est fragile revient au bon moment.
- **Réglages pour les enfants dyslexiques, par enfant** : police Andika ou OpenDyslexic, espacement des
  lettres en 3 crans, lettres muettes grisées, coloration syllabique en option, fond doux, voix lente,
  sous-titres, moins d'animations, mode lecteur d'écran. Aucun chronomètre, erreurs corrigées tout de suite
  et sans reproche.
- **En classe** : plusieurs enfants sur une tablette (chacun touche *son* animal), étape de la classe,
  temps de jeu maximum par jour, mode silencieux, tableau de bord par enfant et vue de la classe
  (imprimable, exportable en tableur), [guide de l'enseignant](guide.html).
- **Motivation** : un seul gros bouton « Jouer », le chemin des 66 sons, des cartes à collectionner
  (méritées, jamais au hasard) révélées en 3D, diplômes de fin de niveau.
- **Hors-ligne et installable** : après la première visite, tout fonctionne sans internet ; s'installe
  comme une application sur tablette et téléphone.
- **Accessible** : vérifié écran par écran (WCAG 2.2 AA), jouable au clavier seul ou au contacteur.

## Jouer

Ouvrir la page publiée, puis « Ajouter à l'écran d'accueil » pour l'installer comme une application.
En local :

```bash
python3 -m http.server 8765    # puis http://localhost:8765
```

## Développer

Aucune dépendance à l'exécution (HTML, CSS, JavaScript en modules natifs). Outils de développement :

```bash
npm install                                        # outils de test (développement seulement)
npm test                                           # tests unitaires (Node)
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e   # parcours complets et accessibilité, dans un navigateur
npm run release                                    # régénère la liste hors-ligne (après chaque changement)
```

La CI lance tous les tests **avant** de publier, et ne publie que l'application.

## Principes

1. **Tout-audio** : chaque consigne est parlée (et sous-titrée) — le joueur ne sait pas lire.
2. **Jamais de clavier imposé** : tuiles, boutons, images.
3. **Phonétique française** : on apprend le son, on ne lit que du décodable.
4. **Cartes méritées** : un exploit réel donne sa carte, jamais au hasard.
5. **Bienveillance** : aucune sanction, aucun chrono, l'Élo ne baisse jamais, aucun classement.
6. **Adapté à tous** : réglages de confort par enfant, sans étiquette.
7. **Multisensoriel** : voir, entendre, tracer au doigt.
8. **Aucune donnée ne quitte l'appareil** : voir la [politique de confidentialité](confidentialite.html).

## Crédits et licences

- **Code** : licence MIT (voir `LICENSE`).
- **Polices** (SIL Open Font License 1.1, textes dans `fonts/licenses/`) : Andika (SIL International),
  Nunito, Orbitron, Rajdhani, OpenDyslexic (Abbie Gonzalez).
- **Voix humaine** : enregistrements de **Poslovitch** sur **Lingua Libre** (Wikimédia France), domaine
  public (CC0) — liste dans [`audio/ATTRIBUTIONS.md`](audio/ATTRIBUTIONS.md).
- **Images** : émojis du système de l'appareil.
- **Références pédagogiques** : Dehaene et al. (2012) ; « Pour enseigner la lecture et l'écriture au CP »
  (ministère de l'Éducation nationale, 2019) ; programmes de français des cycles 2, 3 et 4.
