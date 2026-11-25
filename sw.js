/* Univers Gourmand — service worker
 * - met en cache uniquement les fichiers statiques (jamais les pages PHP ni les API : données privées et en direct)
 * - affiche une page hors ligne si le réseau est indisponible
 * - affiche les notifications (commande prête, paiement confirmé)
 */
const CACHE = 'ug-static-v1';
const PRECACHE = [
  'offline.html',
  'styles.css',
  'customer.css',
  'customer.js',
  'assets/qr.js',
  'assets/images/logo.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(() => null))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('offline.html')));
    return;
  }

  if (/\.(?:css|js|svg|png|webp|jpg|jpeg|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request).then(response => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || 'menu.php';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
