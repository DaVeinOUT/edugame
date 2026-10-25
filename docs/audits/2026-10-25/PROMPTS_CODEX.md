# Consignes prêtes à copier dans Codex sur VS Code

Projet EDUCA, audit du 25 octobre 2026, révision de référence `fd23ac1`.

Lire `AUDIT.md` pour les preuves et les réserves. Les propositions ci-dessous sont des demandes de mise en œuvre futures ; les corrections ne sont pas déjà faites. Exécuter les lots séparément, dans l’ordre proposé, puis examiner le résultat. Les fichiers du projet peuvent évoluer : vérifier chaque constat sur la version actuelle avant de le corriger.

## Consigne générale — à transmettre avec le premier lot

```text
Tu travailles sur EDUCA, une application de lecture en français pour enfants, avec Kaya comme guide audio. Elle utilise HTML/CSS/JavaScript en modules natifs, sans dépendance d’exécution, avec données locales, profils partagés et service worker. Elle comprend un parcours initial de 66 étapes et des modules CE1–3e.

Lis les instructions du dépôt, README.md et docs/audits/2026-10-25/AUDIT.md s’ils sont disponibles. Examine l’état Git et la version actuelle des fichiers avant d’agir. Les constats de l’audit correspondent au commit fd23ac1 et doivent être revérifiés.

Implémente uniquement le lot demandé. Préserve les données existantes, l’usage hors ligne, les tests de décodabilité, l’accessibilité et les choix bienveillants. Ne remplace pas l’architecture ou les contenus sans raison liée au lot. Une migration doit conserver les profils existants et distinguer les acquis démontrés des informations inconnues.

Commence par reproduire le problème ou établir le comportement actuel. Fais une correction ciblée et ajoute les tests utiles au risque traité. Ne supprime pas une assertion ou un contrôle de CI pour faire passer une suite en échec. Pour une modification de l’application, régénère sw.js avec npm run release et vérifie-le avec node scripts/release.mjs --check. Lance npm test et les tests navigateur pertinents ; signale exactement les contrôles non exécutés et leur raison. Examine le diff final.

Termine par le comportement corrigé, les fichiers modifiés, les résultats des tests et les limites restantes. Ne publie pas de nouvelle version tant que les critères du lot ne sont pas vérifiés. Les messages destinés à l’enfant doivent rester courts, concrets et compréhensibles à l’oral.
```

## Lot 1 — Rendre la sauvegarde résistante aux pannes et aux doubles ouvertures

```text
Corrige A02 et A03 de l’audit EDUCA. Examine js/services/store.js, js/core/schema.js et les tests de stockage.

Problèmes à reproduire :
1. flush() efface toutes les clés dirty même si write() a échoué. Après panne temporaire puis rétablissement, les modifications non persistées ne sont pas retentées sans nouvelle mutation.
2. Deux stores ayant chargé le même profil et sauvegardant chacun une réponse peuvent laisser une seule réponse sur disque. Aucun mécanisme ne protège les instances concurrentes.

Implémente une file de sauvegarde qui ne retire une clé qu’après succès, des reprises bornées et un état observable indiquant les modifications non sauvegardées. L’adulte doit pouvoir obtenir un export de secours et comprendre le risque de fermeture. Gère aussi la cohérence entre l’ordre des profils et les fichiers de profils en cas d’écriture partielle.

Pour la concurrence, choisis la solution la plus simple qui garantit un comportement clair : une seule instance autorisée à écrire, avec reprise après fermeture, ou un mécanisme d’opérations idempotentes et de résolution explicite. Documente brièvement le choix. Un écouteur storage seul ne garantit pas l’atomicité ; évite une fusion qui doublerait les réponses ou inventerait des progrès.

Critères : échec ponctuel puis reprise sans nouvelle réponse ; panne durable sans boucle infinie ; redémarrage avec données intactes ; deux pages réelles du même contexte navigateur sans perte silencieuse ; changement de profil et fermeture d’une instance correctement gérés. Conserve la possibilité de jouer en mémoire lorsque le stockage est indisponible, en signalant sa limite.
```

## Lot 2 — Garantir la voix locale et rendre l’état audio/hors-ligne vérifiable

