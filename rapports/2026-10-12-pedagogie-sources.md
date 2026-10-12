# EDUCA v2 — Pédagogie sourcée : progression, phonologie, dyslexie, classe, applis

Date : 2026-10-12 · Auteur : responsable pédagogique (`educa-pedagogue`) · Statut : FINAL · 16 recherches web + 11 PDF lus en entier · aucun autre fichier modifié.
Preuves : **[P]** source primaire lue (page citée) · **[S]** relais ou synthèse d'un document officiel (texte officiel Éduscol, HAL, PMC inaccessible : 403 ou captcha) · **[H]** hypothèse EDUCA à tester. « S12 » = semaine 12 du tableau Kalulu (guide p.27) ; DHS = Dehaene, Huron, Sprenger-Charolles 2012.

## 0. Constats préalables sur le dépôt
- Les 4 rapports annoncés par `ops/HANDOFF.md` (`recherche-elo`, `progression-lecture`, `dyslexie-et-classe`, `audio-phonemes`) sont absents de `rapports/` : celui-ci couvre progression, dyslexie, classe ; restent à faire Élo et audio des phonèmes.
- `rapports/2026-09-21-edugame-cadrage-accessibilite.md` affirme qu'OpenDyslexic est « la demande n°1 de la littérature » et que le chrono est « un facteur de stress documenté » (sources : un site de collège, un comparatif d'applis). Wery & Diliberto 2017 et Kuster et al. 2018 ne montrent aucun bénéfice (§5) ; aucune source lue n'établit l'effet du chrono. À corriger.
- `js/core/seg.js` : `isDecodable()` est le bon garde-fou ; `oin` existe dans PHONEMES mais pas dans la progression de Dave ; la notation « u (/y/) » est interne : aucun symbole phonétique ne doit être montré à l'enfant (CSEN 2022 p.2 ; Kalulu p.14).

## 1. Décision (résumé)
- **L'ossature est conforme** : graphème d'abord, voyelles puis consonnes continues, digrammes très réguliers (ch, ou) tôt, règles contextuelles (c, g, s) après la valeur de base, rares en fin (DHS 2012, Kalulu 2025, Goigoux 2016). Les 15 premières étapes de Dave = 15 CGP : le tempo optimal (14-15 en 9 semaines) est tenu.
- **À corriger (tableau §3)** : (1) remonter e, ou, lettres muettes, c=/k/, oi, au ; (2) placer p t c d b g AVANT les nasales on/an ; (3) scinder les étapes qui groupent 3 à 5 graphèmes ; (4) ajouter es/est/et, un/une, ui, oin, ien, -ent, ti, oy/ay, consonnes doubles et la structure syllabique CVC puis CCV ; (5) mots-outils lisibles seulement quand 100 % décodables.
- **Niveau de preuve** : ou, nasales après occlusives, lettres muettes, scission des groupes, mots-outils décodables = DHS et Kalulu concordent [P] ; écartements entre confusables, seuils, durées = [H] (aucune source lue ne les chiffre).
- **Rythme** : 2 nouvelles CGP/semaine, 1 par séance, J0 introduction puis J+1 révision ; l'enfant prêt avance sans attendre (un tempo lent pénalise). L'ordre v2 compte 65 étapes ≈ 32 semaines (Kalulu : 33).
- **Dyslexie** : Andika par défaut (licence OFL), espacement réglable (3 crans), fond crème/pêche en option, OpenDyslexic au choix sans jamais le présenter comme remède ; couleurs et syllabes = options, jamais seule aide.
- **Alertes** : le Constructeur à tuiles ressemble à la tâche « E5 » de Goigoux (effet global négatif observé) → l'associer au tracé et à la dictée de mots décodables ; aucune image-indice pendant le déchiffrage ; « pas de chrono » est un choix de conception (loi du projet), pas un fait établi.

