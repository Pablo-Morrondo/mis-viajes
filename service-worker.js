const CACHE_NAME = "mis-viajes-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/travel-bg.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
