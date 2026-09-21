# Cadrage — Accessibilité dyslexie & handicap (EDUCA v10)

**Objectif :** transformer EDUCA d'un « jeu d'alphabétisation avec choix d'âge décoratif » en un outil réellement adapté aux enfants dyslexiques et en situation de handicap, fondé sur les pratiques validées par la recherche pédagogique.

**Sources mobilisées (2026-09-21) :**
- college-errobi.fr — méthodes multisensorielles (vue + ouïe + toucher + mouvement ; lettres en relief, gestuelle phonétique, manipulation de syllabes ; collaboration famille-école)
- applicakids.com — comparatif apps dyslexie 2026 : **espacement accru des lettres/mots** réduit significativement les erreurs ; **polices adaptées** (OpenDyslexic) différencient b/d, p/q, n/u ; **fond teinté** (crème/bleu clair) plutôt que contraste agressif ; **surlignage du mot synchronisé** avec la synthèse vocale ; contrôle de la vitesse de lecture

Constat partagé par les deux sources : la dyslexie touche ~10 % des élèves ; ces enfants ne lisent pas moins bien, ils lisent différemment — la présentation visuelle du texte est autant un levier que le contenu.

**Ce qu'EDUCA possède déjà et qui colle au besoin :** tout-audio sans clavier, indices image, détection des confusions b/d p/q i/j m/n, voix de qualité triée, aucun élément punitif.

---

## Proposition : 2 chantiers complémentaires

### Chantier A — « Réglages confort » (impact immédiat, transverse)

Un panneau accessible depuis Stats, mémoire persistante, activable indépendamment de l'âge :

1. **Police adaptée** : option OpenDyslexic (hébergée en local, licence SIL/OFL compatible) — les b/d, p/q, n/u deviennent visuellement distincts. *C'est la demande n°1 de la littérature.*
2. **Espacement renforcé** : lettres et mots plus espacés (`letter-spacing`, `word-spacing`) — mesurable sur le taux d'erreur selon les études.
3. **Fond doux** : variante crème/bleu clair en plus des univers (moins de fatigue visuelle que le fond nuit actuel en plein texte).
4. **Vitesse de voix réglable** : lent / normal (les voix système à 0.9 fixe aujourd'hui).
5. **Chrono désactivable** : le chrono est un facteur de stress documenté ; il devient une option, jamais une obligation.

### Chantier B — Contenu adaptatif (le vrai changement pédagogique)

L'âge fixe le point de départ, mais **la progression observée pilote** (un enfant de 10 ans dyslexique peut commencer au palier 1 — et un enfant de 6 ans rapide peut monter) :

- **Palier 1 — Découverte** : lettres majuscules, 2 options, pas de chrono, mot-image systématique, voix lente.
- **Palier 2 — Déchiffreur** : maj/min, 3 options, syllabes simples (ba, be, bi…), Constructeur mots 2-4 lettres.
- **Palier 3 — Lecteur** : 4 options, syllabes complexes (ou, on, an, ch), mots fréquents, lecture fluide, chrono optionnel.

La réussite (≥80 % sur 2 sessions) **propose** le palier suivant à voix haute — jamais imposé, jamais sanctionné. Le profil affiche « Tu es sur le chemin Découverte » plutôt qu'un numéro.

### Bonus multisensoriel (phase 2, à valider)
- Tracer la lettre au doigt à l'écran en entendant son son (canvas + Voice) — l'équivalent numérique de la lettre en relief.
- Couleur constante associée à chaque lettre tout au long du jeu (déjà en partie vrai via les cartes — à généraliser).

## Non-inclus volontairement
- Pas de diagnostic ni catégorisation de l'enfant (« profil dys ») : l'outil s'adapte sans étiquette, les réglages confort suffisent.
- Pas de restructuration du mode classe (noté séparément).

## Risques
- OpenDyslexic alourdit le PWA (~200 Ko si on embarque 2 graisses) — acceptable, une seule fois en cache.
- La voix système ne surligne pas les mots pendant la lecture (Web Speech API ne le permet pas côté web) — le surlignage synchrone mot à mot restera une approximation (mise en avant du mot entier affiché pendant qu'on parle).

## Étapes
1. Chantier A (réglages confort) — 1 session.
2. Chantier B palier 1→3 (contenu adaptatif) — 1 session par palier.
3. Bonus multisensoriel — après test utilisateur réel.