```text
Traite A01 et A05. Examine js/services/voice.js, js/main.js, js/screens/lesson.js, js/screens/adult.js, sw.js, README.md, guide.html et confidentialite.html.

Le choix actuel accepte des voix distantes ; une préférence enregistrée peut même les choisir alors qu’une voix locale existe. Le sous-titre ne remplace pas fonctionnellement une consigne sonore pour un non-lecteur. Le mode silencieux retire tous les exercices de la première leçon. L’interface ne vérifie pas clairement que le cache et les consignes audio sont prêts avant de promettre le fonctionnement hors ligne.

Fais du fonctionnement strictement local le comportement par défaut, y compris lorsqu’une ancienne préférence désigne une voix distante. Ne fais pas de repli silencieux vers un service distant. Conserve les fichiers audio et les enregistrements locaux. Sans voix locale utilisable, indique la situation à l’adulte et propose une configuration compréhensible ; ne prétends pas que tout est opérationnel. N’ajoute pas de service de synthèse distant pour contourner le problème.

Ajoute un diagnostic adulte : disponibilité de la voix française locale, lecture audio effectivement déclenchée par un geste, état du téléchargement et état « prêt hors ligne ». Vérifie l’installation du service worker et traite ses échecs. Prévois le premier téléchargement interrompu et le retour du réseau sans casser une version déjà installée.

Pour les activités nécessitant l’écoute, rends le mode silencieux cohérent : orientation vers un casque/son ou activité adaptée, sans exercice impossible ni copie de la réponse par le sous-titre. Distingue le lecteur d’écran du mode silencieux.

Réécris les promesses de confidentialité pour refléter exactement le comportement. Retire la conclusion automatique selon laquelle l’absence de compte implique l’absence de traitement de données côté école ; décris les faits et la vérification attendue avec le DPO. Ne présente pas cette correction de texte comme une certification juridique.

Tests : aucune voix locale ; préférence distante ancienne avec et sans voix locale ; synthèse absente ; cache incomplet ; fichier manquant ; réouverture sans réseau ; mode silencieux à l’étape 0 ; lecteur d’écran. Ne déduis pas une validation iPhone physique d’un test Chromium ou WebKit.
```

## Lot 3 — Corriger les modales et la navigation accessible des adultes

```text
Traite A04 et la partie accessibilité d’A12. Examine js/ui/overlay.js, js/ui/cards.js, js/ui/elo.js, js/ui/router.js et les onglets de js/screens/adult.js.

Reproduction : ouvrir une carte gagnée puis faire Maj+Tab depuis « Retourner la carte ». Le focus atteint une carte de la collection derrière la modale. Échap ne ferme alors plus la fenêtre. aria-modal=true ne rend pas l’arrière-plan inerte à lui seul.

Implémente une modale complète, de préférence avec dialog.showModal() si adapté aux navigateurs cibles : focus initial, confinement, arrière-plan inerte, Échap, bouton explicite de fermeture et restitution du focus au déclencheur ou à un élément logique. Préserve le retour navigateur qui ferme une fenêtre et les promesses closed utilisées par le bilan. Nettoie les écouteurs à la fermeture et gère les ouvertures successives.

Pour les onglets adultes, implémente le modèle tablist/tab/tabpanel avec associations et navigation clavier attendues, ou utilise une navigation simple dont la sémantique correspond réellement au comportement. Le changement d’onglet ne doit pas perdre le contexte de l’enfant consulté.

Tests : Tab/Maj+Tab à tous les bords, Échap, retour navigateur, fermeture avant/après retournement, promotion, ouverture suivante, déclencheur disparu, visite adulte au clavier. Complète les contrôles automatisés par une procédure de vérification VoiceOver/TalkBack ; ne revendique pas une conformité complète sur la seule base d’axe.
```

## Lot 4 — Fiabiliser les tests navigateur et leur couverture

