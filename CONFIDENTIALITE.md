# Confidentialité — EDUCA

**En une phrase : EDUCA ne collecte rien. Tout reste sur l'appareil de l'enfant.**

## Ce qu'EDUCA ne fait pas

- Pas de compte, pas d'identifiant, pas de mot de passe.
- Pas de serveur : le jeu est une page web statique ; une fois chargé, il fonctionne sans internet.
- Pas de publicité, pas de mesure d'audience, pas de traceur, pas de cookie.
- Pas de ressource tierce : polices, images (émojis du système) et sons sont servis avec le jeu ;
  aucune requête vers Google ou un autre service n'est faite par EDUCA.

## Ce qui est enregistré sur l'appareil (et seulement là)

| Donnée | Où | Pourquoi |
|---|---|---|
| Prénom (facultatif), animal, tranche d'âge, univers | stockage local du navigateur (`educa2:p:<identifiant>`) | se reconnaître, adapter le départ |
| Progression : étape du chemin, étoiles, mémoire des exercices, force de lecture (Élo) et son historique, temps de jeu par jour, confusions repérées, cartes | même endroit | adapter les exercices, tableau de bord de l'adulte |
| Réglages de confort de chaque enfant (police, espacement, coloration, voix…) | même endroit | lisibilité |
| Réglages de l'appareil (voix choisie, mode silencieux, étape de la classe, temps maximum, journal technique des 20 dernières erreurs) | `educa2:device` | fonctionnement |
| Sons enregistrés par l'adulte (facultatif) | base IndexedDB `educa-audio` | sons purs pour tous les enfants |

Aucune de ces données n'est transmise. Les fichiers d'export sont créés par l'adulte et restent sous son contrôle.

## La voix de Kaya

Kaya parle avec la **synthèse vocale de l'appareil**. EDUCA choisit en priorité une **voix locale**.
Certaines voix « en ligne » (par exemple « Google français » dans Chrome sur ordinateur) envoient le texte
à prononcer — qui peut contenir le prénom — au service de l'éditeur : EDUCA ne les utilise que s'il
n'existe aucune voix française locale. Pour l'éviter complètement : installer une voix française locale
dans les réglages du système, ou laisser le prénom vide.

## Effacer, exporter

Espace des grands (⚙️, protégé par un petit défi de lecture) → **Données** :
- **Exporter tout** : un fichier JSON à garder (changement de tablette) ;
- **Importer** : restaurer ce fichier sur un autre appareil ;
- **Supprimer** un enfant, ou **Tout effacer** (profils, réglages, progrès) sur cet appareil.
Les sons enregistrés se suppriment un par un dans **Appareil → Les sons de Kaya**.
Effacer les données du site dans le navigateur supprime aussi tout.

## À l'école

Sans compte ni collecte, EDUCA ne crée pas de traitement de données personnelles côté école ; nous
recommandons de le présenter en conseil d'école et de le faire confirmer par le délégué à la protection
des données de l'académie. Ressources utiles : CNIL et Éduscol (ressources numériques et RGPD).
