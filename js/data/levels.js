/* ============================================================
   DATA/LEVELS.JS — Les niveaux des grands (CE1 → 3e)
   Après le chemin des 66 sons : lire et comprendre, orthographe,
   grammaire, conjugaison, vocabulaire. Données pures, lues par
   js/core/levels.js et vérifiées par tests/unit/levels.test.mjs.

   Programmes visés (détail et sources : rapports/2026-10-13-niveaux-ce1-3e.md) :
   • n3 CE1-CE2 : cycle 2, BO spécial n° 41 du 31 octobre 2024 ;
   • n4 CM1-CM2 et n5 (6e) : cycle 3, BO n° 16 du 17 avril 2025 ;
   • n5 (5e) : cycle 4, arrêté du 18 février 2026 (BO n° 10 du 5 mars 2026) ;
   • n6 4e-3e : programme de 2015 ajusté (en vigueur en 4e-3e en 2026-2027)
     et programme de 2026 (en 4e en 2027, en 3e en 2028).

   Conventions d'écriture (tout est lu par Kaya) :
   • apostrophe typographique ’ ; guillemets « » avec espaces ;
     espace avant ! ? ; : ; aucun crochet [ ] (réservé aux sons) ;
   • explain : une phrase bienveillante, jamais « non », « faux »,
     « raté », « mauvais », « nul » : on montre la bonne réponse ;
   • intro : 2 ou 3 phrases de 12 mots au plus, avec un exemple ;
   • order : les mots dans l'ordre de la bonne réponse (le jeu mélange) ;
   • pick : le mot à toucher n'apparaît qu'une fois dans la phrase.
   ============================================================ */

export const LEVELS = [
  { id: 'n3', name: 'Lire et comprendre', grade: 'CE1-CE2', unlockElo: 1000,
    intro: 'Bravo, tu sais lire tous les sons ! Maintenant, on va comprendre les phrases et bien écrire les petits mots. À la fin, un contrôle t’ouvrira le niveau suivant.' },
];

