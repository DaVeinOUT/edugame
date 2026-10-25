# Kaya : compagnon vivant et vraie 3D

## Intention

Kaya devient un petit personnage entier qui accompagne l’enfant dans EDUCA : présence douce, expressions compréhensibles et réactions liées à l’activité. L’inspiration demandée est la présence d’un compagnon animé de ChatGPT. Le personnage et ses fichiers restent originaux ; il n’est pas nécessaire de copier un compagnon existant ni de modifier les réglages de ChatGPT.

Le jeu a reçu un prototype procédural, puis un candidat GLB riggé avec source Blender et huit clips. Le cahier ci-dessous reste la cible artistique et comportementale. La [procédure de production](production/MODEL-PIPELINE.md), la [fiche de personnage](production/CHARACTER-SHEET.md) et [PROGRESS.md](../../workflow/PROGRESS.md) distinguent les livrables vérifiés de la validation artistique finale.

## Identité visuelle à conserver

Bébé jaguar doré, rosettes sombres reconnaissables, oreilles rondes, museau court, grands yeux chauds et silhouette compacte. Le corps, les petites pattes et la queue doivent être visibles dans les scènes de compagnon. Les marques du visage, proportions et couleurs doivent rester stables entre le modèle, le repli 2D et les cartes. Établir une référence de face, trois quarts, profil et dos avant de produire de nombreux assets.

Référence disponible : [Kaya découvrant son premier livre](../cartes-ia/images/exploit-premiere-lecon-source-v1.png). C’est une source artistique, pas un modèle à simplement renommer en GLB.

## Comportements attendus

| Situation réelle | Réaction proposée | Limite de l’interaction |
| --- | --- | --- |
| Arrivée à l’accueil | Se réveille, regarde l’enfant et salue de la patte | Une salutation courte, pas à chaque navigation |
| Activité en cours | S’assoit calmement, respire et cligne doucement | Ne suit pas chaque mouvement du doigt et ne distrait pas |
| Consigne audio | Regarde la zone utile, mouvement de bouche discret | Synchronisé à l’audio réel autant que possible |
| Aide demandée | S’approche de sa zone d’aide, écoute puis explique | L’aide reste identifiée ; aucun indice caché dans le regard |
| Réussite | Sourire, petite réaction joyeuse | Brève, passable et proportionnée |
| Erreur | Attitude calme et encouragement lié à l’explication | Pas de tristesse culpabilisante ni de reproche |
| Nouvelle carte | Découvre la carte avec l’enfant | Laisse le focus et les boutons utilisables |
| Pause ou inactivité | S’étire ou se repose silencieusement | Aucun appel insistant pour revenir |
| Clic/touche sur Kaya | Réaction facultative et accès à « Réécouter », « Aide », « Se reposer » | Toucher Kaya n’est pas nécessaire pour réussir |

Prévoir au minimum les états `idle`, `greeting`, `attentive`, `speaking`, `helping`, `celebrating`, `resting` et `hidden/paused`. Définir transitions et priorités pour éviter deux voix, une célébration tardive après changement d’écran ou des sauts d’humeur. Le comportement est déterministe et testable à partir des événements du jeu ; aucun modèle conversationnel distant n’est requis.

## Présence dans l’interface

Sur l’accueil, Kaya peut apparaître entier près de sa bulle. Pendant un exercice, il reste dans une zone prévue, plus petit et plus calme. Sur téléphone, prévoir un mode compact ou replié qui ne couvre ni le mot, ni les réponses, ni les sous-titres, ni le bouton Continuer. Une position déplaçable est facultative ; elle ne remplace pas une bonne position par défaut. Offrir une façon de le masquer ou de limiter ses animations.

Les commandes accessibles restent des contrôles DOM avec noms explicites. Le canevas décoratif n’a pas besoin d’être un obstacle dans l’ordre de tabulation. Les changements d’état ne doivent pas être tous annoncés ; seules les informations utiles à la tâche le sont. Le jeu reste jouable sans percevoir l’animation.

