/**
 * Shared Google AdSense helpers — script load + placement normalization.
 */

const loadedPublishers = new Set();
const loadingPublishers = new Map();

/** @param {string} publisherId */
export const isValidPublisherId = (publisherId = '') =>
  /^ca-pub-\d{10,20}$/i.test(String(publisherId).trim());

/** @param {string} adSlotId */
export const isValidAdSlotId = (adSlotId = '') =>
  /^\d{5,20}$/.test(String(adSlotId).trim());

/**
 * Load the official AdSense script once per publisher ID.
 * Resolves when the script is ready (or already present).
 */
export const ensureAdSenseScript = (publisherId) => {
  const client = String(publisherId || '').trim();
  if (!client || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if (!isValidPublisherId(client)) {
    return Promise.resolve(false);
  }

  window.adsbygoogle = window.adsbygoogle || [];

  if (loadedPublishers.has(client)) {
    return Promise.resolve(true);
  }

  if (loadingPublishers.has(client)) {
    return loadingPublishers.get(client);
  }

  const existing = document.querySelector(`script[data-adsense-pub="${client}"]`);
  if (existing) {
    const wait = new Promise((resolve) => {
      if (existing.dataset.loaded === '1') {
        loadedPublishers.add(client);
        resolve(true);
        return;
      }
      existing.addEventListener(
        'load',
        () => {
          existing.dataset.loaded = '1';
          loadedPublishers.add(client);
          resolve(true);
        },
        { once: true }
      );
      existing.addEventListener('error', () => resolve(false), { once: true });
      // Script may already be complete
      if (existing.getAttribute('data-loaded') === '1' || existing.readyState === 'complete') {
        existing.dataset.loaded = '1';
        loadedPublishers.add(client);
        resolve(true);
      }
    });
    loadingPublishers.set(client, wait);
    wait.finally(() => loadingPublishers.delete(client));
    return wait;
  }

  const wait = new Promise((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsensePub = client;
    script.onload = () => {
      script.dataset.loaded = '1';
      loadedPublishers.add(client);
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  loadingPublishers.set(client, wait);
  wait.finally(() => loadingPublishers.delete(client));
  return wait;
};

/** Build inline style for an AdSense <ins> element */
export const getAdSenseInsStyle = (placement = {}) => {
  if (placement.sizeMode === 'fixed') {
    return {
      display: 'inline-block',
      width: `${Number(placement.width) || 336}px`,
      height: `${Number(placement.height) || 280}px`,
      maxWidth: '100%',
    };
  }
  return { display: 'block', width: '100%', minHeight: 90 };
};
