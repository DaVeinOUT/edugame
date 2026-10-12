# BRIEF OPENCLAW — Chantier EDUCA (github.com/DaVeinOUT/edugame)

> Ce fichier est **l'instruction principale donnée à OpenClaw**. Il se pose à la racine du repo.
> OpenClaw ne fait rien d'autre que ce qui est écrit ici. Il travaille **tâche par tâche**,
> il **délègue** à des sous-agents Claude, et il **reprend tout seul** quand les tokens reviennent.
>
> Audit du code réalisé le 2026-09-21 sur le dépôt public (commit `aafdceb`, 4 125 lignes JS/CSS + `index.html`).
> Les rapports déjà présents dans `rapports/` ont été lus : **rien de ce qui est déjà fait n'est re-demandé ici.**

---

## 0. RÈGLES DE TRAVAIL (non négociables)

1. **Une tâche = une session = une branche = un commit.** Jamais deux tâches dans la même session.
2. **Jamais de push sur `main`.** Branche `openclaw/<id-tâche>`, puis Pull Request. Dave valide.
3. **Le contexte vit dans le repo, pas dans la session.** À la fin de chaque tâche, mettre à jour
   `ops/HANDOFF.md` (10 lignes max) et `ops/BACKLOG.jsonl`. Si la session est coupée en plein milieu
   par une limite de tokens, le seul état qui compte est ce qui est écrit sur le disque.
