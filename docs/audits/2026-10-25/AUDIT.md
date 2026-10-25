# Audit d’EDUCA — 25 octobre 2026

Révision examinée : `fd23ac1` — « Sons des lettres : toujours audibles, iPhone compris (#2) ». Dossier : `.`. Audit et propositions demandés ; aucun fichier de l’application n’a été modifié. Les outils de développement du lockfile ont été installés pour exécuter les tests.

## 1. Avis général et direction recommandée

EDUCA dispose d’une base technique cohérente avec son objectif : aider un enfant à apprendre à lire en français, avec un guidage audio, des activités progressives, une pratique régulière et un adulte qui peut suivre ses progrès. Le fonctionnement local, les petites ressources, l’absence de compte et la séparation entre moteur, contenus et écrans sont de vrais atouts.

Le prochain saut de qualité doit porter sur **la fiabilité des données, la réalité de l’autonomie audio et la mesure des compétences**. Ajouter beaucoup de niveaux ou d’animations avant ces améliorations augmenterait le volume sans garantir un meilleur apprentissage.

Positionnement conseillé : **un compagnon de lecture en français, accessible et utilisable hors ligne, qui aide l’enfant à pratiquer et donne à l’adulte des observations compréhensibles**. La mention « méthode complète du début de lecture à la 3e » engage davantage que ce que les preuves présentes dans le dépôt permettent de démontrer. Garder l’ambition, mais faire progresser séparément la profondeur du contenu et la validation de ses effets.

Je conserverais l’architecture actuelle. La taille du projet ne justifie pas à elle seule une réécriture avec un framework, un serveur, des comptes ou un service d’IA distant.

## 2. Périmètre et preuves

Examen du démarrage, du moteur pédagogique, du positionnement, de l’Élo, des révisions, du stockage, des imports, de la voix, des enregistrements, des écrans, des styles, du service worker, des tests, du déploiement, du guide et de la confidentialité. Inspection des données et de leurs validateurs ; lecture pédagogique d’exemples représentatifs. L’archive historique a été identifiée comme hors application publiée et n’a pas fait l’objet d’un second audit complet.

Les résultats distinguent : **reproduit** dans un script ou un navigateur isolé ; **constaté dans le code** ; **choix de conception à améliorer** ; **point restant à vérifier**. Ce document ne certifie ni une conformité juridique, ni toute l’accessibilité, ni l’efficacité clinique ou pédagogique du produit. Pas d’essai avec de vrais enfants, pas d’écoute humaine validant chaque phonème, pas de test sur un iPhone ou un appareil Android physique. Pas d’audit du site de production ou des réglages privés GitHub.

### Inventaire mesuré

| Élément | Résultat |
| --- | --- |
| Application | HTML, CSS, modules JavaScript natifs ; aucune dépendance d’exécution déclarée |
| Progression initiale | 66 étapes, 263 mots illustrés, 39 mots outils, 21 phrases |
| Niveaux suivants | 4 groupes, 40 modules et 4 contrôles ; 727 questions après développement des sous-questions |
| Répartition des questions | CE1–CE2 : 186 ; CM1–CM2 : 181 ; 6e–5e : 182 ; 4e–3e : 178 |
| Poids local indicatif | audio ≈ 1,25 Mio ; polices ≈ 200 Kio ; JS ≈ 610 Kio ; CSS ≈ 51 Kio, d’après `du` |
| Ressources hors ligne | 361 fichiers listés, version `educa-6650d2536f` |
| Tests unitaires | **97/97 réussis** |
| Suite navigateur Chromium | **19/20 réussis**, dont les 6 tests d’accessibilité automatisés |
| Test clavier existant relancé seul | Échec reproduit : seulement 1 réponse comptée au lieu d’au moins 4 ; 2 lors de la suite complète |
| Vérification clavier complémentaire | 4 réponses possibles avec Tab/Entrée en attendant les états de l’interface |
| Vérification WebKit complémentaire | Création de profil jusqu’à l’accueil réussie, sans erreur JavaScript observée |

Le navigateur Chromium utilisé est le Chromium headless installé avec Playwright. Le test WebKit est un contrôle limité du moteur, pas un test complet de Safari/iOS. Les captures sont faites à 390 × 844 ; l’accueil testé n’a pas de débordement horizontal. Aucune mesure de performance terrain ou de Core Web Vitals n’a été réalisée.

Les reproductions et leurs résultats sont conservés dans `preuves/`. Les scripts complémentaires utilisent le chemin local du projet et le navigateur installé ; les adapter en cas de déplacement du dossier.

## 3. Ce qui mérite d’être conservé

- Les fonctions pures du moteur et la séparation `core/`, `data/`, `services/`, `screens/`, `activities/`, `ui/` rendent les corrections ciblées possibles.
- Le calcul des prérequis graphème–phonème et les tests de décodabilité constituent une bonne protection contre des exercices hors progression.
- Les tests traitent déjà des homophones, des distracteurs, de la mémoire, des migrations, du CSV et des réponses mélangées.
- L’Élo visible ne baisse pas, tandis que l’estimation interne peut changer ; la distinction est déjà expliquée à l’adulte.
- La répétition espacée évite qu’une répétition immédiate suffise à déclarer une maîtrise durable.
- Le DOM affiche les saisies comme du texte ; la CSP limite les ressources ; le CSV neutralise les préfixes de formule. L’absence de dépendance d’exécution réduit la surface de maintenance.
- L’application inclut les polices et des fichiers audio, gère les requêtes audio Range, propose des exports et sépare les archives du site déployé.
- Les récompenses sont gagnées par des activités identifiées ; pas de classement entre enfants, de publicité ou de paiement dans le jeu.

## 4. Défauts et risques techniques prioritaires

P1 = à traiter avant une diffusion plus large ; P2 = prochaine consolidation. Aucun P0 démontré au cours de cet audit. Les priorités expriment l’impact sur cette application, pas un score universel de sécurité.

### A01 — P1 — La promesse de confidentialité doit correspondre au choix réel des voix

**Constaté dans le code.** `js/services/voice.js:73` choisit en priorité une voix française locale, mais accepte une voix distante s’il n’en trouve pas. Une préférence enregistrée pour une voix distante prend également le dessus sur une voix locale disponible (`:78`). `st.localVoice` peut lui-même retomber sur cette voix distante (`:79`). Ce n’est donc pas une garantie de voix locale.

Le README et le guide annoncent que rien ne quitte l’appareil. La page de confidentialité mentionne le cas des voix distantes, mais affirme qu’elles ne sont utilisées qu’en l’absence de voix locale : cela ne couvre pas la préférence explicite du code. Les textes envoyés à la synthèse peuvent contenir le prénom. Le caractère distant est défini par `localService` dans [la documentation MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService). Aucune transmission réelle à un fournisseur n’a été capturée pendant cet audit.

**Correction :** mode strictement local par défaut et sans contournement par une ancienne préférence. Sans voix locale, utiliser les enregistrements disponibles et expliquer la configuration nécessaire à l’adulte. Toute option distante éventuelle doit être explicite, séparée et décrite correctement. La CSP ne suffit pas à démontrer le caractère local d’un service système de synthèse.

La phrase de `confidentialite.html` selon laquelle l’absence de compte et de collecte implique l’absence de traitement côté école est aussi à revoir : la conservation et la consultation de données identifiantes font partie de la [définition d’un traitement donnée par la CNIL](https://www.cnil.fr/fr/definition/traitement-de-donnees-personnelles). Décrire les données, les rôles, l’hébergement, les exports et leur effacement ; faire confirmer le cadre scolaire par le DPO. Cela ne signifie pas que l’application serait nécessairement interdite ou non conforme.

**Validation attendue :** simulations sans voix locale et avec préférence distante ancienne ; aucune sélection distante en mode local ; documentation cohérente ; diagnostic clair du canal audio.

### A02 — P1 — Une sauvegarde échouée disparaît de la file de reprise

**Reproduit.** `js/services/store.js:83` appelle `write()` puis vide `dirty` à `:94`, même si l’écriture a échoué. Après une panne simulée puis rétablissement du stockage, un nouveau `flush()` laisse le disque à « Initial » alors que la mémoire contient « Après panne ».

**Impact :** des progrès affichés peuvent être perdus à la fermeture. L’avertissement actuel n’est montré que lors du montage de l’accueil, une fois par ouverture ; une panne plus tardive peut être peu visible.

**Correction :** retirer uniquement les clés écrites avec succès ; conserver les autres, signaler l’état de sauvegarde et retenter avec un délai borné. Offrir un export de secours. Prévoir les écritures partielles entre la liste des profils et leurs contenus, sans boucle de réessai infinie.

**Validation :** échec ponctuel, quota durable, reprise, fermeture, stockage refusé, profil ajouté pendant une panne. Vérifier les données réellement relues après redémarrage.

### A03 — P1 — Deux instances peuvent écraser leurs progrès

**Reproduit avec deux stores partageant le même stockage.** Chaque instance charge son état, incrémente une réponse puis sauvegarde : le disque contient 1 réponse au lieu de 2. `store.js` n’organise pas la concurrence entre onglets/fenêtres.

**Correction :** choisir une politique explicite : une seule session d’écriture active avec message de reprise, ou un journal d’opérations doté d’identifiants et une synchronisation cohérente. Ajouter seulement un événement `storage` n’assure pas l’atomicité. Tenir compte d’un onglet et d’une fenêtre PWA ouverts ensemble.

**Validation :** deux pages du même contexte navigateur, réponses et changements de profil concurrents, fermeture du détenteur d’un verrou. Aucun écrasement silencieux et aucune réponse comptée deux fois.

### A04 — P1 — Les fenêtres de cartes ne se comportent pas entièrement comme des modales

**Reproduit dans le navigateur.** Dans une carte ouverte, Maj+Tab quitte le dialogue et atteint une carte mystère en arrière-plan. `#app` n’est pas `inert`. Échap ne ferme alors plus la fenêtre, car l’écouteur est attaché au dialogue. `js/ui/overlay.js:14` ne contient ni confinement du focus ni restitution à l’élément déclencheur.

**Correction :** privilégier un élément `<dialog>` ouvert avec `showModal()` si la matrice cible le permet, ou implémenter complètement inertie, focus, fermeture et restauration. Le [modèle W3C pour les dialogues modaux](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) précise ces comportements.

**Validation :** Tab/Maj+Tab, Échap, retour navigateur, fermeture par bouton, ouvertures successives, lecteur d’écran, disparition éventuelle du déclencheur. L’arrière-plan doit rester inutilisable pendant la modale.

### A05 — P1 — La disponibilité réelle de l’audio et du hors-ligne n’est pas suffisamment présentée

**Constaté dans le code ; le parcours hors ligne nominal passe.** `sw.js:383` précache les ressources avec un `addAll()` global. Une ressource indisponible peut empêcher l’installation complète. Le rejet d’enregistrement du service worker est ignoré dans `js/main.js`, et le message hors ligne affirme que tout fonctionne sans vérifier qu’un cache est prêt. La présence d’un cache ne garantit pas une voix française locale pour toutes les consignes.

Le mode silencieux filtre les exercices d’écoute (`js/screens/lesson.js:89`). À la première étape, une leçon de 10 questions devient **0 question** après ce filtre. Le code le gère avec un message, mais le guide conseille encore le mode silencieux comme solution générale pour les débutants.

**Correction :** diagnostic adulte « jeu téléchargé / audio local disponible / lecture audio testée ». Afficher « prêt hors ligne » seulement après installation contrôlée. Prévoir un exercice compatible ou une orientation vers un casque quand l’activité exige l’écoute. Élargir les consignes enregistrées et valider leur couverture. Distinguer explicitement mode silencieux, absence de voix et lecteur d’écran.

**Validation :** premier téléchargement interrompu, MP3 manquant, réseau absent au redémarrage, aucune voix française, absence de synthèse, stockage refusé et retour du réseau. Tester sur appareils physiques.

### A06 — P1 — Le contrôle clavier automatisé ne constitue pas un garde-fou fiable en l’état

**Échec reproduit.** `tests/e2e/smoke.test.mjs:313` s’arrête après 120 tours de boucle. Lors des transitions, la boucle peut consommer ses tabulations rapidement ; ce mécanisme est sensible au rythme et aux réponses. La suite complète échoue avec 2 réponses, puis la relance ciblée avec 1.

Un scénario complémentaire qui attend l’arrivée des choix permet 4 réponses au clavier, avec deux tabulations par question. L’échec ne prouve donc pas que toute une leçon serait impossible au clavier ; il prouve que la validation actuelle doit être corrigée et approfondie. La modale défectueuse d’A04 est un problème distinct.

**Correction :** attentes sur les états observables de l’activité, parcours reproductible, alternance volontaire de réussite et d’erreur, assertions de focus à chaque transition. Ne pas supprimer l’assertion ou simplement augmenter la boucle.

**Validation :** suite complète verte avec le scénario corrigé et couverture des types d’exercices, du bilan et des cartes. Les tests axe ne retiennent actuellement que les impacts serious/critical ; conserver aussi la visibilité sur les autres résultats et les vérifications manuelles. Le [W3C rappelle qu’aucun outil seul ne détermine la conformité](https://www.w3.org/WAI/test-evaluate/).

### A07 — P2 — La limite quotidienne est vérifiée à l’entrée de la séance

**Constaté dans le code.** `lesson.js:69` contrôle le plafond avant la séance ; le temps est généralement enregistré au bilan ou à la sortie. `commitPartial()` ignore les séances de moins de 3 réponses (`:291`). Une séance longue peut dépasser la limite et plusieurs sorties précoces ne comptent pas leur temps. Le tracé a son propre mécanisme de comptage à la sortie.

**Correction :** comptabilisation commune, périodique et idempotente du temps actif, y compris à la mise en arrière-plan, sans couper une correction au milieu. Une pause douce entre deux activités est préférable. Rendre explicite la différence entre un plafond appliqué et un simple rappel.

**Validation :** sorties après 0/1/2 réponses, veille, changement de jour, horloge modifiée, arrêt pendant un bilan ; aucun double comptage.

### A08 — P2 — La sauvegarde importée ne restaure pas tout ce qu’elle contient

**Reproduit.** `exportBundle()` inclut `dailyMinutes`, `importBundle()` le lit, mais `store.importAll()` (`store.js:204`) ne l’applique pas : un export à 15 minutes devient 0 après import dans un store vierge.

Les enregistrements IndexedDB ne font pas partie de l’export JSON. `mostAdvanced()` choisit une copie entière selon le nombre de réponses, puis le chemin et le record ; ce n’est pas une fusion de deux historiques ayant divergé. La copie retenue peut manquer des réglages ou des réussites présents dans l’autre.

**Correction :** préciser les modes « ajouter des élèves » et « restaurer cet appareil ». Montrer ce qui sera restauré ou conservé. Définir une politique pour les copies divergentes, borner les fichiers importés et assainir les réglages de l’appareil. Inclure éventuellement les sons dans une sauvegarde complète séparée. Le PIN ne doit pas être réintroduit implicitement par un import.

**Validation :** appareil vierge, appareil déjà configuré, profils divergents, ancienne version, fichier énorme/invalide et restauration complète annoncée à l’utilisateur.

### A09 — P2 — « Tout effacer » conserve les sons enregistrés

**Reproduit.** Un son témoin stocké dans IndexedDB reste présent après les deux clics de confirmation et le rechargement. `store.wipe()` efface le localStorage ; `clearRecordings()` existe dans `js/services/recordings.js:64`, mais ce parcours ne l’appelle pas.

La politique actuelle explique que les sons se suppriment individuellement : le défaut concerne donc surtout le périmètre ambigu de « Tout effacer sur cet appareil » et son résultat attendu.

**Correction :** proposer un effacement complet incluant IndexedDB, en précisant séparément le cache de l’application si nécessaire ; ou renommer exactement l’action si les sons doivent être conservés. Révoquer les URL de blobs remplacées. Gérer l’échec de chaque stockage sans annoncer prématurément que tout a été supprimé.

### A10 — P2 — Les diplômes gagnés sont absents de la collection

**Reproduit.** Un profil possédant `diplome-n3` voit « Mes cartes · 2/83 », mais aucun bouton « Diplôme ». `catalogue()` crée bien des cartes `kind: 'diplome'`, tandis que `js/screens/collection.js:11` ne rend que son/exploit/titre.

**Correction :** ajouter la section des diplômes et vérifier la cohérence entre compteur, catalogue et cartes rendues. Une récompense gagnée doit rester consultable après le bilan.

### A11 — P2 — Les parcours de classe ont besoin d’une politique plus précise

**Constaté dans le code.** L’étape de classe ouvre les nœuds du chemin (`path.js:18`) ; le bouton « Jouer » utilise encore l’étape individuelle. Terminer une étape future ne fait pas avancer le chemin individuel, car `finishSession()` n’avance que si `step === open`. Cela peut être intentionnel, mais l’adulte a besoin de comprendre la différence entre autoriser une étape et l’assigner.

Il n’existe que 16 avatars, sans réservation ni combinaison visuelle unique ; deux non-lecteurs peuvent choisir le même animal. Le bouton « Nouveau » de l’écran des profils reste accessible aux élèves même si un PIN adulte est défini.

**Correction :** distinguer affectation, accès libre et maîtrise ; ajouter un mode classe protégeant la création des profils ; proposer des identifiants visuels uniques avec animal + forme/couleur/symbole, sans dépendre de la couleur seule. Prévoir 30 élèves et un usage partagé réel.

### A12 — P2 — Quelques renforcements de maintenance sont utiles

**Constaté dans le code.** Les profils sont assainis, mais les réglages chargés de l’appareil sont surtout fusionnés avec les valeurs par défaut. Les imports n’ont pas de plafond explicite de taille/nombre de profils. Les mises à jour sont proposées hors leçon dans l’onglet courant, mais `controllerchange` recharge aussi les autres clients, sans concertation avec leur activité en cours.

Les onglets adultes utilisent `role=tab` sans le modèle complet de navigation par flèches et de panneau associé. Les courbes ont un nom accessible, mais peu d’équivalent textuel détaillé. L’enregistrement micro et les chargements de blobs gagneraient à avoir un nettoyage systématique et une gestion des échecs/abandons.

**Correction :** `sanitizeDevice`, validation bornée, états explicites pour les services, coordination des mises à jour entre fenêtres, onglets conformes au [modèle W3C](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) ou simple navigation assumée. Ajouter un contrôle de types progressif JSDoc/`checkJs`, un formatage et un lint adaptés. Garder ces changements séparés des modifications pédagogiques.

## 5. Les améliorations pédagogiques qui auront le plus de valeur

### B01 — Séparer l’avancement, l’aide et la maîtrise

Deux séances entièrement fausses à l’étape 0 ouvrent l’étape suivante, avec 0 étoile. Un contrôle de 17 réponses toutes marquées `help` est validé à 100 %. Ces comportements sont explicitement prévus et testés : ce sont des choix de conception, pas des anomalies accidentelles.

La bienveillance justifie de permettre la découverte et de proposer des aides. Elle ne justifie pas d’afficher la même conclusion pédagogique pour une réussite autonome, une lecture audio compensatoire et un indice qui donne la réponse. L’aide au rangement des mots peut montrer le mot suivant ; une autre aide ne fait que lire le passage : leurs effets sur la compétence évaluée diffèrent.

Proposition : garder les encouragements et l’accès souple, mais représenter séparément **vu / pratiqué / réussi avec aménagement / réussi seul / confirmé après délai**. Ajouter des observations par compétence : conscience phonologique, correspondances, fusion, décodage, encodage, compréhension orale/écrite, orthographe, grammaire. Une réussite avec texte lu peut démontrer de la compréhension sans démontrer une lecture autonome du même texte.

Le tableau adulte des sons utilise aussi `snd:id` ou, à défaut, `pa:phonème`. Une observation sur un phonème partagé par plusieurs graphies peut ainsi colorer plusieurs étapes sans démontrer la reconnaissance de chaque graphie. Fonder la grille sur la compétence précise et afficher « données insuffisantes » lorsque nécessaire.

### B02 — Rendre l’adaptation explicable et calibrée

L’Élo et les difficultés sont construits à partir de paramètres et de simulations. Aucun étalonnage terrain d’EDUCA n’a été trouvé dans le dépôt. Le nombre global ne doit donc pas être présenté comme une mesure scolaire standardisée.

Ajouter des profils de compétences, des seuils qui exigent plusieurs observations et un historique limité des décisions. L’adulte pourrait lire : « On revoit b/d : 3 confusions récentes et révision arrivée à échéance ». Prévoir des mini-séquences de remédiation quand une confusion persiste, plutôt que d’espérer qu’un tirage pondéré suffise.

Préserver la motivation avec des points d’effort séparés des observations de maîtrise. Valider le transfert sur des mots et des phrases nouveaux, plutôt que seulement la mémorisation des questions connues. Le positionnement actuel est un bon point d’entrée, mais mérite des sondes de confirmation et une possibilité de correction par l’adulte.

### B03 — Faire lire des textes suivis et travailler le sens dès le départ

Le lexique initial est structuré, mais le parcours de base ne contient que 21 phrases et s’appuie beaucoup sur des correspondances mot/image et des choix. Ajouter une bibliothèque de mini-récits réellement décodables, révisés, avec une progression de longueur et de vocabulaire.

Pour chaque récit : lecture autonome, aide à la demande clairement identifiée, quelques questions littérales et d’inférence, rappel oral avec un adulte, puis reprise ultérieure dans un autre contexte. Travailler aussi le vocabulaire oral des non-lecteurs, afin que l’image ou le mot inconnu ne fausse pas le diagnostic de décodage.

Le [CSEN associe explicitement décodage et compréhension](https://www.csen.education.gouv.fr/enseigner-la-lecture-page-editoriale/). Le guide [What Works Clearinghouse](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published) recommande la lecture régulière de textes suivis pour l’exactitude, la fluidité et la compréhension. Ces références orientent la conception ; elles ne prouvent pas l’efficacité d’une fonctionnalité EDUCA avant son évaluation.

Pour la fluence, proposer d’abord une lecture guidée et une observation adulte facultative. Un enregistrement local écouté par l’adulte peut être utile. Une reconnaissance vocale automatique ne devrait pas devenir un juge incontournable ni transmettre de voix sans décision explicite.

### B04 — Donner une traçabilité pédagogique au contenu

Les commentaires de `js/data/levels.js` citent déjà les programmes de 2024, 2025 et 2026 et leur calendrier : c’est une bonne base. Cependant, une citation en tête de fichier n’est pas une matrice de couverture du programme. Quarante modules regroupant huit classes ne suffisent pas, à eux seuls, à démontrer une couverture complète de toutes leurs compétences.

Chaque activité devrait posséder : un identifiant stable, une compétence, des prérequis, un objectif, un niveau indicatif, une référence officielle précise et datée, une explication, un statut de relecture humaine et les modalités d’aide autorisées pour l’évaluation. Ajouter une matrice « attendu → activités → preuves de couverture → manques ».

Au 25 octobre 2026, les [ressources officielles de français](https://eduscol.education.gouv.fr/4503/francais) indiquent les nouveaux programmes de CM2 et 5e à la rentrée 2026 ; le [ministère détaille le calendrier du collège](https://www.education.gouv.fr/les-programmes-du-college-470408), notamment 4e en 2027 et 3e en 2028. Éviter de fusionner ces échéances dans une seule promesse non datée.

### B05 — Valider la qualité perceptive des sons et du tracé

Les tests audio mesurent notamment niveau, saturation et différences spectrales. Ils ne démontrent pas qu’un enfant reconnaît le phonème ni qu’il entend une réalisation pédagogique correcte. Le jeu fournit 11 fichiers de sons isolés ; plusieurs consonnes utilisent une synthèse de secours ou l’enregistrement de l’adulte.

Faire relire et écouter tous les phonèmes, syllabes et mots par des professionnels compétents. Constituer un corpus humain cohérent avec licences et contrôle de volume, de découpe et de prononciation. Vérifier les variantes de prononciation acceptables sans les classer en erreurs d’apprentissage.

Le tracé mesure la couverture de la forme et le débordement. Il ne mesure ni l’ordre ni la direction des gestes. Ajouter un point de départ et un modèle animé facultatif validé par un spécialiste de l’écriture, ainsi qu’un retour adapté. Le présenter comme un entraînement au geste, sans assimiler automatiquement la réussite au coloriage à une écriture acquise.

### B06 — Tester l’utilité avec des utilisateurs réels

Commencer par un petit pilote d’usage avec parents, enseignants et enfants concernés : installation, premier jeu, compréhension des pictogrammes, fatigue, écoute, erreurs, reprise et lecture du bilan. Cela repère les problèmes d’usage ; ce n’est pas une étude d’efficacité.

Pour étudier les apprentissages ensuite, définir avec des partenaires un protocole, des mesures extérieures au jeu et des conditions de comparaison adaptées. Mesurer aussi ce qui est retenu après un délai et le transfert à de nouveaux mots. Le tableau des études de [GraphoGame](https://graphogame.com/evidence/) montre l’importance de préciser version, population et compétence mesurée ; ses résultats ne sont pas transférables à EDUCA.

## 6. Expérience utilisateur et différenciation

L’accueil mobile est lisible et son bouton principal ressort. Je préserverais cette simplicité. Les améliorations visuelles doivent aider la compréhension du parcours et la lecture.

- **Première ouverture :** une entrée audio déclenchée par un geste et un test bref permettent de confirmer que Kaya est réellement entendue. L’âge ou les paramètres techniques peuvent être renseignés avec l’adulte ; prévoir un chemin très court vers la première activité.
- **Deux présentations selon le public :** univers illustré pour les débutants ; présentation plus sobre au choix pour les adolescents en difficulté. Adapter la forme à l’âge sans inférer le niveau de lecture de l’âge.
- **Images :** les émojis économisent des ressources mais peuvent être ambigus et varient selon le système. Prioriser des illustrations cohérentes et testées pour les mots qui posent problème, avec des descriptions accessibles, plutôt que remplacer tout le corpus sans mesure.
- **Charge cognitive :** conserver une seule décision importante à la fois ; limiter les animations pendant l’observation d’un mot ; rendre les célébrations courtes ou passables ; offrir une progression compréhensible sans surcharger l’enfant d’indicateurs.
- **Adulte :** montrer d’abord « ce qui progresse / ce qui mérite de l’aide / quoi faire ensuite ». Une action de deux minutes hors écran vaut davantage qu’un nombre Élo isolé. La vue d’ensemble devrait permettre de créer des groupes de besoin et d’assigner une activité précise.
- **Sécurité des profils partagés :** il s’agit d’un usage collectif de confiance, pas d’une authentification individuelle forte. Le préciser, et protéger les réglages adultes et les suppressions de manière cohérente.

Les fonctions documentées de [Lalilo pour le suivi des élèves](https://lalilo-aide.renaissance.com/hc/fr-fr/articles/11119098083355-Suivre-les-r%C3%A9sultats-de-mes-%C3%A9l%C3%A8ves) donnent un repère de comparaison : progression par domaine et identification des difficultés. Ce benchmark documentaire n’est pas un essai comparatif des produits. L’avantage qu’EDUCA peut construire est une lecture claire des besoins tout en gardant son fonctionnement local et son accès simple.

## 7. Feuille de route recommandée

Les tailles S/M/L expriment une complexité relative, sans engagement de délai. Chaque lot doit garder une application fonctionnelle et ses profils existants lisibles.

| Ordre | Lot | Taille | Résultat attendu |
| --- | --- | --- | --- |
| 1 | Sauvegarde et concurrence A02–A03 | M | Progression conservée malgré panne et double ouverture |
| 2 | Voix locale et diagnostic A01/A05 | M | Promesse de confidentialité et autonomie audio vérifiables |
| 3 | Modales et tests A04/A06 | S–M | Parcours clavier stable et validation réellement utile |
| 4 | Données et petites incohérences A07–A10 | M | Limite, restauration, effacement et récompenses cohérents |
| 5 | Conception de la mesure B01–B02 | L | Aides, effort et acquis distingués ; migrations définies |
| 6 | Usage en classe A11 | M | Affectations explicites et profils reconnaissables à 30 élèves |
| 7 | Contenus et mini-récits B03–B05 | L, continu | Profondeur pédagogique, voix relues et contenus traçables |
| 8 | Tableau adulte et présentation par âge | M | Actions concrètes pour l’adulte, expérience adaptée aux grands |
| 9 | Compatibilité, maintenance et pilote | M, continu | Appareils réels testés et problèmes d’usage observés |

Critères de passage avant une diffusion élargie : défauts P1 traités ; tests unitaires et navigateur verts ; reprise des sauvegardes testée ; modalités de voix explicites ; parcours sans réseau validé sur appareils cibles ; contrôle manuel du clavier et des lecteurs d’écran ; contenus essentiels relus.

Indicateurs utiles ensuite : démarrage d’une activité sans aide technique, stabilité des sauvegardes, réussite autonome par compétence, rétention après délai, transfert à de nouveaux items, temps nécessaire à l’enseignant pour trouver une action. Le temps passé et les étoiles ne suffisent pas à démontrer un apprentissage.

## 8. Ce que je reporterais

Une refonte totale, un grand volume de questions générées sans relecture, un agent conversationnel distant pour enfants, un classement public, des séries quotidiennes culpabilisantes, une synchronisation cloud imposée ou une mesure automatique présentée comme diagnostic de dyslexie. Ces projets apporteraient aujourd’hui davantage de complexité et d’engagements que de valeur démontrée.

Les consignes de mise en œuvre sont dans `PROMPTS_CODEX.md`. Les transmettre lot par lot, en conservant les preuves et les critères d’acceptation : le but est de pouvoir constater l’amélioration après chaque modification.