```text
Traite A06. Lors de l’audit, les 97 tests unitaires passaient et 19 des 20 tests navigateur passaient. Le test « au clavier seul » échouait aussi seul. Son nombre fixe de tours de boucle consomme des Tab pendant les transitions. Un parcours complémentaire attendant les choix réussissait quatre réponses au clavier.

Reproduis d’abord sur l’environnement actuel. Corrige tests/e2e/smoke.test.mjs pour attendre les états observables de la leçon, avec un délai total raisonnable, plutôt qu’un nombre arbitraire de tabulations. Vérifie réellement la navigation et le focus : démarrage, choix, correction, question suivante, bilan et carte. Rends les cas de succès/erreur reproductibles au moyen des mécanismes de génération existants ou d’une préparation de test appropriée.

Ne masque pas un éventuel défaut de l’application par un clic forcé, un focus direct sur chaque réponse ou une assertion plus faible. Les focus directs ne doivent servir qu’à la préparation initiale du scénario clavier.

Renforce les tests des scénarios à risque : panne de stockage, deux pages, restauration, modales, mode silencieux débutant et installation hors ligne incomplète, en réutilisant les tests ajoutés par les lots précédents. Donne de la visibilité aux impacts axe minor/moderate et aux résultats nécessitant une vérification manuelle, sans les confondre avec une violation confirmée.

Ajoute un parcours WebKit limité en CI si son coût est raisonnable. Documente la matrice d’appareils physiques restant à tester, surtout iPhone/iPad et Android pour le son. Critère final : suite complète verte, aucun contrôle retiré pour cacher un échec, procédure de reproduction et limites clairement documentées.
```

## Lot 5 — Rendre la restauration et l’effacement cohérents

```text
Traite A08, A09 et l’assainissement des données d’A12. Examine js/core/schema.js, js/services/store.js, js/services/recordings.js et l’onglet Données de js/screens/adult.js.

Reproductions :
- Un export contenant dailyMinutes=15, importé sur un appareil vierge, laisse dailyMinutes=0.
- « Tout effacer sur cet appareil » conserve les sons enregistrés dans IndexedDB.
- mostAdvanced() choisit une copie entière ; ce n’est pas une fusion de profils divergents.

Définis et présente deux usages : ajouter des profils et restaurer un appareil. Pour chaque usage, indique les réglages appliqués ou conservés. Restaure les données promises, y compris dailyMinutes dans le mode approprié. Ne restaure pas implicitement un PIN adulte depuis un fichier non prévu pour cela.

Ajoute une validation des réglages de l’appareil et des limites documentées de taille de fichier/nombre d’éléments avant traitement. Conserve les migrations existantes. Pour deux copies divergentes, présente les différences et évite de promettre une fusion sans perte si elle n’est pas assurée.

Précise le périmètre de l’export : profils seuls ou sauvegarde complète incluant les sons. Si une sauvegarde complète est proposée, définis son format versionné et teste son aller-retour. Pour « tout effacer », inclue les stockages annoncés et attends leur résultat ; gère une suppression IndexedDB échouée. Révoque les URL de blobs remplacées et évite de laisser le micro actif après une erreur ou un abandon.

Tests : appareil vierge, appareil configuré, import ancien/invalide/surdimensionné, conflit de copies, effacement suivi d’une réouverture et vérification directe d’IndexedDB. Actualise guide et confidentialité selon le résultat exact.
```

## Lot 6 — Compter correctement le temps actif et appliquer les pauses

```text
Traite A07. La limite quotidienne est surtout vérifiée à l’entrée de la leçon ; le temps est ajouté à sa fin. commitPartial() ne compte pas les séances de moins de trois réponses. Le tracé a un autre mécanisme.

Unifie la comptabilisation du temps actif pour les leçons, révisions et jeux de tracé. Enregistre des deltas de manière idempotente, à intervalles raisonnables et lors des changements de visibilité/navigation. Préserve l’exclusion des longues périodes d’inactivité ; n’utilise pas un intervalle qui compte une tablette abandonnée comme du travail.

Lorsqu’une limite définie par l’adulte est atteinte, termine l’explication ou la question en cours puis propose une pause claire avant de commencer une nouvelle activité. Le contrôle doit s’appliquer pendant les longues séances, sans perte de réponse ni double bilan. Si le produit choisit un rappel flexible plutôt qu’un plafond, nomme-le et explique-le correctement.

Tests avec horloge contrôlée : sortie après zéro, une ou deux réponses ; sortie après plusieurs réponses ; veille/reprise ; changement de jour local et d’heure ; retour arrière ; fin normale ; dépassement au milieu d’une séance ; navigation pendant une correction. Le temps total et le temps par jour doivent rester cohérents et ne jamais être ajoutés deux fois.
```

