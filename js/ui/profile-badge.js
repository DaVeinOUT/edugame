/* Repère de profil en vrai DOM : forme + numéro + quantité visible, sans
   dépendre d'une couleur ou de la lecture du prénom. */
import { h } from './dom.js';
import { badgeInfo } from '../core/schema.js';

export function profileBadge(profile) {
  const info = badgeInfo(profile?.badgeId);
  if (!info) return null;
  return h('span', { class: 'profile-badge', role: 'img', 'aria-label': info.label,
    dataset: { badgeId: info.id } },
  h('span', { class: 'profile-badge-shape', 'aria-hidden': 'true' }, info.symbol),
  h('span', { class: 'profile-badge-number', 'aria-hidden': 'true' }, info.number),
  info.number <= 8 ? h('span', { class: 'profile-badge-dots', 'aria-hidden': 'true' },
    Array.from({ length: info.number }, () => h('i'))) : null);
}