## 2. Progression : constats sourcés
- **Tempo [P]** Goigoux 2016 (131 CP, 2 507 élèves) p.46 : effet maximal pour 14 ou 15 CGP en 9 semaines ; élèves faibles 12-14 ; < 8 « freine » code et écriture ; moyenne observée 11,4 (p.45). Programme de français 2024 relayé par Lille (oct. 2025, p.4 et 8) [S] : cadence ≈ 2 CGP/semaine ; fin de période 1 : 12 à 15 CGP ; mi-année 25 à 30 ; fin de CP 30 mots/min sans préparation, 50 après. Kalulu p.9 : « au moins 2 ou 3 » par semaine, ≈ 14 par période ; tableau à 2/semaine sur 33 semaines (p.27).
- **Déchiffrabilité [P]** Goigoux p.46 : textes < 29 % déchiffrables = moins efficace ; > 57 % = plus efficace pour les faibles. CSEN 2022 p.1-2 : les stratégies « à dominante phonique… absence de mots outils » donnent les meilleurs résultats (enquête Deauvieau, 16 149 enseignants) ; gestes à éviter : mots non enseignés, devinettes, alphabet phonétique.
- **Entrée graphémique ou phonémique [P]** Goigoux p.47 : aucun effet ; Gentaz et al. 2013 (essai randomisé lyonnais) : pas de supériorité d'un enseignement renforcé des CGP (p.3). Les preuves portent sur « explicite + systématique + rapide + déchiffrable », pas sur un ordre exact.
- **Ordre [P]** DHS p.2-3 : régularité (P2a), fréquence (P2b), consonnes continues l r m n f v j ch z s AVANT les occlusives p t k b d g (P2c), CV/VC avant CVC avant CCV (P2d), graphème complexe = une unité (P2e), lettres muettes enseignées tôt en gris clair (P2f ; s, e, t > 8 000 mots). Kalulu p.9 : ordre Manulex (fréquence, cohérence) ; c/g/s contextuels après la valeur de base (p.45). DHS reconnaît que ces principes ont « très rarement » été testés (p.1).
- **Confusions [P]** DHS P1d (p.2) : b/d et p/q = même objet pour le pré-lecteur, il faut « briser cette symétrie » (gestes d'écriture différents, étape de contraste « ba-da, bi-di… », leur étape 21, p.6) ; Kalulu p.14 : copie et tracé. Aucune des deux progressions n'écarte les paires sourde/sonore (Kalulu : ch S8, j S9 ; d S9, t S10) : l'écartement est [H]. Éduscol, ressources maternelle (programme 2015) p.17 : « distinguer des sons proches (f/v, s/ch, s/z, ch/f) » est le DERNIER des repères de progressivité (ordre indicatif).
- **Nasales [P]** Kalulu p.27, 43-45 : n S6, on S14, en+an S16, in/ein/ain S18, em/am/om/im S21-23 ; confusion an/en = d'orthographe ; DHS p.5-6 : occlusives avant nasales vocaliques.
- **Mots-outils : positions divergentes.** DHS P2g (p.3) : mots fréquents irréguliers tôt [P]. Guide orange 2019 [S] (Béthune 3 p.9, Dakar p.10) et programme 2024 : usage « réduit au minimum ». Kalulu p.5-6 : l'enseignement précoce de mots entiers « peut être contre-productif » [P]. Choix : la position récente et stricte.
- **Nom ou son [P]** DHS P5c (p.4) : éviter absolument le nom des lettres au début (« f » = /fff/, pas /ef/) ; guide orange [S] : le nom sert à épeler ; Kalulu p.14 : articuler et montrer « le geste de la bouche ».
- **Écriture [P]** DHS P3 (p.3) : graphèmes mobiles et geste d'écriture améliorent la lecture ; Goigoux p.47 : dictée (jusqu'à ~40 min/sem) et encodage autonome (~35) bénéfiques ; p.53 : produire en combinant des unités déjà imprimées (E5) = effet global négatif sur l'écriture finale (corrélationnel) ; Kalulu p.20, 37 : n'écrire que du décodable.

## 3. Corrections de la progression : étape actuelle → proposition → raison
Les n° « v2 » renvoient à l'ordre proposé plus bas.

| Étape actuelle | Proposition (n° v2) | Raison |
|---|---|---|
| 1-9 a i l o r u m é s | Garder ; une CGP par étape (Kalulu en met 4 en S1) | P2c, tempo 2/sem [P] |
| 10 e (/ə/) | → 8, avant s ; é devient 9 | Kalulu S1 ; DHS étape 8 ; débloque le, me et le e muet (puis se, ne, je, de) [P] |
| 16 ou | → 11 | Kalulu S5 (12e CGP) ; DHS étape 7 ; P2e « ou, ch, an, on tôt » [P] |
| 40 « lettres muettes finales » | Étape dédiée 12 (e, s, t grisés) ; h muet 63 et w 65 restent en fin | DHS P2f ; Kalulu S6, grisées au livret 1 et effacées au livret 3 (p.41) ; programme 2024 : « conscience des lettres finales muettes » à mi-année [P/S] |
| (absent) | + un/une (17), leçon-mot après n | Kalulu S7, p.42 ; DHS étape 26 [P] |
| 17 p, 18 t, 19 on, 20 d, 21 an, 22 z, 23 b | p 19, t 20, c 21, oi 22, d 23, è/ê 24, g 25, b 26, PUIS on 27 ; an 31 ; z 38 | DHS et Kalulu : occlusives avant nasales vocaliques ; z rare (Kalulu S19) [P] ; l'ordre actuel n'est pas sourcé |
| 19 on/om | on 27 ; om 45 | Kalulu S14, S22 [P] |
| 21 an/en/am/em | an 31, en 32, am/em 44 | Kalulu S16, S21-22 ; an/en = confusion d'orthographe (p.43) [P] |
| 26 in/ain/ein/un/im | in 36, ain/ein 37, im/ym/aim 46 ; un déjà en 17 | Kalulu S18, S23 [P] |
| Écart entre nasales | ≥ 4 étapes entre on (27), an (31), in (36) + jeu « laquelle ai-je dite ? » | Kalulu p.43 (jeu), écarts S14-S16-S18 [P] ; le seuil 4 est [H] |
| 25 c/k/q/qu | c=/k/ 21 ; q/qu 30 ; k 34 (rare) | Kalulu S12, S14, S17 ; DHS étape 17 [P] |
| 27 g/gu | g/gu 25, règle « g dur, u devant e i y » dans la même étape | Kalulu p.42 ; DHS P2a (g moins régulier que v) [P] |
| 24 è/ê/e+consonne | è/ê 24 ; e+consonne (el, ec, ell, ett) 42 | Kalulu S12 puis S20 [P] |
| 28 oi | → 22 | Kalulu S11 (DHS le place plus tard : écart assumé) [P] |
| 29 ai/ei, 30 eu/œu, 31 au/eau | au 33, ai/ei 35, eu 43, eau 54, œu 59 | Kalulu S17, S18, S21, S26, S30 [P] |
| 32 gn, 33 c/ç, 34 g=/ʒ/, 35 s=/z/, 36 x | c=/s/ 47, g=/ʒ/ 48, s=/z/ 49, x 55, gn 56 | Kalulu S20, S23, S24, S27, S28 [P] |
| 37 ill/il/y, 38 er/ez, 39 ph | er 50, et 51, ien 52, -ent 53, ez 57, ill/il 58, ph 61, y 64 | Kalulu S24-S33 [P] |
| (absent) | + es (les, des) 28, est 29, oin 39, ui 40, ti 60, oy/ay 62 | Kalulu S15, S19, S7, S30-31 ; `seg.js` a déjà oin [P] |
| (absent) | + consonnes doubles (ll mm nn pp tt ff rr ss) 41 : un seul son, une seule tuile ; ss avant s=/z/ | DHS étapes 14 (ss) et 63 ; Kalulu livret 3 « enne, ette, erre, elle » (p.44) ; `seg.js` les gère [P] |
| (absent : structure) | CV/VC dès 1 ; CVC dès 10 (mur, sol) ; CCV (pr tr dr vr fl pl) dès 22 | DHS P2d ; Kalulu S11 [P] |
| b/d/p/q (p17, d20, b23, q25) | Écart ≥ 3 étapes (p19, d23, b26, q30) + étape-contraste après q (ba/da, bi/di, bou/dou) + tracé | DHS P1d, étape 21 ; Kalulu p.14 [P] ; l'écart ≥ 3 est [H] |
| Paires f/v, t/d, ch/j, s/z, p/b, k/g | ≥ 2 étapes d'écart ; paires minimales une fois les deux sons appris | Éduscol p.17 [P] ; écartement [H] (Carnine 1980, J. Reading Behavior 12(1):41-47, compare « très confondables d'abord » et « peu confondables d'abord » : non lu) |
| Mots-outils « introduits comme mots entiers » | Chaque mot devient lisible à l'étape où ses CGP sont connues (liste ci-dessous) ; « mots spéciaux » : es/les/des, est, et ; jamais d'image-indice | CSEN 2022 ; programme 2024 ; Kalulu p.5-6 [P/S] ; contraire à DHS P2g (2012) |