4. **Économie de tokens = déléguer.** Le coordinateur ne lit pas les fichiers lui-même : il appelle
   un sous-agent (contexte isolé, il ne remonte qu'un résumé). Tout ce qui est mécanique va sur `haiku`.
5. **Aucune régression pédagogique.** Les 8 principes du `README.md` sont des lois :
   tout-audio, jamais de clavier imposé, phonétique française, cartes méritées, adapté à tous,
   3 paliers, multisensoriel. Une tâche qui les casse est annulée, pas négociée.
6. **Aucune donnée d'enfant ne sort de l'appareil.** Pas de serveur, pas d'analytics, pas de CDN.
7. **Définition de « terminé »** pour chaque tâche : le champ `done_when` du backlog est vérifié
   par l'agent `educa-qa` **avant** de marquer la tâche `done`. En cas de doute : `blocked`, pas `done`.
8. **Le bump de `CACHE_NAME` dans `sw.js`** est obligatoire dès qu'un fichier de l'app change
   (tant que la tâche T03 n'est pas faite, c'est manuel).

---

## 1. AUDIT — CE QU'IL FAUT AMÉLIORER, POINT PAR POINT

Code lu : `index.html`, `sw.js`, `manifest.json`, `js/*.js` (9 fichiers), `css/*.css` (4 fichiers),
`.github/workflows/pages.yml`, `rapports/*.md`.

**Ce qui est déjà bon et ne doit pas être touché :** stale-while-revalidate du service worker,
Fisher-Yates + `crypto.getRandomValues`, délégation d'événements, cibles 44 px, détection des
confusions b/d p/q i/j m/n, réglages confort dys persistants, 3 paliers adaptatifs, traceur au doigt,
export/import de progression, mode silencieux, zéro dépendance JS.

### 🔴 Bloquant (contradictions avec la promesse du projet)

| # | Problème constaté | Preuve dans le code |
|---|---|---|
| **A1** | Le projet revendique « zéro dépendance externe / hors-ligne d'abord », mais `index.html` charge **Nunito, Orbitron et Rajdhani depuis Google Fonts**. Premier lancement sans réseau = polices absentes ; et chaque ouverture envoie l'IP de l'enfant à Google (problème RGPD pour un usage scolaire). | `index.html` l.15-17 : `preconnect` + `<link href="https://fonts.googleapis.com/css2?family=Nunito...">` ; `sw.js` garde un `FONT_CACHE` pour ce domaine |
| **A2** | **Licence absente.** Aucun `LICENSE` à la racine, et `fonts/LICENSE.txt` — annoncé dans le rapport accessibilité — **n'existe pas** : `fonts/` ne contient que les deux `.woff`. OpenDyslexic est sous **SIL OFL 1.1**, qui impose de distribuer la licence et l'avis de copyright avec la police. En l'état, la redistribution est en infraction. | `ls fonts/` → `OpenDyslexic-Bold.woff`, `OpenDyslexic-Regular.woff` |
| **A3** | La liste `ASSETS` du service worker est **écrite à la main** et le cache est versionné à la main (`educa-v12`). Un fichier ajouté et oublié = app cassée hors-ligne, sans aucun signal. | `sw.js` l.7-28 |
| **A4** | Le workflow Pages publie **tout le dépôt** (`path: '.'`), donc `archive/` (110 Ko de vieilles versions + 3 pages de design) et `rapports/` sont en ligne et indexables. | `.github/workflows/pages.yml`, `upload-pages-artifact` `path: '.'` |
| **A5** | `self.skipWaiting()` + `clients.claim()` à chaque install : une nouvelle version peut prendre le contrôle **pendant qu'un enfant joue**, avec du JS neuf et du HTML ancien déjà en mémoire. | `sw.js` l.32, 45 |

### 🟠 Robustesse (un téléphone d'enfant ne doit jamais se figer)

| # | Problème | Preuve |
|---|---|---|
| **B1** | **Aucun filet de sécurité JS** : pas de `window.onerror`, pas de `unhandledrejection`. Une exception = écran figé, muet, sur un jeu où l'enfant ne sait pas lire le message. | aucun `onerror` dans `js/` |
| **B2** | **Aucun plan B si le téléphone n'a pas de voix française** (Android d'entrée de gamme, WebView allégée). Le jeu est tout-audio : sans voix, il est inutilisable, et rien ne le dit. | `audio.js` : `init()` fait `return` si pas de `speechSynthesis`, `_voice` reste `null` |
| **B3** | `localStorage` est utilisé sans protection en écriture : en navigation privée iOS ou quota plein, `setItem` **lève une exception** et tue le flux en cours. Les lectures sont protégées (`try/catch`), pas les écritures. | `educa.js` l.18, `letters.js` l.499/505/524, `comfort.js` l.31 |
| **B4** | La clé `educaLetterStats` est **écrite depuis deux fichiers** avec deux formes différentes (`educa.js` l.494-500 et `letters.js` l.490-524). Risque réel d'écrasement mutuel et de stats corrompues. | idem |
| **B5** | L'export/import de progression n'a **pas de numéro de schéma** : un fichier d'une future version réimporté dans une ancienne écrase silencieusement. | `educa.js` l.455-476 |

### 🟡 Qualité de code / industrialisation

| # | Problème |
|---|---|
| **C1** | **Zéro test, zéro `package.json`, zéro lint.** La CI ne fait que déployer : rien n'empêche de publier une version cassée à un enfant. |
| **C2** | 9 `<script>` globaux, classes globales, ordre de chargement implicite : impossible à tester unitairement, fragile au moindre déplacement. Migration progressive vers des modules ES avec une couche `js/core/` de fonctions pures. |
| **C3** | **48 attributs `onclick=` inline** dans `index.html` : tant qu'ils sont là, aucune `Content-Security-Policy` sérieuse n'est possible (il faudrait `unsafe-inline`). |
| **C4** | **Poids des icônes** : `icon-512.png` = **225 Ko** pour une icône plate, `icon-192.png` = 27 Ko. Public cible = téléphones d'entrée de gamme sur réseau faible. |
| **C5** | Aucun budget de performance mesuré (pas de Lighthouse CI), alors que la cible est « zone à connexion rare ». |

### 🟢 Pédagogie — le vrai gisement de valeur

