self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("classteacher-v1").then((cache) => cache.addAll(["/", "/today", "/nexa", "/classes"])),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("/"))),
  );
});