**Ordre v2** (une CGP par étape ; [H] arbitrage entre DHS 2012 et Kalulu 2025)
```
1 a · 2 i · 3 l · 4 o · 5 r · 6 u · 7 m · 8 e · 9 é · 10 s · 11 ou · 12 lettres muettes (e s t grisés) · 13 f · 14 ch · 15 v · 16 n · 17 un/une · 18 j
19 p · 20 t · 21 c=/k/ · 22 oi · 23 d · 24 è/ê · 25 g/gu · 26 b · 27 on · 28 es · 29 est · 30 q/qu · [contraste b/d/p/q] · 31 an · 32 en · 33 au · 34 k
35 ai/ei · 36 in · 37 ain/ein · 38 z · 39 oin · 40 ui · 41 consonnes doubles · 42 e+consonne · 43 eu · 44 am/em · 45 om · 46 im/ym/aim · 47 c=/s/ · 48 g=/ʒ/
49 s=/z/ · 50 er · 51 et · 52 ien · 53 -ent muet · 54 eau · 55 x · 56 gn · 57 ez · 58 ill/il · 59 œu · 60 ti · 61 ph · 62 oy/ay · 63 h muet · 64 y · 65 w
```
**Mots-outils lisibles dès** : a·il·la (3) · le·me (8) · se·sur (10) · vous (15) · nous·ne (16) · un·une (17) · je (18) · pour (19) · tout (20) · de (23) · mon·ton·son (27) · les·des (28) · est (29) · que (30) · dans (31) · mais (35) · elle·avec (42) · ce (47) · et (51).
**Bilan par critère demandé**
- Consonnes prolongeables d'abord : respecté (l r m s f ch v n j avant p t d) [P P2c] ; z, continue, reste tardif car rare (Kalulu S19).
- Fréquence : 6 déplacements vers l'avant (e, ou, lettres muettes, c=/k/, oi, au) et 11 ajouts ; entre CGP de fréquence voisine, aucune preuve causale d'un ordre exact (Gentaz 2013 ; Goigoux p.47).
- Confusions visuelles : p 19, d 23, b 26, q 30 (≥ 3 d'écart) + contraste + tracé ; m 7 / n 16 ; u 6 / ou 11 avec ou = une seule tuile ; i 2 / l 3 adjacents → Andika (I, l, 1 distincts) [H].
- Confusions auditives : f/v 13-15, ch/j 14-18, t/d 20-23, c/g 21-25, p/b 19-26, s/z 10-49 ; paires minimales ensuite (Éduscol p.17 : en dernier) [H].
- Nasales : on 27, an 31, in 36, après toutes les occlusives ; jeu « laquelle ai-je dite ? » [P Kalulu p.43].
**Rythme recommandé** : 2 nouvelles CGP/semaine en mode classe (Kalulu 2-3 ; programme ≈ 2 ; Goigoux 14-15 en 9 semaines) ; à 2 étapes/semaine, étape 14 = fin de période 1 (13 CGP, attendu 12-15) et étape 18 = semaine 9 (17 CGP : au-dessus de l'optimum Goigoux, sous Kalulu ≈ 19) ; 1 seule nouvelle CGP par séance ; J0 (écoute, geste de bouche, tracé, syllabes) puis J+1 (révision) [P Kalulu p.33-36] ; l'enfant qui réussit avance sans attendre la semaine [P] ; mode maison : ouvrir n+1 quand n est ≥ 80 % sur 2 jours [H, cible Élo du projet] ; alerte douce à l'adulte si < 8 CGP ouvertes en 9 semaines [P seuil Goigoux]. **Positionnement** [H] : 3 items par CGP en ordre croissant (son → lettre par toucher), arrêt après 3 CGP ratées de suite, départ à la première non acquise ; si échec dès a/i/l : épreuve de syllabes (§4) ; programme 2024 : consolider conscience phonologique et principe alphabétique chez les élèves fragiles (Lille p.8) [S]. **Enfants de 4-5 ans** : phase pré-code = §4 (syllabes, rimes, sons prolongeables) avant l'étape 1 ; attendus de fin de cycle 1 : manipuler les syllabes, discriminer voyelles et quelques consonnes non occlusives (Éduscol p.17) [P].

## 4. Conscience phonologique : ordre et consignes de Kaya (texte exact)
**Ordre recommandé.** [P Éduscol p.17] 1 scander et dénombrer les syllabes (comptines, tambour) → 2 reconnaître une syllabe, rimes et assonances → 3 opérer sur les syllabes (enlever, ajouter, substituer) → 4 isoler un phonème que l'on peut prolonger (voyelles, /s/ /f/ /z/ /l/ /m/ /ch/) → 5 le localiser (début, milieu, fin) → 6 trouver le phonème commun à plusieurs mots → 7 distinguer des sons proches (f/v, s/ch, s/z, ch/f) en dernier. [S/H] Fusion (sons → syllabe → mot) et segmentation (mot → sons) viennent après 4-5, avec les lettres dès que possible : la méta-analyse du NRP (Ehri 2001, 52 études) trouve l'effet le plus fort avec des lettres et 1 à 2 habiletés à la fois (conscience phonémique d = 0,86 ; lecture 0,53 ; orthographe 0,59 ; 5 à 18 h).
**Règles.** [P] Kalulu p.54 : conscience phonémique et lecture progressent ensemble : ouvrir la lettre 1 sans attendre. Goigoux p.43-44 : 30 % des plus faibles ont une conscience syllabique peu développée en fin de CP → si l'enfant échoue, redescendre aux syllabes. Éduscol p.17 : accepter les variantes régionales (« porte » = 1 ou 2 syllabes). Kalulu p.48 : classer des mots par son initial ou final en reliant écoute et graphème.
**Rédaction des consignes** [H ; routine = charge cognitive réduite, Kalulu p.34] : une consigne = une action ; ≤ 12 mots ; modèle d'abord (« Écoute… Moi je… À toi ! ») ; mêmes mots à chaque séance ; bouton « oreille » pour réécouter ; jamais « non », « faux », « raté », « mauvais » ni son d'échec ; louer l'effort, jamais la personne. {son} = enregistrement du phonème pur (jamais « me » pour /m/).
- Syllabes : « Écoute bien. Je dis : {mot}. Je le coupe en morceaux : {syl1}… {syl2}… Tape sur le tambour avec moi. À toi : un coup pour chaque morceau. »
- Syllabes, si juste : « Oui ! {syl1}… {syl2}… Deux morceaux, comme toi. » · si erreur : « On écoute encore ensemble. {syl1}… {syl2}… Je tape avec toi. À toi. »
- Rime : « Écoute : {mot1}, {mot2}. À la fin, ça fait pareil : {rime}. Maintenant : {mot1}, {mot3}. Est-ce que ça fait pareil à la fin ? Touche le cœur si oui, la feuille si non. »
- Son initial : « Écoute le son : {son}… {son}… comme au début de {motA} et de {motB}. Dis-le avec moi : {son}. Quelle image commence par {son} ? Touche-la. »
- Fusion : « Je parle comme un robot : {son1}… {son2}. Je colle les sons : {syllabe}. À toi : {son1}… {son2}. Touche la syllabe que tu entends. » Puis mots : « Le robot dit : {syl1}… {syl2}. Quel mot ? Touche l'image. »
- Segmentation : « Écoute : {syllabe}. Je la coupe : {son1}… {son2}. Deux sons. Pose un jeton pour chaque son. À toi : {syllabe}. »
- Nouvelle lettre (J0) : « Voici une nouvelle lettre. Elle fait le son {son}. Regarde ma bouche : {son}. Dis-le avec moi. Maintenant, avec ton doigt, suis le chemin de la lettre en disant {son}. »
- Reconnaître une syllabe écrite : « J'en dis une. Écoute : {syl}. Touche celle que tu entends : {sylA} ou {sylB}. »
- Erreur sur une lettre : « Presque. Écoute encore : {son}. Regarde la lettre. On réessaie ensemble. » · après deux erreurs : « On la retrouve demain. Je te la montrerai encore. »
- Aide : « Touche l'oreille pour réécouter, ou l'étoile si tu ne sais pas encore. Ce n'est pas grave : je t'aide. »
- Carte méritée : « Tu as lu {mot} tout seul, trois fois de suite. Voici ta carte : {son}. » · Fin : « C'est fini pour aujourd'hui. Tu as bien écouté et bien cherché. À demain ! »

## 5. Dyslexie : ce que dit la recherche
- **Espacement [S]** Zorzi et al. 2012 (PNAS 109:11455 ; 74 enfants italiens et français selon les relais ; +2,5 pt entre les lettres, mots et lignes agrandis) : précision de lecture ≈ doublée, surtout chez les plus en difficulté ; mécanisme proposé : moindre « crowding ». Réplication partielle (Hakvoort et al. 2017) : moins d'erreurs mais pas plus de vitesse chez les enfants dyslexiques. Marinus et al. 2016 : l'avantage de la police Dyslexie (+7 % de mots/min) disparaît quand l'espacement d'Arial est égalisé. Textes intégraux non lus (PMC et PNAS bloqués).
- **Valeurs [P/H]** WCAG 1.4.12 (AA) : l'interface doit rester intacte avec interligne 1,5, paragraphes 2×, lettres 0,12 em, mots 0,16 em. Proposition [H] : 3 crans de lettres 0 / +0,12 em / +0,18 em (≈ Zorzi) ; défaut +0,12 em (aucun risque connu).
- **Polices [S]** OpenDyslexic : aucun gain de vitesse ni de précision, aucune préférence (Wery & Diliberto 2017, petit effectif) ; Dyslexie : ni bénéfice ni gêne chez ≈ 170 enfants dyslexiques (Kuster et al. 2018) ; Lexend : gains annoncés par ses concepteurs (n = 20, +19,8 % de mots corrects/min, p = 0,014), aucune validation indépendante vue ; Andika (SIL) : conçue pour débutants (b/d/p/q distincts, I/l/1 distincts, a et g à un étage, licence OFL), mais SIL ne cite aucune étude. Décision : Andika par défaut (choix de conception, pas preuve d'efficacité) ; OpenDyslexic, Lexend, police système au choix, sans promesse.
- **Fond [S]** Rello & Bigham 2017 (341 participants dont 89 dyslexiques ; temps de lecture à l'écran) : fonds chauds (pêche, orange, jaune) meilleurs que fonds froids (bleu, bleu-gris, vert) ; groupe dyslexique : pêche 14,85 s contre bleu-gris 21,57 s ; même classement dys/non-dys (ρ = 0,96). Ni enfants ni compréhension mesurés à ma connaissance → fond crème/pêche en option, contraste AA conservé [H].
- **Couleur et lettres muettes [P]** DHS P2e-P2f (p.2-3) : une couleur ou une « entité » par graphème complexe, gris clair pour les muettes, en reconnaissant l'absence de test direct (p.1) ; Kalulu grise les muettes (livret 1, effacées au livret 3, p.41) et colore digrammes/trigrammes dans sa version dyspraxie (p.50). Coloration par syllabe : aucune preuve robuste trouvée → option éteinte par défaut, a/b test [H] ; ne jamais porter le sens par la couleur seule.
- **Synthèse vocale [H]** aucune étude lue ; contrainte pédagogique [P] : pas de /ə/ parasite derrière un phonème isolé (DHS P5c ; guide orange [S]) → phonèmes et syllabes ENREGISTRÉS ; synthèse tolérée pour les mots de consigne ; vitesse réglable ; voir le rapport audio-phonèmes (à faire).
- **Chrono [H]** aucune source lue n'établit qu'il nuit ; la fluence est mesurée par l'adulte (Kalulu p.36-37 ; programme 2024). EDUCA : aucun compte à rebours visible (loi du projet).
- **Erreur [P]** DHS P3 (p.3) : distinguer « bonne » et « mauvaise » erreur ; guide orange [S] : l'erreur est source d'apprentissage ; Goigoux p.58 : climat bienveillant et engagement profitent surtout aux élèves faibles ; p.59 : aider sur la MÊME tâche (effet positif) plutôt que substituer une autre tâche (effet négatif). → réécouter, ralentir, moins de choix ; jamais changer de tâche ni sanctionner.
- **Répétition espacée [S/P]** guide orange [S] : profondeur d'encodage, alternance apprentissage/tests, intervalles espacés, séquences courtes, fréquentes, ritualisées ; Kalulu p.9-10 : répétition espacée avec sommeil. Les intervalles Leitner (10 min, 1 j, 3 j, 7 j, 21 j) sont [H].
- **Durée des séances** guide orange [S] (Éduscol « gestion du temps en CP ») : sept.-oct. 4 × 10 min/jour, nov.-déc. 3 × 15, dès janvier 2 × 30 ; élèves fragiles : 20 h/an (≈ 7 min/jour) = insuffisant. OMS 2019 [P] : ≤ 1 h d'écran/jour à 3-4 ans. EDUCA [H] : 8-10 min (4-6 ans), 12-15 (7-9), 15-20 (10-12), ≤ 3 séances/jour, fin annoncée par Kaya.

## 6. Usage en classe en France
- **Programmes en vigueur au 2026-10-12 [S]** cycle 1 : programme du BO n°19 du 7 mai 2026 (rentrée 2026-27), domaine « langage oral et écrit » du BO n°41 du 31 oct. 2024 (depuis 2025-26) ; cycle 2 : français et mathématiques du BO du 31 oct. 2024 (depuis la rentrée 2025). Attendus CP (Lille p.4, 8) : ≈ 2 CGP/sem, textes déchiffrables, mots-outils au minimum, faire écrire systématiquement les CGP, mesurer la vitesse de lecture. → l'appli complète sans remplacer la lecture à voix haute ni l'écriture : fiches imprimables par étape (syllabes, mots, phrases, dictées) et test d'1 min animé par l'adulte.
- **Plusieurs élèves par tablette** Kalulu p.38 : ateliers tournants, ≈ 1 h/semaine/enfant sur tablette → profils par animal sans identifiant, sessions ≤ 15 min, reprise propre à chaque enfant [H].
- **Tableau de bord [P]** P2IA (DRANE 2026 p.15) : outils d'assistance, recommandations d'activités, synthèses de résultats « sans se substituer à l'enseignant » ; guide : mesurer la vitesse pour former des groupes. → écran adulte : CGP vues/acquises, confusions, tempo (CGP ouvertes en 9 semaines), étape imposée, export et impression ; jamais de classement ni d'étiquette.
- **RGPD/CNIL, sans compte [P DRANE p.4-6]** une ressource est discutée a minima en conseil d'école (D411-2) ; l'IA-DASEN est responsable de traitement ; toute ressource qui collecte des données personnelles va au registre (art. 30) ; critères : pas de publicité ni de traceurs, compte, licence, « bien-être numérique » (non conçue pour capter l'attention, articulée à des tâches non numériques) ; inscrire des élèves à un service non conventionné est déconseillé ; portabilité des données (Doctrine technique 2025). EDUCA : zéro compte, zéro donnée hors appareil, zéro traceur/pub/CDN, export et effacement locaux ; hors registre si rien n'est collecté [H, à confirmer par un DPO académique] ; fiche d'une page.
- **Accessibilité [P]** RGAA 4.1.2 (18 avr. 2023), RGAA 5 annoncé fin 2026 ; WCAG 2.2 = Recommandation du 5 oct. 2023 : cible ≥ 24×24 px CSS (2.5.8, AA), alternative au glissement (2.5.7), focus non masqué (2.4.11), aide cohérente (3.2.6) ; Édu-up exige RGPD et RGAA (DRANE p.14-15). Enfants : cibles ≥ 48 px [H] ; le tracé au doigt est un glissement : prévoir une alternative.
- **Repérage [P DRANE p.9-19]** portails Éduscol/Primàbord ; GAR (marque « compatible GAR » pour les adhérents, utile aux ressources à comptes, hors sujet ici) ; Édu-up (financement et labellisation EdTech, 4 commissions/an) ; P2IA (dont Lalilo) ; 69 solutions TNE (Canopé) ; communs numériques : Forge apps.education.fr et qualification ÉduCommun ; INSHEA « Observatoire des ressources numériques adaptées » ; Cap École inclusive (Canopé) ; site « Ressources pour l'école inclusive » (a référencé Kalulu : « hors-ligne »). Plan [H] : licence ouverte, dépôt sur la Forge + candidature ÉduCommun, fiche INSHEA, fiche Ressources école inclusive, note pédagogique citant guide orange et Kalulu.

## 7. Applications de référence et différenciation d'EDUCA
- **Kalulu [P]** ordre Manulex, 2 CGP/semaine, 100 % décodable, matériel gratuit sous Creative Commons, hors-ligne, versions dyslexie et dyspraxie en test (p.49-50) ; > 1 000 enfants en France, déploiements Brésil, Colombie, Mayotte (poster CogSci 2025, aucun effet chiffré lu). À vérifier : cible CP (5-7 ans), oral et fluence confiés à l'adulte (p.35-36), tableau de bord et multi-profils non vus.
- **GraphoGame (version française) [S]** essais contrôlés (Écalle, Magnan et al.) : effets petits à modestes (ES 0,18-0,27 : conscience phonémique, choix orthographique, fluence) ; en Angleterre, GraphoGame Rime : pas d'effet face à la pratique habituelle (NFER). Aucune étude vue sur un dispositif tout-audio.
- **Lalilo [P/S]** P2IA vague 1 (2020-23), cycle 2 : personnalisation et recommandations pour l'enseignant (DRANE p.15-16) ; étude d'efficacité 2024-25 (Sciences Po, Paris Dauphine), résultats non vus.
- **Distinction d'EDUCA (à prouver, pas à proclamer)** non-lecteurs de 4 à 12 ans, apprenants tardifs compris ; tout-audio, sans clavier ni compte, hors-ligne, licence ouverte ; profils animaux sur appareil partagé + export papier ; réglages dys sans étiquette ; contextes Guyane et Haïti ; Élo bienveillant et matrice de confusions pour l'adulte. Aucune revendication d'efficacité avant une évaluation pré/post (type test d'1 min).
- **Haïti, Guyane [S]** créole haïtien : pas de voyelles antérieures arrondies /y ø œ/ ; an /ã/, en /ɛ̃/, on /ɔ̃/ ; ou, ch, j comme en français (Wikipédia EN). Mode Haïti [H] : u et eu/œu plus tard avec entraînement d'articulation ; « en » = /ã/ en français mais /ɛ̃/ en créole : le contraster ; « ou » peut passer plus tôt. Goigoux p.40 et 57 : les enfants dont la langue de la maison n'est pas le français réussissent moins en code et le bilinguisme est « rarement pris en compte » ; Kalulu p.52 : encourager l'oral et la lecture dans la langue maternelle. À valider avec des enseignants locaux.

## 8. Checklist de conception
**DOIT**
1. Tout mot ou phrase à lire = 100 % décodable avec les CGP déjà enseignées (`isDecodable`) ; mots-outils lisibles seulement quand décodables ; 4 « mots spéciaux » au plus.
2. Une seule nouvelle CGP par séance ; J0 : écoute, geste de bouche, tracé, syllabes ; J+1 : révision ; révision espacée ensuite.
3. Sons purs (/mmm/, jamais « me ») ; nom des lettres seulement pour épeler, plus tard ; aucun symbole phonétique à l'écran.
4. Aucune image à côté du mot à déchiffrer ; l'image vient après (sens, récompense) [guide orange S ; Kalulu p.12].
5. Lettres muettes grisées dès l'étape 12 puis effacées progressivement ; graphème complexe = une seule tuile, une seule couleur.
6. Étape-contraste b/d/p/q avec tracé ; paires minimales pour f/v, s/z, ch/j, t/d, p/b.
7. Aucune sanction ni chrono visible ; erreur → modèle sonore, 2e essai, retour espacé ; aide sur la même tâche (réécouter, ralentir, moins de choix).
8. Réglages dys au 1er écran adulte (police, espacement 3 crans, fond, vitesse de voix, grisé/couleurs), mémorisés, sans étiquette.
9. Zéro compte, traceur ou CDN ; données locales ; export et effacement ; fiche RGPD.
10. Cibles ≥ 48 px, alternative au glissement, focus visible, pas de double voix avec un lecteur d'écran.
11. Encodage : dictée de mots décodables (tuiles) + tracé ; le Constructeur à tuiles n'est pas l'unique activité d'écriture.
12. Phonologie avant et avec les lettres (§4) ; redescendre aux syllabes si l'enfant échoue.
**DEVRAIT**
1. Tempo 2 CGP/sem en mode classe ; alerte douce à l'adulte si < 8 CGP en 9 semaines.
2. Fiches imprimables par étape + test d'1 minute pour l'adulte.
3. Étape imposée par l'enseignant ; rapport par CGP et par confusion, sans classement.
4. Séances 8-10 / 12-15 / 15-20 min selon l'âge ; Kaya annonce la fin.
5. Lecture à voix haute à un adulte ou un camarade proposée chaque jour (non mesurable par l'appli).
6. Mode Haïti/Guyane : ordre et contrastes adaptés (§7).
7. Kaya montre le geste de la bouche (animation) pour chaque nouveau son.
**POURRAIT**
1. Coloration par syllabe (option éteinte, a/b test). 2. Fond pêche/crème par défaut après test. 3. Lexend, OpenDyslexic ou police système au choix. 4. Lecture chronométrée côté adulte seulement. 5. Mode contacteur/balayage. 6. Évaluation pré/post avec une école partenaire avant toute promesse d'efficacité.

## 9. Spécification remise à educa-dev (aucun code ici)
- **Données** `js/data/curriculum.js` : une entrée par étape v2 `{ id, kind: cgp | rule | word | contrast, cgps: ['ou>ou'], structure: ['CV','VC'], muted, note }` ; identifiants au format `gpcId()` de `seg.js` (`c>k`, `c>s`, `g>g`, `g>j`, `s>z`, `qu>k`, `ill>y`…).
- **Mots-outils** table `{ mot, seg, special }` ; l'étape de déblocage est CALCULÉE (max des étapes de ses CGP via `parseSeg`), jamais saisie à la main ; seuls es/les/des, est, et ont `special: true` (carte spéciale, sans image).
- **Éligibilité d'un mot à l'étape n** : `isDecodable()` avec les CGP d'étapes ≤ n, lettres muettes exemptées (grisées) ; CVC dès l'étape 10, CCV dès 22 ; ≥ 80 % des mots d'une séance contiennent la CGP du jour ou des 3 précédentes [H].
- **Confusables** table `CONFUSABLES` avec distance minimale en étapes : visuelles ≥ 3 (b-d, p-q, b-p, d-q, p-d, b-q, m-n, u-ou) ; sourde/sonore ≥ 2 (f-v, t-d, ch-j, s-z, c>k–g) ; nasales ≥ 4 (on-an, an-in, on-in) ; exception documentée i-l (adjacents : compensés par la police et un contraste dès l'étape 4) ; une étape `contrast` est planifiée après le 2e membre (b/d/p/q : après l'étape 30).
- **Tempo** : mode classe ≤ 2 étapes/semaine/élève (levable par l'enseignant) ; mode maison sans plafond mais 1 nouvelle CGP par séance ; l'étape n+1 s'ouvre quand n est ≥ 80 % sur 2 jours distincts [H] ; indicateur adulte « CGP ouvertes en 9 semaines » (alerte douce < 8).
- **Rendu** : lettre muette en gris (≥ 3:1 sur le fond, texte large ≥ 24 px) jusqu'à l'étape 35 puis noire [H] ; graphème complexe = 1 tuile, 1 couleur ; aucune image dans les écrans de déchiffrage ; police Andika, espacement 0 / +0,12 / +0,18 em, fond blanc / crème / pêche.
- **Audio** : clés `son:<phonème>`, `syl:<id>`, `mot:<id>` enregistrées (pas de synthèse pour les phonèmes) ; textes de Kaya (§4) dans `js/i18n/fr.js` avec `{son}`, `{mot}`, `{syl1}`… ; aucune chaîne sans audio.
- **Cartes méritées** : carte-son quand la CGP est lue 3 fois sans aide sur 2 jours distincts [H] ; jamais au hasard.
- **Tests d'acceptation** (`node:test`) : (1) tout mot d'une étape n est décodable avec les CGP ≤ n ; (2) étape de déblocage des mots-outils = liste §3 ; (3) distances de `CONFUSABLES` ; (4) aucune chaîne de Kaya ne contient « non », « faux », « raté », « mauvais », « nul » ; (5) aucun écran de déchiffrage sans `<img>` ; (6) étapes 1-18 ≤ 17 CGP ; (7) chaque CGP apparaît une seule fois dans l'ordre.

## 10. Limites et points ouverts
- Textes officiels non ouverts (guide orange, BO, Éduscol 2020, programme cycle 1 de 2026, Zorzi PNAS, Rello PDF complet, PMC) : relais [S] à recouper avant toute communication publique ; les repères Éduscol p.17 datent du programme 2015.
- Goigoux 2016 = classes ordinaires de CP, corrélationnel, sans application numérique ; DHS 2012 = principes « rarement testés » ; Kalulu : aucun effet chiffré lu. L'ordre v2 est un arbitrage [H].
- Valeurs [H] à tester : écarts ≥ 3 / ≥ 2 / ≥ 4 entre confusables, espacement, durées, intervalles Leitner, seuil 80 %.
- Créole : source secondaire ; guyanais non documenté ici.
- À faire : rapports Élo et audio-phonèmes ; relecture par un enseignant de CP et un orthophoniste ; lecture de CSEN 2019 et 2022 et du guide orange complet (progression p.67).

## 11. Sources
- DHS 2012 (diffusé par le ministère) : https://imagesetlangages.fr/animations_pedagogiques/REP-plus/Quelques_grands_principes_de_l_apprentissage_de_la_lecture_et_progression_Dehaene.pdf
- Goigoux (dir.) 2016, synthèse « Lire et écrire » : https://portail-ressources-education-dsden74.web.ac-grenoble.fr/sites/default/files/archives-circos/ien.annecy3/IMG/pdf/synthese-du-rapport-lire-et-ecrire.pdf · rapport : http://ife.ens-lyon.fr/ife/recherche/lire-ecrire/rapport/rapport
- Kalulu, Guide pédagogique (Excello, 2025) : https://kalulu.excellolab.org/wp-content/uploads/sites/2/2025/05/Guide-pedagogique-methode-Kalulu.pdf · Potier-Watkins et al. 2025 : https://journalpub.escholarship.org/cognitivesciencesociety/article/50469/galley/38431/download
- Guide orange (relais) : https://conservatoire.etab.ac-lille.fr/files/2021/03/Guide-Orange-Pour-enseigner-la-lecture-et-l-ecriture-au-CP-Bethune-3.pdf · https://www.ipefdakar.org/IMG/pdf/2_pour_enseigner_la_lecture_et_l_ecriture_au_cp.pdf · officiel : https://eduscol.education.gouv.fr/6681/les-guides-fondamentaux-pour-l-enseignement
- CSEN, note d'alerte n°1 (oct. 2022) : https://www.csen.education.gouv.fr/wp-content/uploads/2025/03/1cb0ad39-bc98-4bdd-a3dc-b340c14a85d6-NotealerteCSEN01.pdf · publications : https://www.reseau-canope.fr/conseil-scientifique-de-leducation-nationale
- Éduscol, Ressources maternelle (programme 2015), repères de progressivité en phonologie p.17 : https://pedagogie-nord.ac-lille.fr/docuweb/debuter-en-maternelle/docs/4concevoir-organiser/4-oral_ecrit_phonologie_progressivite.pdf
- Programme de français cycle 2, outil Lille (oct. 2025) : https://pedagogie-nord.ac-lille.fr/docuweb/aide-appropriation-nouveaux-programmes/docs/Fiche-aide-a-la-reflexion-progression-C2-francais-lecture.pdf · cycle 1, textes en vigueur : https://sites.ac-nancy-metz.fr/maternelle57/2026/07/07/les-programmes-en-application-au-cycle-1-a-la-rentree-scolaire-2026/
- NRP / Ehri et al. 2001 : https://www.nichd.nih.gov/publications/pubs/nrp/findings · 36 phonèmes (Éduscol) : https://st-chamond-circo.edu42.ac-lyon.fr/wp-content/uploads/sites/46/2022/01/La-conscience-phonologique-a-lecole-maternelle1-1.pdf
- Zorzi et al. 2012 : https://ccnl.psy.unipd.it/publications/publications_folder/extra-large-letter-spacing-improves-reading-in-dyslexia/view · relais Hakvoort 2017 : https://archive.memory-key.com/research/news/extra-large-letter-spacing-improves-reading-dyslexia
- Wery & Diliberto 2017 : https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5629233/ · Kuster et al. 2018 : https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5934461/ · Marinus et al. 2016 : https://researchers.mq.edu.au/en/publications/a-special-font-for-people-with-dyslexia-does-it-work-and-if-so-wh/
- Rello & Bigham 2017 : https://www.changedyslexia.org/publications/pdfs/2017-ASSETS-Good%20Background%20Colors.pdf · Andika : https://software.sil.org/andika/ · Lexend : https://www.lexend.com/
- WCAG 2.2 nouveautés : https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ · 1.4.12 : https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html · RGAA : https://accessibilite.numerique.gouv.fr/
- DRANE Bourgogne-Franche-Comté, « Les ressources numériques éducatives » (08.09.2026) : https://drne.region-academique-bourgogne-franche-comte.fr/wp-content/uploads/2026/09/RESSOURCES-NUMERIQUES-EDUCATIVES_VF08092026.pdf · Ressources pour l'école inclusive (Kalulu) : https://ressources-ecole-inclusive.org/kalulu/
- OMS 2019 : https://www.who.int/news/item/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more · GraphoGame : https://lpc.univ-amu.fr/fr/doc/hal-01909660/_6 · https://www.nfer.ac.uk/publications/graphogame-rime-evaluation-report-and-executive-summary/ · Lalilo : https://circ-ien-eurometropole-nord.site.ac-strasbourg.fr/wp-content/uploads/2024/04/presentation-de-Lalilo.pdf · Créole haïtien : https://en.wikipedia.org/wiki/Haitian_Creole