## Lot 7 — Rendre tous les diplômes gagnés consultables

```text
Traite A10. catalogue() crée des cartes kind='diplome', mais les sections de js/screens/collection.js ne rendent que son, exploit et titre. Un diplôme est compté dans le total possédé mais invisible dans la grille.

Ajoute une section Diplômes avec les cartes du catalogue, leurs noms accessibles et le même parcours d’ouverture/fermeture que les autres récompenses. Vérifie la cohérence du compteur et de la grille, y compris après rechargement et import d’un profil ancien. Ne modifie pas les conditions pédagogiques de gain dans ce lot.

Validation ciblée : profil avec diplôme gagné, profil sans diplôme, tous les diplômes et navigation clavier vers une carte. Respecte la correction des modales du lot 3. Évite une refonte visuelle générale pour cette correction.
```

## Lot 8 — Clarifier les affectations et les profils de classe

```text
Traite A11. L’étape de classe ouvre des nœuds mais ne devient pas l’activité proposée par Jouer ; terminer une étape future ne fait pas avancer l’étape individuelle. Les seize animaux peuvent être choisis plusieurs fois et « Nouveau » reste accessible aux élèves.

Définis trois concepts distincts : étape autorisée, activité assignée et compétence acquise. Implémente une affectation adulte explicite, pour un enfant ou un groupe, que le bouton Jouer propose sans déclarer les prérequis maîtrisés automatiquement. Préserve le parcours individuel et les révisions nécessaires. Explique à l’adulte ce qui se passera après une affectation terminée.

Ajoute un mode classe qui protège la création/modification des profils selon le verrou adulte existant. Offre à trente élèves au moins des identifiants visuels distinguables, par combinaison animal/symbole/forme/couleur, sans utiliser la couleur seule et sans exiger la lecture du prénom. Conserve les profils existants et leurs animaux.

Rends la sélection de classe utilisable sur tablette partagée : grandes cibles, recherche adulte si utile, aucun classement public et changement d’élève qui applique correctement ses réglages. Tests : trente profils, animaux identiques, élève non lecteur, PIN actif, affectation au-delà du chemin individuel et retour aux révisions après l’activité.
```

## Lot 9 — Distinguer effort, aménagement et maîtrise par compétence

```text
Mets en œuvre une première version limitée de B01/B02 après avoir vérifié les fonctions du moteur. Le projet ouvre une étape après deux essais même échoués ; finishModule() considère toutes les réponses help comme justes pour valider un contrôle. Les aides sont très différentes : lire une consigne, lire un passage, rappeler une règle ou montrer le mot suivant.

Écris une courte spécification dans le dépôt, puis implémente un incrément cohérent : observations par compétence et catégorie d’aide, séparées des récompenses d’effort. Préserve la bienveillance et l’accès à la découverte. Une étape accessible ne doit plus être assimilée à une maîtrise démontrée.

Distingue au minimum : vu/pratiqué, réussite autonome, réussite avec aménagement identifié, guidage donnant la réponse et confirmation différée. Une compréhension après lecture audio peut être reconnue comme telle ; elle ne démontre pas automatiquement le décodage autonome. L’utilisation d’un lecteur d’écran ne doit pas être traitée indistinctement comme une erreur.

Garde le record visible et les cartes existantes. Ne réinterprète pas les anciennes données comme une preuve d’autonomie lorsque l’information n’a pas été enregistrée : utilise un état historique/inconnu. Prévois une migration versionnée et des identifiants de compétences stables. Corrige la grille des sons pour qu’un phonème partagé ne valide pas implicitement toutes ses graphies.

Fais apparaître dans le tableau adulte quelques besoins précis et la raison d’une révision. Les seuils initiaux doivent être documentés comme règles de conception non étalonnées, sans équivalence inventée avec un niveau scolaire ou un diagnostic. Teste les transitions, aides répétées, copies anciennes et conservation des récompenses. Ne prétends pas établir scientifiquement l’efficacité par des tests unitaires.
```