| # | Problème | Pourquoi ça compte |
|---|---|---|
| **D1** | **Le jeu enseigne le NOM des lettres, pas leur SON.** « B comme Ballon » apprend « bé ». Pour décoder un mot, l'enfant a besoin du phonème /b/. C'est la variable la mieux documentée de l'apprentissage de la lecture (conscience phonémique + phonics systématique). | `letters.js` `LETTER_ASSOC` |
| **D2** | **Rien entre la lettre et le mot** : le Constructeur attaque directement des mots entiers (2-4 lettres au palier 1). La marche manquante s'appelle **la syllabe** (BA, BE, BI, BO, BU) — la `cfg.syllables:true` existe déjà dans `educa.js` mais **n'est branchée nulle part**. | `educa.js` PALIERS, aucun usage de `syllables` dans `letters.js`/`builder.js` |
| **D3** | **Le tirage est aléatoire, pas adaptatif.** Les stats par lettre (`{ok, seen}`) et les confusions sont **déjà collectées** mais ne pilotent pas le choix de la prochaine lettre. Une répétition espacée (Leitner 5 boîtes) transformerait le jeu en vrai outil d'apprentissage pour ~150 lignes. | `letters.js` `fisherYates` sur l'alphabet complet |
| **D4** | **Plusieurs mots d'association enseignent une correspondance fausse** : `H comme Hibou` (H muet, on n'entend jamais /h/), `W comme Wagon` (se prononce /v/ en français), `X comme Xylophone` (/gz/), `Q comme Quille` (/k/), `I comme Île` (î + accent), `E comme Éléphant` (é, pas e). Pour un enfant en phase de décodage, c'est un contre-apprentissage. | `letters.js` l.10-24 |
| **D5** | **Espace parents trop pauvre** : une grille 26 lettres, sans évolution dans le temps ni « sur quoi on travaille en ce moment », ni passerelle vers une activité hors écran (tracer la lettre dans le sable) — alors que la collaboration famille/école est citée dans le propre cadrage du projet. | `educa.js` stats |
| **D6** | **Monolingue.** Le public visé (Guyane, Haïti, DOM-TOM) parle aussi créole, portugais, anglais. ~325 chaînes françaises sont codées en dur dans le JS. | `grep` sur `js/` |

### ♿ Accessibilité au-delà de la dyslexie

