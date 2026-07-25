const CACHE_NAME = "seriespelis-v2-fase1-1";

const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./service-worker.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./icons/icon-167.png",
  "./icons/icon-152.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          // Cachea también lo que se vaya pidiendo (solo GET)
          if (event.request.method === "GET") {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached); // fallback: si no hay red, devuelve lo que haya
    })
  );
});