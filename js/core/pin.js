/* ============================================================
   CORE/PIN.JS — Le code de l'espace des grands
   Un code à 4 chiffres choisi par l'adulte : les élèves qui savent
   lire ne peuvent ni changer les réglages, ni voir les progrès des
   autres. Le code n'est jamais gardé en clair (empreinte salée), ne
   quitte jamais l'appareil et n'est pas dans les sauvegardes.
   ============================================================ */

export const PIN_LENGTH = 4;

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/** Un code valable : exactement 4 chiffres. */
export const isPin = pin => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(String(pin));

/**
 * Empreinte d'un code (le sel est tiré au hasard à la création).
 * @returns {Promise<{ salt: string, hash: string }>}
 */
export async function hashPin(pin, salt = hex(crypto.getRandomValues(new Uint8Array(8)))) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return { salt, hash: hex(digest) };
}

/** Le code tapé est-il le bon ? */
export async function checkPin(pin, saved) {
  if (!saved?.salt || !saved?.hash || !isPin(pin)) return false;
  return (await hashPin(pin, saved.salt)).hash === saved.hash;
}
