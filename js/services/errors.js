/* ============================================================
   SERVICES/ERRORS.JS — Le filet de sécurité
   Un enfant qui ne sait pas lire ne comprendra jamais un message
   d'erreur. Si quelque chose casse : Kaya le dit gentiment, on
   revient à l'accueil, et l'erreur est notée pour l'adulte
   (espace parents) — jamais d'écran figé et muet.
   ============================================================ */

const BURST_MS = 3000;
const BURST_MAX = 3;

/**
 * @param {{ onError?: () => void, log?: (entry: { t: number, msg: string, where: string }) => void }} handlers
 */
export function installSafetyNet({ onError, log } = {}) {
  let last = 0;
  let burst = 0;

  function handle(message, where) {
    const t = Date.now();
    burst = t - last < BURST_MS ? burst + 1 : 0;
    last = t;
    if (burst >= BURST_MAX) return;   // une boucle d'erreurs ne doit pas boucler la voix
    try { log?.({ t, msg: String(message || 'erreur').slice(0, 200), where: String(where || '').slice(0, 120) }); }
    catch { /* le journal ne doit pas lui-même planter */ }
    try { onError?.(); } catch { /* idem */ }
  }

  addEventListener('error', e => {
    if (!e.message) return;   // ressource manquante (image, son) : pas une panne du jeu
    const file = (e.filename || '').split('/').pop();
    handle(e.message, `${file}:${e.lineno || 0}`);
  });
  addEventListener('unhandledrejection', e => {
    const r = e.reason;
    handle(r?.message || r, 'promesse');
  });
}
