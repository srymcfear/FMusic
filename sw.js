const CACHE_NAME = 'app-music-v1';
const ASSETS_TO_CACHE = [
  './',
  './app_music.html',
  './index.html',
  './manifest.json',
  './bick.jpg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[ServiceWorker] Cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale while revalidate / network first fallback to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip data URLs or blob URLs
  if (event.request.url.startsWith('blob:') || event.request.url.startsWith('data:')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ignore network fail offline */});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for offline HTML navigation
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./app_music.html');
        }
      });
    })
  );
});
