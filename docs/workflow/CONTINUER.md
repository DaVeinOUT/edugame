# Message à transmettre à Codex dans VS Code

Le dépôt contient des instructions `AGENTS.md`, des rôles `.codex/agents/`, des skills `.agents/skills/` et un état de reprise. La configuration du projet reste soumise au client, à sa version, à la confiance du dossier et aux permissions de la session. Références vérifiées : [sous-agents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [skills](https://learn.chatgpt.com/docs/build-skills), [configuration locale](https://learn.chatgpt.com/docs/config-file/config-basic).

Les rôles sont déclarés et disponibles pour les clients compatibles ; ils ne sont pas cinq processus lancés en permanence. La configuration conserve les modèles et les permissions hérités. Une session longue peut reprendre depuis les fichiers d’état ; ces fichiers ne peuvent pas supprimer les limites de contexte, d’usage ou de session.

## Texte à copier

```text
Tu reprends EDUCA et tu dois maintenant implémenter les améliorations, pas t’arrêter à un nouveau plan. Je veux que tu avances de lot en lot, testes et corriges ce que tu changes, et poursuives le travail autorisé sans me demander systématiquement si tu peux continuer.

Lis AGENTS.md, docs/README.md, docs/workflow/PLAN.md et docs/workflow/PROGRESS.md. Utilise les skills du dépôt : educa-delivery, educa-reliability, educa-kaya-3d et educa-card-art. Lis seulement ceux qui correspondent à ton travail.

Quand tes outils le permettent, utilise les sous-agents configurés : educa_reliability pour la fiabilité, educa_kaya pour le compagnon/3D, educa_cards pour les cartes, educa_reviewer pour la revue et educa_pedagogy pour la cohérence pédagogique. Délègue les travaux indépendants avec des fichiers attribués et garde l’intégration commune. N’utilise pas tous les agents par principe. Si la fonction n’est pas disponible, assure les mêmes responsabilités en séquence et continue.

Mon évolution prioritaire du personnage est un Kaya qui ressemble à un vrai compagnon vivant dans l’application : bébé jaguar entier et reconnaissable, regard expressif, respiration, clignements, salut de la patte, réactions aux exercices et aux réussites, écoute et aide à la demande, petites célébrations et pauses. Je veux retrouver la présence d’un compagnon animé comme dans ChatGPT, avec une identité originale cohérente avec les cartes EDUCA. Il reste près de l’activité sans la masquer et devient discret pendant la lecture.

Lis docs/design/kaya-compagnon/README.md. La cible est une vraie 3D locale, avec modèle/rig/animations identifiés et un rendu de secours accessible sur appareil modeste ou sans WebGL. Une illustration qui ressemble à de la 3D et une rotation CSS ne suffisent pas à déclarer le modèle 3D terminé. Vérifie les assets et outils réellement disponibles ; produis un prototype reproductible et signale exactement ce qui reste à fournir. Une dépendance 3D locale, limitée et versionnée peut être ajoutée si nécessaire sans réécrire toute l’application.

Pour les cartes, utilise docs/design/cartes-ia/PROMPT_CODEX.md. Les deux images sources sont déjà dans le dépôt : commence par son-m et r_first, montre les illustrations dans la collection et la révélation, conserve les textes en HTML et préserve les conditions de gain.

Traite d’abord les défauts de fiabilité qui mettent en jeu les progrès, la voix locale et le clavier. Tu peux explorer le compagnon et préparer les cartes en parallèle sur des fichiers distincts. Préserve les profils, le fonctionnement hors ligne, les réglages de confort et la bienveillance du jeu.

Après chaque lot, lance les vérifications adaptées, corrige les échecs de ton périmètre, fais relire les changements importants, et actualise PROGRESS.md avec les résultats exacts et la prochaine action. Ne coche pas un lot sur la seule base d’un document ou d’une maquette. Si tu approches d’une limite de session, laisse une reprise précise et exploitable. Si un asset ou outil manque, poursuis les autres tâches utiles plutôt que de bloquer toute la mission. Respecte les permissions et demande mon intervention uniquement lorsqu’une dépendance réelle ne peut pas être résolue dans le périmètre autorisé.

Commence maintenant par examiner l’état courant et reproduire les premiers défauts, puis implémente. Ne termine pas ton tour simplement avec « voici le plan » ou « veux-tu que je continue ? » tant qu’il reste du travail autorisé et réalisable.
```
