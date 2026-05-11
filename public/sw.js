// Version du cache — change ce numéro à chaque déploiement
const CACHE_VERSION = 'tps-v2';
const CACHE_NAME = `tps-cache-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/journal',
  '/calculator',
  '/stats',
  '/profile',
];

// Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installation version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force l'activation immédiate sans attendre
  self.skipWaiting();
});

// Activation — supprime les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      // Prend le contrôle de tous les onglets immédiatement
      return self.clients.claim();
    })
  );
});

// Fetch — stratégie Network First pour HTML, Cache First pour assets
self.addEventListener('fetch', (event) => {
  // Ignorer les appels API
  if (event.request.url.includes('/api/')) return;

  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Pour les fichiers HTML → Network First (toujours la dernière version)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pour les autres assets → Cache First avec mise à jour en arrière-plan
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// Écouter les messages de l'app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CHECK_UPDATE') {
    self.registration.update();
  }
});