| # | Problème |
|---|---|
| **E1** | **Aucune navigation clavier / contacteur.** Les enfants en situation de handicap moteur utilisent un ou deux contacteurs qui simulent Tab/Espace : il faut un ordre de focus correct, un `:focus-visible` épais, et à terme un mode balayage (scan). |
| **E2** | **`prefers-reduced-motion` non géré** (particules, carte 3D holographique, animations) : troubles vestibulaires, et prudence photosensible (WCAG 2.3.1 : pas plus de 3 flashs/seconde). |
| **E3** | **Contrastes jamais mesurés** : `rgba(255,255,255,0.25)` sur les numéros de carte, doré sur fond sombre… il faut un audit automatisé (axe-core) et un passage au seuil AA (4.5:1 texte, 3:1 gros texte et éléments d'interface). |
| **E4** | **Conflit potentiel TTS interne / lecteur d'écran** : 27 attributs `aria-*`/`role` existent, mais `speechSynthesis` et VoiceOver se coupent mutuellement. Il faut choisir une stratégie explicite et la documenter. |
| **E5** | **Pas de politique de confidentialité** ni de bouton « effacer toutes mes données » visible, alors que l'argument « rien ne quitte l'appareil » est décisif pour une école. |

---

## 2. BACKLOG — L'ORDRE DE MARCHE

Le fichier machine est `ops/BACKLOG.jsonl` (une tâche par ligne, lue par le worker).
Voici la même chose en lisible, avec l'agent responsable et la taille estimée.

| id | Tâche | Points couverts | Agent | Taille |
|---|---|---|---|---|
| T01 | Héberger les polices en local (woff2 subsettées latin), supprimer Google Fonts, nettoyer `FONT_CACHE` | A1 | `educa-dev` | S |
| T02 | Ajouter `LICENSE` (projet) + `fonts/LICENSE.txt` (SIL OFL 1.1 + copyright) + section crédits README | A2 | `educa-scribe` | XS |
| T03 | Script de release : génère `ASSETS` depuis le disque + `CACHE_NAME` = hash du contenu | A3 | `educa-dev` | M |
| T04 | Ne publier que l'app sur Pages (exclure `archive/`, `rapports/`, `ops/`) | A4 | `educa-dev` | S |
| T05 | Mise à jour du SW sous contrôle : retirer `skipWaiting` auto, toast « Nouvelle version » | A5 | `educa-dev` | M |
| T06 | Filet de sécurité : `onerror` + `unhandledrejection` → phrase parlée + retour hub + log local | B1 | `educa-dev` | S |
| T07 | Plan B sans voix FR : détection, mode sous-titres géants, message au parent | B2 | `educa-dev` | M |
| T08 | `js/core/store.js` : point d'écriture unique, `try/catch`, `schemaVersion`, migration | B3 B4 B5 | `educa-dev` | M |
| T09 | Outillage : `package.json`, `node:test`, tests des fonctions pures, CI qui bloque le déploiement | C1 | `educa-dev` | M |
| T10 | Smoke test Playwright (boot, 3 clics, rechargement hors-ligne) + Lighthouse CI avec budget | C5 | `educa-qa` | M |
| T11 | Optimiser les icônes (SVG → PNG recompressés, < 30 Ko) | C4 | `educa-dev` | XS |
| T12 | Migrer les 48 `onclick` inline → délégation, puis ajouter une CSP stricte | C3 | `educa-dev` | L |
| T13 | Modules ES progressifs + `js/core/` testable | C2 | `educa-dev` | L |
| **T14** | **Sons des lettres (phonèmes) en plus des noms** | **D1** | `educa-pedagogue` → `educa-dev` | **L** |
| **T15** | **Mini-jeu Syllabes (brancher `cfg.syllables`)** | **D2** | `educa-pedagogue` → `educa-dev` | **L** |
| **T16** | **Répétition espacée (Leitner 5 boîtes) pilotant le tirage** | **D3** | `educa-dev` | **M** |
| T17 | Revoir les mots d'association piégeux + marquer les lettres rares/muettes | D4 | `educa-pedagogue` | S |
| T18 | Espace parents v2 : courbe dans le temps, « on travaille sur… », activité hors écran | D5 | `educa-dev` | M |
| T19 | Externaliser les libellés dans `lang/fr.json` (préparer ht / pt / en) | D6 | `educa-dev` | L |
| T20 | Navigation clavier + `:focus-visible` + ordre de focus | E1 | `educa-a11y` | M |
| T21 | `prefers-reduced-motion` + limite de flashs | E2 | `educa-a11y` | S |
| T22 | Audit axe-core + corrections de contraste AA | E3 | `educa-a11y` | M |
| T23 | Stratégie TTS vs lecteur d'écran, documentée et appliquée | E4 | `educa-a11y` | M |
| T24 | `CONFIDENTIALITE.md` + bouton « effacer toutes mes données » | E5 | `educa-scribe` | S |

**Ordre imposé :** T01→T06 (bloquants et filets) · puis T09, T10 (sans tests, le reste est aveugle) ·
puis T14, T15, T16 (la valeur pédagogique) · puis T20→T23 · puis le reste.

---

## 3. LE SYSTÈME « REPRENDRE QUAND LES TOKENS REVIENNENT »

**Le principe :** Claude Code publie lui-même, à chaque tour, le pourcentage de quota consommé et
**l'heure exacte du reset en secondes Unix**, via le JSON envoyé à la *statusline* :
`rate_limits.five_hour.used_percentage`, `rate_limits.five_hour.resets_at`,
et les équivalents `seven_day` ([doc officielle statusline](https://code.claude.com/docs/en/statusline)).
C'est la seule source fiable — il n'existe **aucune option d'auto-reprise officielle** à ce jour
(la demande est toujours ouverte côté Anthropic, [issue #26775](https://github.com/anthropics/claude-code/issues/26775)),
et les wrappers communautaires fonctionnent exactement sur ce principe :
lire `resets_at`, dormir jusque-là, puis `claude --resume <session-id>`
([exemple documenté](https://dev.to/karthikeyan_natarajan_1cb/i-built-a-shell-wrapper-that-makes-claude-code-auto-resume-after-rate-limits-2lje)).

### Les trois pièces

**a) Le capteur — `scripts/statusline-rl.sh`**
Déclaré comme `statusLine` dans `~/.claude/settings.json`. À chaque tour, il écrit
`~/.claude/rate-limit.json` : `{five_hour_pct, five_hour_reset, seven_day_pct, seven_day_reset, session_id}`.
Coût : zéro token (c'est un script shell, pas un appel au modèle).

**b) Le worker — `scripts/educa-worker.sh`**
Boucle simple, sans état en mémoire :

1. Verrou (un seul worker à la fois).
2. Lit `~/.claude/rate-limit.json`. Si quota ≥ **85 %** → dort jusqu'à `resets_at + 60 s`. On s'arrête
   *avant* le mur : une session coupée en plein milieu coûte plus cher qu'une session non commencée.
3. Prend la première tâche `pending` de `ops/BACKLOG.jsonl` dont les dépendances sont `done`.
4. Crée la branche `openclaw/<id>`, lance :
   `claude -p --output-format json --permission-mode acceptEdits --max-turns 60 --max-budget-usd 3 "<prompt de tâche>"`.
5. Récupère `session_id` dans la sortie JSON. Si la sortie ou `stderr` contient un motif de limite
   (`usage limit`, `rate limit`, `resets`) → dort jusqu'au reset → reprend **la même session** :
   `claude -r "<session_id>" -p "Reprends exactement où tu t'es arrêté. Lis d'abord ops/HANDOFF.md."`
6. À la fin : `educa-qa` vérifie `done_when` → statut `done` ou `blocked`, commit, PR, réécriture de
   `ops/BACKLOG.jsonl` et de `ops/HANDOFF.md`, ligne ajoutée à `ops/journal.md`.
7. Boucle sur la tâche suivante.

**c) Le réveil — deux mécanismes complémentaires**

*Battement de fond (toujours actif)* — une automation OpenClaw en mode commande, donc **zéro token**
tant qu'il n'y a rien à faire ([doc CLI cron OpenClaw](https://docs.openclaw.ai/cli/cron)) :

```bash
openclaw automations create "*/20 * * * *" \
  --name "EDUCA worker" \
  --command "scripts/educa-worker.sh" \
  --command-cwd "$HOME/projets/edugame" \
  --no-deliver
```

*Réveil exact au reset (programmé par le worker lui-même)* — quand le worker se met en pause, il
programme un réveil unique à l'heure du reset au lieu d'attendre le prochain battement :

```bash
openclaw automations create --at "2026-09-21T23:10:00" \
  --name "EDUCA reprise" \
  --command "scripts/educa-worker.sh" \
  --command-cwd "$HOME/projets/edugame" \
  --no-deliver
```

*(Sans OpenClaw, l'équivalent macOS est un `launchd` `StartInterval 1200`, et sous Linux un timer
`systemd --user`. Le worker est le même.)*

**Notification :** quand une PR est prête ou qu'une tâche est `blocked`, le worker relaie un message
dans le canal de Dave (`--announce --channel <…>`) en une ligne. Jamais de spam : une ligne par tâche.

### Les garde-fous qui économisent vraiment les tokens

- **Seuil à 85 %**, pas 100 % : on ne se fait jamais couper en plein travail.
- `--max-turns 60` et `--max-budget-usd 3` par tâche : une tâche qui part en boucle s'arrête seule.
- **Tâches courtes** : si une tâche de taille `L` ne tient pas dans une session, elle est **découpée**
  par `educa-scribe` en sous-tâches `L1`, `L2`… avant d'être lancée.
- **`ops/HANDOFF.md` ≤ 10 lignes** relu au début de chaque session : on rachète du contexte pour
  quelques centaines de tokens au lieu de relire tout le repo.
- **Sous-agents `haiku`** pour tout ce qui est mécanique (lecture, inventaire, mise à jour du backlog).
- **Le coordinateur ne lit jamais un fichier directement** : le contexte des sous-agents est isolé et
  ne remonte que sous forme de résumé.

---

## 4. LA DÉLÉGATION — LES SOUS-AGENTS CLAUDE

Les fichiers sont dans `agents/`, à copier dans `.claude/agents/` du repo (versionnés avec le projet).
Un sous-agent = un contexte isolé + des outils restreints + un modèle adapté
([doc officielle](https://code.claude.com/docs/en/sub-agents)).

| Agent | Modèle | Outils | Rôle |
|---|---|---|---|
| `educa-auditeur` | haiku | Read, Grep, Glob | Dresse l'état réel avant toute modification. Ne modifie rien. |
| `educa-pedagogue` | sonnet | Read, WebSearch, WebFetch, Write | Toute idée pédagogique doit passer par lui, sources à l'appui, note écrite dans `rapports/`. |
| `educa-dev` | sonnet | Read, Edit, Write, Bash, Grep, Glob | Implémente une tâche, une seule, jusqu'au commit. |
| `educa-a11y` | sonnet | Read, Edit, Bash, WebFetch | Accessibilité : clavier, mouvement, contrastes, lecteurs d'écran. |
| `educa-qa` | sonnet | Read, Bash, Grep | Juge d'arrivée : vérifie `done_when`, bloque si rouge. N'écrit pas de code applicatif. |
| `educa-scribe` | haiku | Read, Write, Edit | Backlog, HANDOFF, journal, découpage des grosses tâches. |

**Chaîne type pour une tâche pédagogique (T14) :**
`educa-auditeur` (où en est le code ?) → `educa-pedagogue` (que dit la recherche ? quelle règle ?)
→ `educa-dev` (implémentation) → `educa-qa` (tests + `done_when`) → `educa-scribe` (journal, backlog).

Si OpenClaw pilote plusieurs agents de son côté, la même répartition se déclare avec
`openclaw agents add …` et une équipe avec délégation `delegationMode: "prefer"`
([multi-agent OpenClaw](https://docs.openclaw.ai/concepts/multi-agent)).

---

## 5. FICHES DE TÂCHE DÉTAILLÉES (les plus délicates)

### T01 — Polices en local
Récupérer Nunito (400/700/900), Orbitron (700/900), Rajdhani (500/700) sous licence OFL, les sous-tailler
au jeu latin (`pyftsubset`/`glyphhanger`, format **woff2**), les poser dans `fonts/`, écrire les
`@font-face` avec `font-display: swap`, supprimer les deux `preconnect` et le `<link>` Google de
`index.html`, supprimer la branche `fonts.googleapis.com` de `sw.js`, ajouter les fichiers à `ASSETS`.
**done_when :** aucune requête réseau externe au chargement (DevTools, onglet Réseau, filtre « 3rd party »),
rendu identique, total des polices < 250 Ko, `LICENSE` des polices inclus.

### T05 — Mise à jour sous contrôle
Retirer `skipWaiting()` de l'install. Dans la page : écouter `updatefound` / `registration.waiting`,
afficher un bandeau parlé « Une nouvelle version est prête — touche ici », et n'envoyer
`postMessage({type:'SKIP_WAITING'})` qu'au tap. Ne jamais recharger pendant une partie en cours.
**done_when :** deux versions successives testées en local, l'ancienne continue de tourner jusqu'au tap.

### T14 — Sons des lettres (phonème)
**Étape 1 (pédagogue, obligatoire avant le code) :** rédiger `rapports/<date>-phonemes.md` qui fixe,
lettre par lettre, ce que l'enfant doit entendre : le **son** (/b/, /m/, /s/…) et non le nom (« bé »).
Traiter explicitement les cas français : voyelles à plusieurs valeurs, `c`/`g` durs et doux, `h` muet,
`w`, `x`, `q`. Source obligatoire : recommandations officielles francophones sur l'enseignement du
décodage (conscience phonémique puis correspondances graphème-phonème systématiques).
**Étape 2 (dev) :** la synthèse vocale lit mal un phonème isolé ; prononcer le son dans un appui
syllabique (« /b/ … ba, be, bi, bo, bu ») plutôt qu'une consonne nue, ou pré-enregistrer 26 sons courts
si la qualité n'y est pas. Ajouter un réglage « nom des lettres / son des lettres » (par défaut : **son**
au palier 1, les deux au palier 2).
**done_when :** note pédagogique commitée avec sources, réglage fonctionnel, aucune régression tout-audio.

### T15 — Mini-jeu Syllabes
`cfg.syllables` existe déjà dans `Educa.PALIERS` et n'est lu nulle part. Nouveau mini-jeu : une consonne
+ les 5 voyelles, l'enfant touche la syllabe entendue ; au palier 3, syllabes complexes (ou, on, an, ch).
Réutiliser la mécanique de `letters.js` (options, feedback, cartes méritées).
**done_when :** le jeu apparaît dans le hub, est piloté par le palier, ajouté à `sw.js`, testé.

### T16 — Répétition espacée
Les données existent déjà (`{ok, seen}` par lettre + confusions). Implémenter 5 boîtes Leitner :
réussite → boîte supérieure (revue plus tard), échec → boîte 1 (revue tout de suite). Le tirage d'une
session = 70 % boîtes basses + 30 % révision, et **toute lettre d'une paire de confusion détectée entre
systématiquement dans la session avec sa jumelle**. Garder Fisher-Yates pour mélanger le tirage final.
**done_when :** tests unitaires sur le sélecteur (une lettre ratée revient dans les 2 sessions suivantes),
espace parents affichant les boîtes.

### T19 — Multilingue
Extraire les ~325 chaînes vers `lang/fr.json` (clé → texte + texte parlé éventuellement différent).
`Voice.speak` doit accepter une langue et **se rabattre proprement** quand la voix n'existe pas
(le créole n'a quasi jamais de voix système : prévoir soit une phonétisation en voix française, soit
des enregistrements courts). Ne pas traduire avant que l'extraction soit terminée et testée en français.

---

## 6. CE QUI EST INTERDIT SANS L'ACCORD DE DAVE

- Publier sur `main`, déployer en production, ou toucher aux réglages GitHub Pages.
- Ajouter une dépendance qui arrive au moment de l'exécution (CDN, police distante, analytics, police
  externe, tracker) — les dépendances de **développement** (tests, build) sont acceptées.
- Créer un serveur, un compte, ou toute collecte de données d'enfant.
- Supprimer `archive/` (l'exclure du déploiement suffit).
- Modifier les 8 principes du README.
- Traduire le contenu pédagogique sans validation humaine.

---

## Sources

- [Customize your status line — Claude Code Docs](https://code.claude.com/docs/en/statusline) (champs `rate_limits.*.used_percentage` et `resets_at`)
- [CLI reference — Claude Code Docs](https://code.claude.com/docs/en/cli-reference) (`-p`, `--resume`, `--output-format json`, `--max-turns`, `--max-budget-usd`)
- [Create custom subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Feature: Auto-resume tasks after rate limit reset — anthropics/claude-code #26775](https://github.com/anthropics/claude-code/issues/26775)
- [I Built a Shell Wrapper That Makes Claude Code Auto-Resume After Rate Limits — DEV](https://dev.to/karthikeyan_natarajan_1cb/i-built-a-shell-wrapper-that-makes-claude-code-auto-resume-after-rate-limits-2lje)
- [Automations (cron) — OpenClaw Docs](https://docs.openclaw.ai/cli/cron)
- [Multi-agent routing — OpenClaw Docs](https://docs.openclaw.ai/concepts/multi-agent)
- [Skills — OpenClaw Docs](https://docs.openclaw.ai/tools/skills)
