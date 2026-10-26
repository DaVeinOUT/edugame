---
name: educa-reliability
description: Corriger les défauts de sauvegarde, migration, import, audio local, service worker et temps actif d’EDUCA. À utiliser quand un changement touche ces mécanismes ou les garanties hors ligne.
---

# Fiabilité locale d’EDUCA

Lire les sections concernées de `docs/audits/2026-10-25/AUDIT.md` et vérifier le défaut sur la version actuelle.

Les sources se trouvent dans `js/services/store.js`, `js/core/schema.js`, `js/services/voice.js`, `js/services/recordings.js`, `js/core/time.js`, `js/screens/lesson.js` et `sw.js` selon le besoin. Les modèles de données et fonctions pures doivent rester distincts des accès navigateur.

Pour une sauvegarde, tester la donnée relue après fermeture/réouverture, pas seulement l’objet en mémoire. Couvrir panne temporaire/durable, reprise des écritures, cohérence des profils, deux instances et imports divergents. Préserver les identifiants et prévoir la migration des états anciens ou incomplets.

Pour l’audio, différencier fichiers embarqués, voix réellement locale, voix distante, mode silencieux et lecteur d’écran. Ne pas affirmer que la CSP prouve la confidentialité d’un synthétiseur système. Pour le cache, vérifier installation complète, ressource manquante, mise à jour et réouverture sans réseau. Le statut « prêt » doit correspondre à une capacité réelle.

Pour le temps actif, couvrir sorties précoces, visibilité, inactivité, changement de jour et idempotence. Ne pas compter deux fois un même intervalle.

Ajouter les tests de risque appropriés et conserver les preuves. Coordonner toute modification des hooks de la voix, du build ou du service worker avec le principal.
