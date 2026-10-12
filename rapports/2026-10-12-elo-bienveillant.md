# L'Élo bienveillant d'EDUCA — conception, réglages, garanties

Date : 2026-10-12 · Code : `js/core/elo.js`, `js/core/select.js`, `js/core/curriculum.js` (`difficultyOf`)
· Tests : `tests/unit/elo.test.mjs`, `tests/unit/session.test.mjs`.

## 1. L'idée, pour tout le monde

Aux échecs, chaque joueur a une force (son Élo). Gagner contre un adversaire fort fait beaucoup
progresser ; contre un adversaire faible, un peu. Dans EDUCA, **chaque exercice est un adversaire** : il a
sa propre difficulté (un son du début du chemin est « faible », une phrase avec « eau » est « forte »).

EDUCA tient **deux nombres** :

- **le niveau estimé** (θ, « thêta ») : honnête, il monte et descend. Il sert seulement à **choisir des
  exercices réussis environ 4 fois sur 5**. Seul l'adulte le voit (courbe en pointillés de l'espace des grands) ;
- **l'Élo affiché à l'enfant** : c'est son **record**, calculé avec prudence. **Il ne baisse jamais.** Un
  jour difficile ne le fait pas reculer, un coup de chance au début ne le gonfle pas, et la pratique
  régulière le fait grimper.

L'enfant voit une pièce d'échecs, un nombre et une barre vers la pièce suivante :
**Pion (0) → Cavalier (600) → Fou (800) → Tour (1000) → Dame (1200) → Roi (1400)**. Chaque nouvelle pièce
déclenche une cérémonie de « promotion » (comme le pion qui traverse l'échiquier) et une carte de titre.
Il n'y a **aucun classement entre enfants** : on se compare à soi-même.

Ce que dit Kaya : « Ta force de lecture : 640. Encore 160 points pour devenir Fou ! » — jamais « tu as perdu ».

## 2. Le modèle

Probabilité de réussir un exercice de difficulté *d* pour un niveau θ, avec la chance de deviner *g*
(1/nombre de réponses proposées) :

```
P = g + (1 − g) · σ(θ − d)        σ(x) = 1 / (1 + e^−x)
```

Mise à jour après une réponse *y* (1 = juste, 0 = faux ou « avec aide » partiellement), approximation
bayésienne de type Glicko en échelle logit (variance *v* = incertitude) :

```
v⁻ = min(vMax, v + q)                         l'enfant APPREND : l'incertitude ne s'effondre jamais
p' = (1 − g) · s · (1 − s)                    s = σ(θ − d)
I  = w · p'² / (P (1 − P))                    information apportée par la réponse
v⁺ = 1 / (1/v⁻ + I)
θ⁺ = θ + w · v⁺ · p' · (y − P) / (P (1 − P))
```

- *w* = 1, ou 0,5 si l'enfant a demandé l'aide (« je ne sais pas » = une demi-information, sans drame).
- Absence : à chaque séance, `v += 0,015 × jours d'absence` (plafonné) — l'estimation redevient prudente
  après les vacances ; l'affichage, lui, ne bouge pas.
- **Affichage** : `record = max(record, arrondi(1000 + 174 · (θ − σ)))`, avec σ = √v, mis à jour en fin de
  séance seulement. 174 ≈ 400/ln 10, la convention des échecs.

Paramètres actuels : départ θ = −3,0 (4-6 ans), −2,2 (7-9), −1,4 (10-12) ; v₀ = 1 ; q = 0,004 ;
dérive 0,015/jour. Difficulté a priori des exercices : `d = −3,4 + 0,1 × étape + écart(type)` avec écoute
−0,5 · son→lettre 0 · syllabe +0,3 · mot entendu +0,4 · lire un mot +0,6 (+0,15 par syllabe en plus) ·
écrire un mot +0,9 · phrase +1,3.

## 3. Choisir les exercices

`js/core/select.js` donne à chaque exercice candidat un poids qui combine :
1. la **proximité de la cible de 80 %** de réussite estimée ;
2. la **mémoire** (répétition espacée) : jamais vu = intéressant, « dû » = prioritaire, pas encore dû = peut attendre ;
3. la **variété** : ce qui vient d'être vu attend son tour.
Puis un tirage pondéré (jamais deux séances identiques). Les leçons gardent leur ordre pédagogique
(oreille → écrit) ; la sélection s'applique à l'intérieur de chaque bloc et pour les révisions.

Pourquoi 80 % : assez de réussite pour rester motivé et entrer dans la tâche, assez de défi pour
apprendre. Dans Math Garden (Pays-Bas), le niveau « facile » a conduit les enfants à pratiquer davantage
(Jansen et al., 2013) ; pour un public jeune et/ou dyslexique, nous nous plaçons du côté facile.

## 4. Garanties vérifiées par les tests

- l'Élo affiché ne baisse **jamais**, même après une séance ratée ;
- huit réponses chanceuses d'affilée au départ (QCM à 3 choix) ne gonflent pas l'affichage ;
- une absence de 3 semaines élargit l'incertitude sans toucher à l'affichage ;
- simulation d'un enfant qui progresse (+0,1 logit/séance, 30 réponses/séance, 40 séances) :
  affichage monotone, estimation à moins de 0,6 logit de la vérité, affichage jamais au-dessus de la
  vérité (+60 points de marge), au moins « Fou » à la fin ;
- une réponse ne modifie jamais l'état reçu (fonctions pures, immuables).

## 5. Limites et suites

- Les difficultés a priori sont un réglage initial : à recaler avec des données réelles (anonymes, avec
  accord) ou un test pilote en classe.
- Un seul θ global ; un θ par domaine (écoute, décodage, écriture) pourrait affiner les choix.
- Rythme des titres : en moyenne un titre toutes les 10 à 13 étapes ; les étoiles, cartes et le chemin
  donnent des récompenses plus fréquentes. À ajuster après observation.

## Sources

- A. Elo (1978), *The Rating of Chessplayers, Past and Present*.
- S. Klinkenberg, M. Straatemeier, H. van der Maas (2011), « Computer adaptive practice of Maths ability
  using a new item response model for on the fly ability and difficulty estimation », *Computers &
  Education* 57(2), 1813-1824 (Math Garden).
- R. Pelánek (2016), « Applications of the Elo rating system in adaptive educational systems »,
  *Computers & Education* 98, 169-179.
- B. Jansen et al. (2013), « The influence of experiencing success in math on math anxiety, perceived math
  competence, and math performance », *Learning and Individual Differences* 24, 190-197.
- M. Glickman (1999), « Parameter estimation in large dynamic paired comparison experiments », *Applied
  Statistics* 48(3), 377-394 (Glicko).
- R. Herbrich, T. Minka, T. Graepel (2007), « TrueSkill: a Bayesian skill rating system », NIPS
  (affichage prudent μ − kσ).

*Note : la recherche documentaire automatique sur l'Élo a été interrompue par une limite d'usage ;
ces références sont citées de mémoire et doivent être relues avant toute communication publique.*