## Contrat technique proposé

Séparer trois responsabilités, en adaptant les noms au code existant :

1. **Contrôleur** : reçoit les événements du jeu et choisit état/action avec priorités et délais bornés.
2. **Interface de rendu commune** : montage, mise à jour d’état, pause, reprise, destruction.
3. **Renderers** : scène 3D locale et affichage 2D/SVG de secours consommant le même état.

Ne pas remplacer tous les portraits du jeu par un canevas indépendant qui garde sa propre boucle de rendu. Gérer le cycle de vie et le partage des ressources ; pas d’accumulation de scènes après plusieurs navigations.

Une solution Three.js isolée est possible, avec version fixée et distribution locale, si elle apporte le rendu nécessaire. Les [outils officiels de Three.js](https://threejs.org/docs/) incluent chargement glTF et animation ; vérifier les API de la version effectivement retenue. Un autre moteur est possible avec justification de poids, compatibilité et maintenance. Ne pas charger l’outil depuis un CDN dans une application annoncée hors ligne.

## Modèle et animations

Inventorier les outils disponibles avant de promettre un asset. La cible de production est un modèle exportable en GLB, avec rig et clips nommés ; un prototype procédural est possible s’il est réellement 3D et annoncé comme provisoire. Conserver sa source ou le procédé reproductible de création, sa provenance et sa licence. Une génération d’images peut aider à produire une fiche de personnage ou un sprite de secours ; elle ne produit pas automatiquement un maillage, une topologie propre et des animations.

Clips souhaités pour le premier prototype : repos, salut, attention, parole approximative, joie, encouragement, étirement/repos. Favoriser un matériau stylisé et des textures légères plutôt qu’une fourrure simulée coûteuse. Une bouche approximative liée à l’état de parole ne doit pas être annoncée comme une synchronisation phonémique exacte.

Objectifs initiaux à mesurer, pas résultats déjà acquis : un seul compagnon actif ; densité de pixels plafonnée ; rendu arrêté en arrière-plan et hors écran ; textures limitées ; cadence stable sur la tablette cible ; poids du paquet documenté avant installation. Choisir les budgets précis après un prototype mesuré.

## Tolérance aux pannes et confort

Le chargement du modèle ne bloque pas le démarrage d’une leçon. Modèle manquant, panne réseau, échec de décodage ou perte de contexte WebGL déclenchent un repli immédiat. Réduction des mouvements et mode discret doivent être effectifs, y compris dans les clips et l’attente. À la destruction, arrêter les timers/animations, détacher les écouteurs et libérer les ressources graphiques propres au renderer.

Les préférences visuelles peuvent suivre le profil, avec migration et valeurs par défaut. Le compagnon n’a pas de jauge de faim ou de tristesse qui se dégrade en l’absence de l’enfant. Les activités restent la source des progrès ; l’attachement au personnage ne devient pas une obligation de jouer.

## Critères pour annoncer le prototype terminé

- Personnage entier reconnaissable dans le parcours réel, pas uniquement sur une page de démonstration.
- Plusieurs réactions distinctes liées aux vrais événements ; aucune consigne audio en double ou réaction tardive après départ.
- Vrai modèle/scène 3D avec source et provenance identifiées ; distinction explicite avec le repli 2D.
- Affichage compact sur petit écran, boutons et contenu entièrement utilisables.
- Navigation répétée sans accumulation de boucles ou ressources ; pause en arrière-plan vérifiée.
- Fallback sans WebGL/modèle, clavier et réduction des mouvements vérifiés.
- Assets et dépendances servis localement, inclus dans le build et la stratégie hors ligne.
- Tests du moteur et parcours pertinents exécutés ; limites matérielles ou validations humaines encore nécessaires consignées.

La conception du compagnon peut avancer en parallèle des corrections de fiabilité, mais son intégration ne doit pas réintroduire de perte de données, de voix distante implicite ou d’activité impossible sans audio.
