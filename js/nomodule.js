/* Navigateurs trop anciens pour les modules JavaScript : on le dit
   simplement à l'adulte au lieu d'afficher un écran vide. */
(function () {
  var el = document.getElementById('boot');
  if (el) el.textContent = 'Ce navigateur est trop ancien pour EDUCA. Essayez Chrome, Firefox ou Safari à jour.';
})();