## Lot 10 — Renforcer les contenus, la compréhension et leur traçabilité

```text
Traite B03/B04/B05 par un premier ensemble de contenus et un processus de validation durable. Préserve le moteur actuel de décodabilité.

Ajoute aux contenus des identifiants stables, compétences, prérequis, sources officielles précises/datées, objectifs, explications et statut de relecture. Construis une matrice des attendus couverts et manquants pour les niveaux annoncés. Vérifie les programmes applicables à la date de mise en œuvre ; ne considère pas qu’une mention générale du BO prouve la couverture.

Crée une première petite série de mini-récits progressifs et décodables avec vocabulaire explicable, compréhension littérale et inférences accessibles. Les illustrations ou les réponses audio ne doivent pas donner implicitement la solution au test de lecture. Prévois lecture autonome, aide à la demande et modalités de reprise. Valide automatiquement chaque graphème contre les prérequis, les distracteurs et l’intégrité des questions. Sépare le texte entendu pour la compréhension orale du texte lu pour la compréhension écrite.

Documente la relecture humaine requise avant de présenter les nouveaux contenus comme validés ; n’invente pas l’approbation d’un enseignant ou orthophoniste. Prépare également l’inventaire des sons et consignes encore synthétisés et le processus d’écoute humaine, de licence et de contrôle qualité des futurs enregistrements. Ne télécharge ou ne publie pas un corpus sans licence vérifiée.

Pour le tracé, distingue couverture de forme et geste d’écriture. Prépare un modèle avec départ/sens du tracé, mais marque les formes non relues comme provisoires plutôt que d’en faire un critère scolaire certain.

Livrables : schéma de contenu, validateurs utiles, contenus initiaux relisibles, matrice honnête de couverture et liste précise de validations humaines restantes. Garde les données et la voix sur l’appareil. Une évaluation automatique de la lecture orale ou un service d’IA distant n’est pas demandé dans ce lot.
```

## Lot 11 — Rendre le bilan adulte actionnable et adapter la présentation aux grands

```text
Travaille sur l’expérience décrite dans les sections 5 et 6 de l’audit, en utilisant les nouvelles observations par compétence si le lot 9 est terminé.

Conserve un accueil enfant simple avec une action principale. Ajoute au choix une présentation plus sobre pour les adolescents en difficulté, indépendante de leur niveau de lecture. Le choix de l’âge ne doit pas imposer une difficulté ni empêcher un grand débutant de travailler les sons de base.

Réorganise le bilan adulte autour de trois questions : ce qui progresse, les difficultés récentes et la prochaine action utile. Propose des activités courtes hors écran et des affectations ciblées ; affiche les données insuffisantes au lieu d’une conclusion certaine. Les courbes doivent avoir des équivalents textuels ou tabulaires accessibles. Évite les classements entre élèves et toute étiquette diagnostique.

Vérifie les écrans à 320/390 pixels, sur tablette et au zoom, dans les trois univers et avec les réglages de confort. Rends les célébrations passables et respecte la réduction des mouvements. Priorise les images dont l’ambiguïté a été identifiée ; ne remplace pas tout le corpus d’émojis sans nécessité.

Prépare un protocole bref de test d’usage avec adultes/enfants : démarrage audio, autonomie, compréhension des pictogrammes, erreurs, fatigue, reprise et compréhension du bilan. Distingue ce pilote d’usage d’une étude d’efficacité. Termine avec les changements vérifiés et les hypothèses qui demandent encore une observation humaine.
```

## Comment juger le résultat de chaque lot

Une amélioration est terminée lorsque le problème initial est reproduit puis corrigé, que les critères du lot sont vérifiés, que les profils existants restent utilisables et que la documentation décrit les limites réelles. Un nombre de tests élevé, un nouveau design ou davantage de questions ne suffisent pas à eux seuls.

Après les lots de fiabilité, organiser un pilote réel avant d’élargir fortement le contenu. Mesurer la réussite autonome, la rétention et le transfert sur des éléments nouveaux, en plus de l’agrément et de la facilité d’usage. Les programmes officiels, les tests techniques et l’évaluation des apprentissages répondent à des questions différentes.
