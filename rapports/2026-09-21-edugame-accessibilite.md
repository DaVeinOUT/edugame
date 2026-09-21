# Livraison — Accessibilité dyslexie & handicap (EDUCA v11)

**2026-09-21 · Chantier demandé en carte blanche, livré en local — rien n'a été poussé.**

> Suite du cadrage `rapports/2026-09-21-edugame-cadrage-accessibilite.md`. Trois chantiers + deux idées ajoutées en cours de route.

## Chantier A — Réglages confort (panneau dans Stats, section « ⚙️ Confort de lecture »)

5 réglages indépendants, persistants (`educaComfort` dans localStorage), chacun parlé à voix haute quand on le change :

| Réglage | Effet | Pourquoi (source) |
|---|---|---|
| **Lettres spéciales** | police OpenDyslexic partout | les formes de b/d, p/q, n/u deviennent distinctes — demande n°1 de la littérature dys |
| **Lettres espacées** | `letter-spacing`/`word-spacing`/`line-height` renforcés | réduit mesurablement les erreurs de lecture |
| **Fond doux** | fond crème `#FDF6E3` + texte sombre | moins de fatigue visuelle que le contraste nuit |
| **Voix lente** | vitesse 0.75 au lieu de 0.9 | laisse le temps de traiter |
| **Pas de chrono** | le minuteur disparaît de tous les niveaux | le chrono est un facteur de stress documenté |

Polices WOFF hébergées **en local** (`fonts/`, 16 Ko chacune, licence SIL/OFL — attribution dans `fonts/LICENSE.txt`). Zéro appel réseau. Le fond doux re-thème l'ensemble des écrans (boutons, cartes, hub, stats).

## Chantier B — 3 paliers adaptatifs

L'âge n'est plus décoratif, mais il ne bloque plus non plus :

- **Palier 1 · Découverte** : majuscules, 2 options, pas de chrono, mot-image systématique (base 4-6 ans)
- **Palier 2 · Déchiffreur** : maj/min mélangées, 3 options (base 7-9 ans)
- **Palier 3 · Lecteur** : 4 options, chrono possible (base 10-12 ans)

**Mécanique :** l'âge fixe le point de départ ; ensuite, 2 sessions consécutives à ≥80 % sur un palier → Kaya *propose à voix haute* de passer au suivant, avec un bouton « 🚀 Passer au palier suivant » sur l'écran de résultats. Jamais imposé, jamais sanctionné, réversible. Le palier s'affiche dans le hub (`Commun · 24 XP · Déchiffreur`) et l'étoile « ⭐ Pour toi » de l'écran des niveaux suit le palier, plus seulement l'âge.

Le jeu Lettres fusionne maintenant deux axes : le **palier** fixe la difficulté de fond (options, casse, chrono), la **carte choisie** (Explorateur/Aventurier/Expert/Maître) règle le mode visuel/audio et l'ordre alphabétique.

Le Constructeur pioche ses mots par palier : mots 2-4 lettres (palier 1), mots courants 4-5 lettres dont école/ballon/livre (palier 2), mots longs à syllabes complexes dont arc-en-ciel et bibliothèque (palier 3).

## Chantier C — Bonus multisensoriel : « Écris la lettre »

Nouveau troisième mini-jeu (carte ✍️ dans le hub) : l'enfant **trace la lettre au doigt** sur un fantôme géant tout en entendant son nom et son mot (« A ! Comme Avion »). C'est l'équivalent numérique de la lettre en relief — vue + ouïe + toucher + mouvement, le cœur des méthodes multisensorielles validées pour la dyslexie.

- Zéro jugement : ce n'est pas un test, chaque coup de doigt change la couleur du trait (arc-en-ciel), bouton « 🧽 Effacer » pour recommencer.
- 10 lettres par session, piochées selon le palier (majuscules au palier 1, maj+min ensuite).
- Le fantôme utilise lui-même la police OpenDyslexic si le réglage est actif.
- Fin de session : toutes les étoiles, pas de chrono, pas de score — le geste est la récompense.

## Idées ajoutées en cours de route

1. **Surlignage du mot pendant la voix** : l'indice-image (Lettres) et le mot affiché (Constructeur) s'illuminent en doré exactement pendant que Kaya les prononce — approximation du « surlignage synchrone » recommandé par le comparatif d'apps (l'API Web Speech ne permet pas le mot-à-mot, c'est documenté dans le cadrage).
2. **`_halt()` généralisé** : le traceur aussi est proprement interrompu par le bouton retour du téléphone.

## Vérifications

- `node --check` OK sur les 10 fichiers JS + sw.js.
- Cohérence HTML/JS vérifiée par script (tous les nouveaux IDs présents et câblés).
- sw.js passé à **v11** avec les 3 nouveaux fichiers (a11y.css, comfort.js, trace.js) et les 2 polices dans le cache hors-ligne.
- README mis à jour (structure + principes 6-8 + règle de bump).
- Relecture QA par sous-agent indépendant : verdict en fin de fichier.

## Non fait (volontairement)

- **Aucun push** — tu testes d'abord.
- Pas de « profil dys » : l'outil s'adapte sans étiqueter l'enfant.
- Mode classe coopératif : noté séparément en mémoire, ce chantier ne s'y substitue pas.

## À tester sur un vrai appareil

- Le panneau confort : activer chaque réglage, vérifier que ça tient après fermeture de l'app.
- Le traceur au doigt sur téléphone (le pointer-events est pensé pour le tactile ; le `touch-action:none` du canvas empêche le scroll pendant le tracé).
- Monter de palier : faire 2 bonnes sessions Lettres et écouter la proposition de Kaya.