export const MODULES = [
  // ───────────── Niveau n3 · CE1-CE2 · Lire et comprendre ─────────────
  { id: 'n3-comprendre', level: 'n3', order: 1, skill: 'comprehension', title: 'Comprendre une phrase', difficulty: 1,
    intro: 'Pour comprendre une phrase, cherche qui agit et ce qu’il fait. Exemple : « Le chat boit du lait. » C’est le chat qui boit.',
    items: [
      { type: 'choice', text: 'Moussa lance le ballon à Inès. Qui lance le ballon ?', choices: ['Moussa', 'Inès', 'le ballon'], answer: 'Moussa', explain: 'C’est Moussa qui lance : le ballon va vers Inès.' },
      { type: 'choice', text: 'Le colibri boit dans la fleur. Où boit le colibri ?', choices: ['dans la fleur', 'dans la rivière', 'dans un verre'], answer: 'dans la fleur', explain: 'La phrase dit « dans la fleur » : le colibri boit le nectar des fleurs.' },
      { type: 'choice', text: 'Demain, Léa ira au marché avec sa mamie. Quand Léa ira-t-elle au marché ?', choices: ['demain', 'hier', 'aujourd’hui'], answer: 'demain', explain: 'Le mot « demain » dit quand : c’est le jour d’après.' },
      { type: 'choice', text: 'Tom prend un parapluie, car il pleut. Pourquoi Tom prend-il un parapluie ?', choices: ['parce qu’il pleut', 'parce qu’il fait chaud', 'parce qu’il a faim'], answer: 'parce qu’il pleut', explain: 'Le mot « car » annonce la raison : il pleut.' },
      { type: 'gap', text: 'Il fait nuit : Kenza allume la ___.', choices: ['lampe', 'pomme', 'plage'], answer: 'lampe', explain: 'Quand il fait nuit, on allume une lampe pour y voir.' },
      { type: 'gap', text: 'Le boulanger fait du ___ tous les matins.', choices: ['pain', 'lait', 'sable'], answer: 'pain', explain: 'Le boulanger fabrique le pain avec de la farine.' },
      { type: 'text', passage: 'Teva habite à Tahiti. Le samedi, il va à la plage avec son papa. Ils nagent dans le lagon. Ils regardent des poissons de toutes les couleurs.',
        questions: [
          { text: 'Où habite Teva ?', choices: ['à Tahiti', 'à Paris', 'en Guyane'], answer: 'à Tahiti', explain: 'La première phrase dit : « Teva habite à Tahiti. »' },
          { text: 'Avec qui va-t-il à la plage ?', choices: ['avec son papa', 'avec sa maman', 'avec son chien'], answer: 'avec son papa', explain: 'Le texte dit qu’il va à la plage avec son papa.' },
          { text: 'Quel jour va-t-il à la plage ?', choices: ['le samedi', 'le lundi', 'le dimanche'], answer: 'le samedi', explain: 'La deuxième phrase commence par « Le samedi ».' },
        ] },
      { type: 'choice', text: 'Quelle phrase pose une question ?', choices: ['Tu viens jouer ?', 'Tu viens jouer.', 'Viens jouer.'], answer: 'Tu viens jouer ?', explain: 'Le point d’interrogation montre qu’on pose une question.' },
      { type: 'order', words: ['Ma', 'sœur', 'lit', 'un', 'livre'], answer: 'Ma sœur lit un livre.', explain: 'On dit d’abord qui agit, puis ce qu’elle fait : ma sœur lit un livre.' },
      { type: 'order', words: ['Nous', 'mangeons', 'une', 'mangue', 'sucrée'], answer: 'Nous mangeons une mangue sucrée.', explain: 'La phrase commence par « Nous », puis vient le verbe « mangeons ».' },
      { type: 'pick', text: 'Le petit chien noir aboie.', prompt: 'Touche le mot qui dit la couleur.', answer: 'noir', explain: '« noir » dit la couleur du chien.' },
      { type: 'pick', text: 'Après l’école, Malik joue au football.', prompt: 'Touche le mot qui dit qui joue.', answer: 'Malik', explain: 'C’est Malik qui joue au football.' },
      { type: 'text', passage: 'Ce matin, il pleut très fort. Inès prend son parapluie jaune. Dans la rue, elle saute dans les flaques. Ses bottes sont toutes mouillées !',
        questions: [
          { text: 'Quel temps fait-il ?', choices: ['Il pleut.', 'Il fait beau.', 'Il neige.'], answer: 'Il pleut.', explain: 'La première phrase dit qu’il pleut très fort.' },
          { text: 'Qu’est-ce qu’Inès prend ?', choices: ['son parapluie', 'son vélo', 'son goûter'], answer: 'son parapluie', explain: 'Le texte dit : « Inès prend son parapluie jaune. »' },
          { text: 'Pourquoi ses bottes sont-elles mouillées ?', choices: ['Elle a sauté dans les flaques.', 'Elle les a lavées.', 'Elle est allée à la piscine.'], answer: 'Elle a sauté dans les flaques.', explain: 'Inès saute dans les flaques : l’eau mouille ses bottes.' },
        ] },
      { type: 'choice', text: 'Quelle phrase veut dire la même chose que « Le bébé dort » ?', choices: ['Le bébé fait dodo.', 'Le bébé mange.', 'Le bébé pleure.'], answer: 'Le bébé fait dodo.', explain: '« Faire dodo », c’est dormir, en langage de bébé.' },
    ] },

  { id: 'n3-homophones-a', level: 'n3', order: 2, skill: 'orthographe', title: 'a ou à', difficulty: 2,
    intro: 'Si tu peux dire « avait », écris « a » sans accent. Sinon, écris « à » avec l’accent. Exemple : Léa a un chat, car Léa avait un chat.',
    items: [
      { type: 'gap', text: 'Léa ___ un vélo rouge.', choices: ['a', 'à'], answer: 'a', explain: '« a » vient du verbe avoir : on peut dire « Léa avait un vélo rouge ».' },
      { type: 'gap', text: 'Nathan va ___ la piscine.', choices: ['a', 'à'], answer: 'à', explain: 'On ne peut pas dire « Nathan va avait la piscine » : on écrit « à » avec l’accent.' },
      { type: 'gap', text: 'Mon cousin ___ sept ans.', choices: ['a', 'à'], answer: 'a', explain: 'On peut dire « Mon cousin avait sept ans » : c’est le verbe avoir.' },
      { type: 'gap', text: 'Elle parle ___ sa grand-mère.', choices: ['a', 'à'], answer: 'à', explain: 'On ne peut pas dire « Elle parle avait sa grand-mère » : on écrit « à ».' },
      { type: 'gap', text: 'Ce gâteau ___ la mangue est délicieux.', choices: ['a', 'à'], answer: 'à', explain: '« à la mangue » dit avec quoi le gâteau est fait : on écrit « à ».' },
      { type: 'gap', text: 'Kenza ___ perdu sa gomme.', choices: ['a', 'à'], answer: 'a', explain: 'On peut dire « Kenza avait perdu sa gomme » : c’est le verbe avoir.' },
      { type: 'gap', text: 'Nous allons ___ Cayenne en avion.', choices: ['a', 'à'], answer: 'à', explain: 'On ne peut pas dire « Nous allons avait Cayenne » : on écrit « à », avec l’accent.' },
      { type: 'gap', text: 'Le chien ___ une balle dans la gueule.', choices: ['a', 'à'], answer: 'a', explain: 'On peut dire « Le chien avait une balle » : c’est le verbe avoir.' },
      { type: 'gap', text: 'Je joue ___ cache-cache avec mes amis.', choices: ['a', 'à'], answer: 'à', explain: 'On joue « à » un jeu : on écrit « à » avec l’accent.' },
      { type: 'pick', text: 'Papa a un rendez-vous à midi.', prompt: 'Touche le verbe avoir.', answer: 'a', explain: 'On peut dire « Papa avait un rendez-vous » : « a » est le verbe avoir.' },
      { type: 'choice', text: 'Quelle phrase est bien écrite ?', choices: ['Il va à la plage.', 'Il va a la plage.'], answer: 'Il va à la plage.', explain: 'On ne peut pas dire « Il va avait la plage » : il faut l’accent sur « à ».' },
      { type: 'choice', text: 'Quelle phrase est bien écrite ?', choices: ['Zoé à un chat.', 'Zoé a un chat.'], answer: 'Zoé a un chat.', explain: 'On peut dire « Zoé avait un chat » : c’est le verbe avoir, sans accent.' },
      { type: 'text', passage: 'Ce matin, Yanis a mal au ventre. Il reste à la maison. Sa maman a appelé le docteur. Le docteur arrive à dix heures.',
        questions: [
          { text: 'Dans « Yanis a mal au ventre », quel mot est le verbe avoir ?', choices: ['a', 'au', 'mal'], answer: 'a', explain: 'On peut dire « Yanis avait mal au ventre » : « a » est le verbe avoir.' },
          { text: 'Qui a appelé le docteur ?', choices: ['sa maman', 'Yanis', 'son papa'], answer: 'sa maman', explain: 'Le texte dit : « Sa maman a appelé le docteur. »' },
          { text: 'À quelle heure arrive le docteur ?', choices: ['à dix heures', 'à midi', 'à huit heures'], answer: 'à dix heures', explain: 'La dernière phrase dit que le docteur arrive à dix heures.' },
        ] },
      { type: 'gap', text: 'Il ___ peur du noir.', choices: ['a', 'à'], answer: 'a', explain: 'On peut dire « Il avait peur du noir » : c’est le verbe avoir.' },
      { type: 'order', words: ['Kevin', 'a', 'mal', 'à', 'la', 'tête'], answer: 'Kevin a mal à la tête.', explain: '« a » est le verbe avoir, puis « à la tête » dit où Kevin a mal.' },
    ] },

  { id: 'n3-homophones-et', level: 'n3', order: 3, skill: 'orthographe', title: 'et ou est', difficulty: 2,
    intro: 'Si tu peux dire « était », écris « est ». Si tu peux dire « et puis », écris « et ». Exemple : le chat est noir et blanc.',
    items: [
      { type: 'gap', text: 'Le ciel ___ tout bleu.', choices: ['et', 'est'], answer: 'est', explain: 'On peut dire « Le ciel était tout bleu » : c’est le verbe être.' },
      { type: 'gap', text: 'J’aime les mangues ___ les ananas.', choices: ['et', 'est'], answer: 'et', explain: 'On peut dire « les mangues et puis les ananas » : « et » relie deux mots.' },
      { type: 'gap', text: 'Ma sœur ___ malade aujourd’hui.', choices: ['et', 'est'], answer: 'est', explain: 'On peut dire « Ma sœur était malade » : c’est le verbe être.' },
      { type: 'gap', text: 'Il prend son sac ___ il part.', choices: ['et', 'est'], answer: 'et', explain: 'On peut dire « et puis il part » : « et » relie deux actions.' },
      { type: 'gap', text: 'La soupe ___ trop chaude.', choices: ['et', 'est'], answer: 'est', explain: 'On peut dire « La soupe était trop chaude » : c’est le verbe être.' },
      { type: 'gap', text: 'Hugo ___ Sarah jouent aux billes.', choices: ['et', 'est'], answer: 'et', explain: '« et » relie les deux prénoms, Hugo et Sarah.' },
      { type: 'gap', text: 'Ce livre ___ à moi.', choices: ['et', 'est'], answer: 'est', explain: 'On peut dire « Ce livre était à moi » : c’est le verbe être.' },
      { type: 'gap', text: 'Il fait chaud ___ le soleil brille.', choices: ['et', 'est'], answer: 'et', explain: 'On peut dire « et puis le soleil brille » : « et » relie deux idées.' },
      { type: 'gap', text: 'Mon oncle ___ pêcheur en Martinique.', choices: ['et', 'est'], answer: 'est', explain: 'On peut dire « Mon oncle était pêcheur » : c’est le verbe être.' },
      { type: 'pick', text: 'La mer est calme et douce.', prompt: 'Touche le verbe être.', answer: 'est', explain: 'On peut dire « La mer était calme » : « est » vient du verbe être.' },
      { type: 'pick', text: 'Le chat est noir et blanc.', prompt: 'Touche le mot qui relie les deux couleurs.', answer: 'et', explain: 'Le petit mot « et » relie « noir » à « blanc ».' },
      { type: 'choice', text: 'Quelle phrase est bien écrite ?', choices: ['Mon frère et grand.', 'Mon frère est grand.'], answer: 'Mon frère est grand.', explain: 'On peut dire « Mon frère était grand » : c’est le verbe être.' },
      { type: 'choice', text: 'Quelle phrase est bien écrite ?', choices: ['Je mange du pain et du beurre.', 'Je mange du pain est du beurre.'], answer: 'Je mange du pain et du beurre.', explain: 'On peut dire « du pain et puis du beurre » : on écrit « et ».' },
      { type: 'text', passage: 'Fanta est en vacances à Pointe-à-Pitre. Elle va à la plage avec Ali et Ninon. L’eau est chaude. Ils nagent et ils rient.',
        questions: [
          { text: 'Où est Fanta ?', choices: ['à Pointe-à-Pitre', 'à l’école', 'à Paris'], answer: 'à Pointe-à-Pitre', explain: 'Le texte dit : « Fanta est en vacances à Pointe-à-Pitre. »' },
          { text: 'Dans « L’eau est chaude », pourquoi écrit-on « est » ?', choices: ['On peut dire « était ».', 'On peut dire « et puis ».'], answer: 'On peut dire « était ».', explain: 'On peut dire « L’eau était chaude » : c’est le verbe être.' },
          { text: 'Que font les enfants dans l’eau ?', choices: ['Ils nagent et ils rient.', 'Ils pêchent.', 'Ils dorment.'], answer: 'Ils nagent et ils rient.', explain: 'La dernière phrase dit : « Ils nagent et ils rient. »' },
        ] },
      { type: 'order', words: ['Le', 'gâteau', 'est', 'prêt'], answer: 'Le gâteau est prêt.', explain: '« est » vient du verbe être : on peut dire « Le gâteau était prêt ».' },
    ] },

  { id: 'n3-phrase', level: 'n3', order: 4, skill: 'grammaire', title: 'La phrase', difficulty: 3,
    intro: 'Une phrase commence par une majuscule et finit par un point. Elle peut raconter, poser une question ou donner un ordre. Exemple : « Viens ici ! » donne un ordre.',
    items: [
      { type: 'choice', text: 'Quelle phrase pose une question ?', choices: ['Où est ton cartable ?', 'Ton cartable est sous la table.', 'Range ton cartable.'], answer: 'Où est ton cartable ?', explain: 'Elle finit par un point d’interrogation : c’est une phrase interrogative.' },
      { type: 'choice', text: 'Quelle phrase donne un ordre ?', choices: ['Ferme la fenêtre.', 'La fenêtre est fermée.', 'La fenêtre est-elle fermée ?'], answer: 'Ferme la fenêtre.', explain: 'La phrase « Ferme la fenêtre » demande d’agir : elle est impérative.' },
      { type: 'choice', text: 'Le bus arrive à huit heures. Quel est le type de cette phrase ?', choices: ['déclarative', 'interrogative', 'impérative'], answer: 'déclarative', explain: 'Elle donne une information et finit par un point : elle est déclarative.' },
      { type: 'choice', text: 'Aimes-tu le chocolat ? Quel est le type de cette phrase ?', choices: ['interrogative', 'déclarative', 'impérative'], answer: 'interrogative', explain: 'Elle pose une question et finit par un point d’interrogation : elle est interrogative.' },
      { type: 'choice', text: 'Quelle phrase est à la forme négative ?', choices: ['Je ne mange pas de piment.', 'Je mange du piment.', 'Mange du piment.'], answer: 'Je ne mange pas de piment.', explain: '« ne » et « pas » entourent le verbe : la phrase est à la forme négative.' },
      { type: 'choice', text: 'Quelle phrase montre une émotion forte ?', choices: ['Comme ce gâteau est bon !', 'Ce gâteau est bon.', 'Ce gâteau est-il bon ?'], answer: 'Comme ce gâteau est bon !', explain: 'Le point d’exclamation montre la joie : c’est la forme exclamative.' },
      { type: 'order', words: ['Est-ce', 'que', 'tu', 'aimes', 'les', 'mangues'], answer: 'Est-ce que tu aimes les mangues ?', explain: 'Une question peut commencer par « Est-ce que » et finit par un point d’interrogation.' },
      { type: 'order', words: ['Je', 'ne', 'mange', 'pas', 'de', 'viande'], answer: 'Je ne mange pas de viande.', explain: '« ne » se place avant le verbe et « pas » juste après.' },
      { type: 'choice', text: 'Quelle est la forme négative de « Il pleut » ?', choices: ['Il ne pleut pas.', 'Il pleut pas.', 'Pleut-il ?'], answer: 'Il ne pleut pas.', explain: 'À l’écrit, on met « ne » et « pas » autour du verbe : il ne pleut pas.' },
      { type: 'pick', text: 'Mon frère ne dort pas.', prompt: 'Touche le verbe.', answer: 'dort', explain: 'Le verbe « dort » est entouré par « ne » et « pas ».' },
      { type: 'text', passage: '« Viens vite ! » crie Nadia. Son petit frère arrive en courant. « Regarde ce cerf-volant ! » dit-elle. Il est rouge et jaune. Comme il vole haut !',
        questions: [
          { text: 'Qui crie « Viens vite ! » ?', choices: ['Nadia', 'son petit frère', 'le cerf-volant'], answer: 'Nadia', explain: 'Le texte dit que c’est Nadia qui crie.' },
          { text: 'Quelle phrase donne un ordre ?', choices: ['Viens vite !', 'Il est rouge et jaune.', 'Comme il vole haut !'], answer: 'Viens vite !', explain: 'La phrase « Viens vite ! » demande au frère de venir : elle est impérative.' },
          { text: 'De quelles couleurs est le cerf-volant ?', choices: ['rouge et jaune', 'bleu et blanc', 'vert et noir'], answer: 'rouge et jaune', explain: 'Le texte dit : « Il est rouge et jaune. »' },
        ] },
      { type: 'choice', text: 'Quelle phrase est interrogative ?', choices: ['Veux-tu de l’eau ?', 'Bois de l’eau.', 'Je bois de l’eau.'], answer: 'Veux-tu de l’eau ?', explain: 'Elle pose une question avec « Veux-tu » : elle est interrogative.' },
      { type: 'choice', text: 'Comment poser une question avec « Tu as faim » ?', choices: ['As-tu faim ?', 'Tu n’as pas faim.', 'Tu as très faim !'], answer: 'As-tu faim ?', explain: 'On place « tu » après le verbe et on finit par un point d’interrogation.' },
      { type: 'pick', text: 'Range tes jouets, s’il te plaît.', prompt: 'Touche le verbe qui donne l’ordre.', answer: 'Range', explain: 'Le verbe « Range » demande de faire quelque chose.' },
    ] },

  { id: 'n3-verbe-sujet', level: 'n3', order: 5, skill: 'grammaire', title: 'Le verbe et son sujet', difficulty: 3,
    intro: 'Le verbe change quand on change le temps : je chante, je chantais. Pour trouver le sujet, demande : « Qui est-ce qui chante ? »',
    items: [
      { type: 'pick', text: 'Le bébé pleure.', prompt: 'Touche le verbe.', answer: 'pleure', explain: 'On peut dire « Le bébé pleurait » : « pleure » est le verbe.' },
      { type: 'pick', text: 'Mes cousins jouent au ballon.', prompt: 'Touche le verbe.', answer: 'jouent', explain: 'Hier, mes cousins jouaient : « jouent » change avec le temps, c’est le verbe.' },
      { type: 'pick', text: 'Le vent souffle fort.', prompt: 'Touche le verbe.', answer: 'souffle', explain: 'On peut dire « Le vent soufflait » : « souffle » est le verbe.' },
      { type: 'pick', text: 'Amir dessine un bateau.', prompt: 'Touche le sujet.', answer: 'Amir', explain: 'C’est Amir qui dessine : « Amir » est le sujet.' },
      { type: 'pick', text: 'Nous rangeons la classe.', prompt: 'Touche le sujet.', answer: 'Nous', explain: '« Nous » dit qui range la classe : c’est le sujet.' },
      { type: 'choice', text: 'Dans « Le chat de Lina dort », qui est-ce qui dort ?', choices: ['le chat de Lina', 'Lina'], answer: 'le chat de Lina', explain: 'C’est le chat de Lina qui dort : « Le chat de Lina » est le sujet.' },
      { type: 'choice', text: 'Quel est l’infinitif de « ils chantent » ?', choices: ['chanter', 'chant', 'chantent'], answer: 'chanter', explain: 'On dit « il faut chanter » : l’infinitif est « chanter ».' },
      { type: 'choice', text: 'Quel est l’infinitif de « tu manges » ?', choices: ['manger', 'mange', 'mangeur'], answer: 'manger', explain: 'On dit « il faut manger » : l’infinitif est « manger ».' },
      { type: 'choice', text: 'Quel mot est un verbe ?', choices: ['danser', 'danseuse', 'joli'], answer: 'danser', explain: 'On peut dire « je danse, je dansais » : « danser » est un verbe.' },
      { type: 'gap', text: 'Les oiseaux ___ dans l’arbre.', choices: ['chante', 'chantent'], answer: 'chantent', explain: 'Le sujet « Les oiseaux » est au pluriel : le verbe finit par « -ent ».' },
      { type: 'gap', text: 'Mon chien ___ très fort.', choices: ['aboie', 'aboient'], answer: 'aboie', explain: 'Le sujet « Mon chien » est au singulier : le verbe finit par « -e ».' },
      { type: 'gap', text: 'Tu ___ ton goûter.', choices: ['manges', 'mange', 'mangent'], answer: 'manges', explain: 'Avec « tu », le verbe finit par « -s » : tu manges.' },
      { type: 'order', words: ['Les', 'enfants', 'regardent', 'la', 'lune'], answer: 'Les enfants regardent la lune.', explain: 'Le sujet « Les enfants » vient avant le verbe « regardent ».' },
      { type: 'text', passage: 'À Mayotte, un maki grimpe dans le manguier. Il attrape une mangue. Mais la mangue tombe ! Soa la ramasse et la mange.',
        questions: [
          { text: 'Qui grimpe dans le manguier ?', choices: ['un maki', 'Soa', 'la mangue'], answer: 'un maki', explain: 'C’est un maki qui grimpe : « un maki » est le sujet.' },
          { text: 'Dans « Mais la mangue tombe ! », quel est le verbe ?', choices: ['tombe', 'mangue', 'Mais'], answer: 'tombe', explain: 'On peut dire « la mangue tombait » : « tombe » est le verbe.' },
          { text: 'Qui mange la mangue ?', choices: ['Soa', 'le maki'], answer: 'Soa', explain: 'La dernière phrase dit : « Soa la ramasse et la mange. »' },
        ] },
      { type: 'choice', text: 'Dans « Demain, je partirai en voyage », quel est le verbe ?', choices: ['partirai', 'Demain', 'voyage'], answer: 'partirai', explain: 'On peut dire « je pars, je partirai » : le verbe change avec le temps.' },
    ] },

  // ── Contrôle n3 ──
  { id: 'n3-controle', level: 'n3', order: 11, skill: 'controle', title: 'Le grand contrôle', difficulty: 6,
    intro: 'Voici le contrôle : il mélange tout ce que tu as appris. Prends ton temps, rien ne presse. Avec sept bonnes réponses sur dix, tu passes au niveau suivant.',
    items: [
      { type: 'gap', text: 'Ali ___ un vélo bleu.', choices: ['a', 'à'], answer: 'a', explain: 'On peut dire « Ali avait un vélo bleu » : c’est le verbe avoir.' },
      { type: 'gap', text: 'Le marché ___ très animé.', choices: ['est', 'et'], answer: 'est', explain: 'On peut dire « Le marché était très animé » : c’est le verbe être.' },
      { type: 'gap', text: 'Mes sœurs ___ dans le jardin.', choices: ['sont', 'son'], answer: 'sont', explain: 'On peut dire « Mes sœurs étaient dans le jardin » : c’est le verbe être.' },
      { type: 'gap', text: '___ joue aux dominos avec Papi.', choices: ['On', 'Ont'], answer: 'On', explain: 'On peut dire « Il joue aux dominos » : « on » remplace une personne.' },
      { type: 'pick', text: 'Le perroquet répète tous les mots.', prompt: 'Touche le verbe.', answer: 'répète', explain: 'On peut dire « Le perroquet répétait » : « répète » est le verbe.' },
      { type: 'pick', text: 'Elles dansent au carnaval.', prompt: 'Touche le sujet.', answer: 'Elles', explain: '« Elles » dit qui danse : c’est le sujet du verbe.' },
      { type: 'gap', text: 'J’ai acheté des fleurs ___.', choices: ['blanches', 'blanche', 'blancs'], answer: 'blanches', explain: '« des fleurs » est au féminin pluriel : on écrit « blanches ».' },
      { type: 'choice', text: 'Quelle phrase est interrogative ?', choices: ['Où vas-tu ?', 'Va dans ta chambre.', 'Je vais à l’école.'], answer: 'Où vas-tu ?', explain: 'Elle pose une question et finit par un point d’interrogation.' },
      { type: 'gap', text: 'Vous ___ très gentils.', choices: ['êtes', 'est', 'sommes'], answer: 'êtes', explain: 'Le verbe être avec « vous » : vous êtes.' },
      { type: 'gap', text: 'Demain, nous ___ la mer.', choices: ['verrons', 'voyions', 'voyons'], answer: 'verrons', explain: 'Avec « demain », on emploie le futur : nous verrons.' },
      { type: 'choice', text: 'Quel est le contraire de « lourd » ?', choices: ['léger', 'gros', 'grand'], answer: 'léger', explain: '« lourd » et « léger » ont des sens opposés.' },
      { type: 'choice', text: 'Quel mot est de la même famille que « lait » ?', choices: ['laitier', 'laid', 'laisser'], answer: 'laitier', explain: '« laitier » contient « lait » ; « laid » se dit pareil, mais n’a pas le même sens.' },
      { type: 'text', passage: 'Hier, Maëva est allée au marché de Papeete avec son père. Ils ont acheté des fruits et du poisson. Maëva a choisi un ananas. Ce soir, ils mangeront ensemble.',
        questions: [
          { text: 'Avec qui Maëva est-elle allée au marché ?', choices: ['avec son père', 'avec sa mère', 'toute seule'], answer: 'avec son père', explain: 'La première phrase dit qu’elle est allée au marché avec son père.' },
          { text: 'Qu’a choisi Maëva ?', choices: ['un ananas', 'un poisson', 'une mangue'], answer: 'un ananas', explain: 'Le texte dit : « Maëva a choisi un ananas. »' },
          { text: 'Dans « ils mangeront ensemble », à quel temps est le verbe ?', choices: ['au futur', 'au présent', 'à l’imparfait'], answer: 'au futur', explain: '« mangeront » dit ce qui se passera ce soir : c’est le futur.' },
        ] },
      { type: 'order', words: ['Les', 'élèves', 'écoutent', 'une', 'histoire'], answer: 'Les élèves écoutent une histoire.', explain: 'Le sujet « Les élèves » vient d’abord, puis le verbe « écoutent ».' },
      { type: 'gap', text: 'Autrefois, il ___ à la campagne.', choices: ['habitait', 'habitera', 'habite'], answer: 'habitait', explain: 'Avec « autrefois », on emploie l’imparfait : il habitait.' },
    ] },
  // ───────────── fin des modules ─────────────
];
