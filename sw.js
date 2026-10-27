const CACHE_NAME = 'aeroframe-v10-offline-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Sora:wght@400;500;600;700&display=swap'
];

// 1. Fase Install: Simpan aset inti ke Cache Storage perangkat
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Fase Activate: Bersihkan cache versi lama jika ada update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fase Fetch: Gunakan strategi Cache-First, lalu Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika offline total dan navigasi halaman diminta, kembalikan index.html dari cache
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });

      // Kembalikan versi cache seketika jika ada (instan tanpa loading), sambil update di latar belakang
      return cachedResponse || fetchPromise;
    })
  );
});
