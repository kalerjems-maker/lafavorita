// Guarda la "cáscara" de la app en el celular para que abra al instante (la app de adentro siempre viene fresca de Google)
var CACHE = 'favorita-v3';
var ARCHIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icono-192.png', './icono-512.png', './icono-maskable-512.png', './apple-touch-icon.png', './logo-tienda.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return;   // lo de Google no se toca
  // Primero lo de internet (por si se actualiza), si no hay señal lo guardado
  e.respondWith(fetch(e.request).then(function (r) {
    var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copia); }); return r;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); }); }));
});
