/* ============================================================
   KAYA.JS — Le compagnon jaguar
   Un bébé jaguar dessiné en SVG : zéro image à télécharger,
   net à toutes les tailles, et ses yeux clignent tout seuls.
   (Pourra être remplacé plus tard par un modèle 3D.)
   ============================================================ */

const KAYA_SVG = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Oreilles -->
  <circle cx="48"  cy="55" r="26" fill="#F6AD37"/>
  <circle cx="152" cy="55" r="26" fill="#F6AD37"/>
  <circle cx="48"  cy="55" r="13" fill="#B45309"/>
  <circle cx="152" cy="55" r="13" fill="#B45309"/>

  <!-- Tête -->
  <ellipse cx="100" cy="110" rx="74" ry="68" fill="#F6AD37"/>

  <!-- Rosettes de jaguar -->
  <g fill="#8A5306">
    <circle cx="62"  cy="62"  r="6"/><circle cx="62"  cy="62"  r="2.6" fill="#F6AD37"/>
    <circle cx="100" cy="50"  r="6.5"/><circle cx="100" cy="50" r="2.8" fill="#F6AD37"/>
    <circle cx="138" cy="62"  r="6"/><circle cx="138" cy="62"  r="2.6" fill="#F6AD37"/>
    <circle cx="36"  cy="105" r="5"/><circle cx="36"  cy="105" r="2"   fill="#F6AD37"/>
    <circle cx="164" cy="105" r="5"/><circle cx="164" cy="105" r="2"   fill="#F6AD37"/>
    <circle cx="46"  cy="138" r="4.4"/>
    <circle cx="154" cy="138" r="4.4"/>
  </g>

  <!-- Museau clair -->
  <ellipse cx="100" cy="142" rx="34" ry="25" fill="#FDE7B0"/>

  <!-- Yeux (ils clignent) -->
  <g transform="translate(70,103)">
    <g>
      <ellipse rx="15" ry="17" fill="#fff"/>
      <circle r="8" fill="#3B2204"/>
      <circle cx="-3" cy="-4" r="3" fill="#fff"/>
      <animateTransform attributeName="transform" type="scale" additive="sum"
        values="1 1;1 1;1 0.06;1 1;1 1" keyTimes="0;0.9;0.94;0.98;1"
        dur="4.6s" repeatCount="indefinite"/>
    </g>
  </g>
  <g transform="translate(130,103)">
    <g>
      <ellipse rx="15" ry="17" fill="#fff"/>
      <circle r="8" fill="#3B2204"/>
      <circle cx="-3" cy="-4" r="3" fill="#fff"/>
      <animateTransform attributeName="transform" type="scale" additive="sum"
        values="1 1;1 1;1 0.06;1 1;1 1" keyTimes="0;0.9;0.94;0.98;1"
        dur="4.6s" repeatCount="indefinite"/>
    </g>
  </g>

  <!-- Truffe -->
  <path d="M90,128 h20 q5,0 2.6,4.6 l-9,10 q-3.6,4 -7.2,0 l-9,-10 q-2.4,-4.6 2.6,-4.6 z" fill="#6B3305"/>

  <!-- Sourire -->
  <path d="M100,141 v5 M100,146 q-6,8 -16,4 M100,146 q6,8 16,4"
        stroke="#6B3305" stroke-width="3.6" stroke-linecap="round" fill="none"/>

  <!-- Points de moustache -->
  <g fill="#8A5306">
    <circle cx="78"  cy="138" r="1.7"/><circle cx="73"  cy="144" r="1.7"/><circle cx="79"  cy="149" r="1.7"/>
    <circle cx="122" cy="138" r="1.7"/><circle cx="127" cy="144" r="1.7"/><circle cx="121" cy="149" r="1.7"/>
  </g>

  <!-- Moustaches -->
  <g stroke="#D97706" stroke-width="2" stroke-linecap="round" opacity="0.55" fill="none">
    <path d="M64,138 q-14,-2 -26,-7"/>
    <path d="M64,146 q-14,2 -26,6"/>
    <path d="M136,138 q14,-2 26,-7"/>
    <path d="M136,146 q14,2 26,6"/>
  </g>
</svg>`;

function paintKaya() {
  document.querySelectorAll('.companion-placeholder, .hub-companion-img')
    .forEach(el => { el.innerHTML = KAYA_SVG; });
}

document.addEventListener('DOMContentLoaded', paintKaya);
