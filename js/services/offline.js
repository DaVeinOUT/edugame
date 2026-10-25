/* Le statut correspond au cache complet du worker actif, pas au réseau. */
export function createOfflineStatus() {
  let status = 'unavailable';
  let generation = 0;
  return {
    get status() { return status; },
    downloading() { if (status !== 'ready') status = 'downloading'; },
    failed() { if (status !== 'ready') status = 'failed'; },
    async check(worker = globalThis.navigator?.serviceWorker?.controller) {
      const mine = ++generation;
      if (!worker) { status = 'unavailable'; return false; }
      status = 'checking';
      const ready = await new Promise(resolve => {
        const channel = new MessageChannel();
        let done = false;
        const finish = ok => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          channel.port1.close();
          channel.port2.close();
          resolve(ok);
        };
        const timer = setTimeout(() => finish(false), 5000);
        channel.port1.onmessage = e => finish(e.data?.type === 'OFFLINE_STATUS' && e.data.complete === true);
        try { worker.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]); }
        catch { finish(false); }
      });
      if (mine === generation) status = ready ? 'ready' : 'failed';
      return ready;
    },
  };
}

export const OFFLINE_LABELS = {
  ready: 'Jeu entièrement téléchargé : ouverture hors ligne disponible.',
  downloading: 'Téléchargement du jeu en cours. Gardez cette page ouverte avec internet.',
  checking: 'Vérification des fichiers hors ligne…',
  failed: 'Téléchargement incomplet ou indisponible. Reconnectez cet appareil puis rechargez EDUCA.',
  unavailable: 'Jeu hors ligne non vérifié sur ce navigateur.',
};
