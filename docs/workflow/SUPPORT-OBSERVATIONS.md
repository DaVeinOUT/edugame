# Traçabilité des aides — lot 6

Les réponses instrumentées portent un relevé local versionné. Le journal du
profil conserve au plus les 128 dernières réponses documentées, identifiées par
un événement unique. Chaque entrée garde la question, son type, l’issue évaluée
et le nombre de demandes de chaque support.

- `instruction-replay` : réécoute demandée d’une consigne.
- `option-audio` : écoute demandée d’une option.
- `text-audio` : lecture demandée du texte.
- `screen-reader` : mode lecteur d’écran déclaré dans le profil.
- `explicit-help` : aide explicite demandée.
- `construction-hint` : guidage proposé dans une construction.

Il s’agit d’une observation des demandes, pas d’une preuve qu’un son a été
entendu ou qu’une compétence est maîtrisée. Un aménagement audio ne devient pas
automatiquement une erreur ou une aide évaluée. `outcome`, SRS, Élo, étoiles,
cartes et règles de gain restent calculés comme auparavant.

Le relevé est réinitialisé avant chaque question et fermé au premier
enregistrement de la réponse. Une correction ou une demande tardive ne modifie
pas rétroactivement ce relevé. Un ancien résultat sans métadonnées reste non
détaillé ; il n’est jamais reclassé comme lecture autonome. La réussite sans
support enregistré ne prouve pas l’absence d’une aide humaine hors application.

L’import réunit les événements par identifiant et conserve la limite du journal.
Comme les compteurs historiques importés sont conservés par maximum, deux
journaux divergents peuvent contenir davantage d’événements que ce compteur :
l’interface signale ce cas et n’affiche pas de faux pourcentage de couverture.

Le panneau adulte et le CSV de classe exposent les réussites sans support
enregistré, avec réécoute, avec support audio demandé ou guidées, ainsi que le
périmètre et le reliquat d’historique non détaillé. Aucune interprétation
professionnelle n’est attribuée à ces données.

Sources : `js/core/support.js`, `session.js`, `schema.js`, `report.js`, activités
et intégration de la leçon. Vérifications du lot : 145 tests unitaires et 39 parcours navigateur réussis dans une copie isolée
exacte de l’index (dont quatre nouveaux parcours). Journaux sous
`docs/verification/2026-10-25/aides/`. Cache de cette livraison
`educa-95321c8aa6`, 377 fichiers.
