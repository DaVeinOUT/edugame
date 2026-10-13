# EDUCA sur Android (et iOS) — ce qu'il reste à faire

Tout le détail, testé et sourcé : `rapports/2026-10-13-voix-humaine-et-mobile.md` (partie B et annexes 4 à 6).
Le jeu est déjà une PWA complète (hors-ligne, icônes « maskable » et Apple, manifeste à jour) : on peut
l'**installer depuis le navigateur** (« Ajouter à l'écran d'accueil ») sans passer par un magasin.

## Android (Google Play) : Trusted Web Activity

1. **Choisir l'origine** (décision de Dave) — Android vérifie le site par `/.well-known/assetlinks.json`
   **à la racine du domaine** :
   - A. garder `daveinout.github.io/edugame/` : créer le dépôt `DaVeinOUT/DaVeinOUT.github.io` contenant
     `.well-known/assetlinks.json` et un fichier `.nojekyll` ;
   - B. (recommandé) un domaine à soi : fichier `CNAME` dans ce dépôt, `.well-known/assetlinks.json` ici même
     (la CI le publie : `include-hidden-files: true`), DNS + HTTPS dans *Settings → Pages*.
2. Adapter `twa/twa-manifest.json` si l'origine change (champs `host`, `startUrl`, `iconUrl`, `maskableIconUrl`,
   `webManifestUrl`, `fullScopeUrl`).
3. Générer et signer : `npx @bubblewrap/cli init --manifest https://<origine>/manifest.json` (ou `build` avec ce
   fichier), clé `android.keystore` **gardée hors de git** (déjà ignorée) et sauvegardée en lieu sûr.
4. Copier `twa/assetlinks.template.json` vers `.well-known/assetlinks.json` avec les **deux** empreintes SHA-256
   (clé d'envoi : `bubblewrap fingerprint list` ; clé Google : *Console Play → Intégrité de l'application*).
5. Console Play : catégorie Éducation ; public 5-12 ans ; « Sécurité des données » = aucune donnée collectée ni
   partagée ; aucune publicité ; questionnaire IARC ; URL de confidentialité : `https://<origine>/confidentialite.html`.
   Nouveau compte personnel : **test fermé de 14 jours avec 12 testeurs** (enseignants, parents) avant la production.
6. Captures : ≥ 4 téléphone (1080×1920) et 2 tablette, profil de démonstration sans prénom réel ; bannière 1024×500.

## iOS (App Store) : plan B Capacitor

Apple refuse les « simples sites » (règle 4.2) : il faut une coque native. Gabarits prêts dans le rapport
(annexe 5 : `capacitor.config.json`, `js/services/tts-shim.js` pour la synthèse vocale native). Le site se construit
avec `node scripts/build-site.mjs www`. Prévoir `NSMicrophoneUsageDescription` (enregistrement des sons par l'adulte).

## Avant toute soumission

Faire la liste d'essais B4.4 du rapport sur de vrais appareils (Android ancien et récent, iPad, mode avion,
voix absente, lecteur d'écran).
