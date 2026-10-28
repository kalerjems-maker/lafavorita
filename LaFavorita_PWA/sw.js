// Guarda todas las pantallas en el celular: abren al instante y también sin internet.
// Los datos siempre vienen frescos de Google (si no hay señal, se muestran los últimos guardados).
var CACHE = 'favorita-v5';
var ARCHIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icono-192.png', './icono-512.png', './icono-maskable-512.png', './apple-touch-icon.png', './logo-tienda.png',
  './p-inicio.html', './p-cuadre.html', './p-cuentas.html', './p-proveedores.html', './p-precios.html', './p-catalogo.html', './p-panel.html', './p-historial.html', './p-fijos.html'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: 'reload' }); })); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  var fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !fuentes) return;   // lo de Google (datos) no se toca
  // Se abre lo guardado de una vez y por detrás se trae la versión nueva para la próxima vez
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: !fuentes }).then(function (g) {
      var red = fetch(e.request).then(function (r) { if (r && (r.ok || r.type === 'opaque')) c.put(fuentes ? e.request : u.origin + u.pathname, r.clone()); return r; });
      if (g) { red.catch(function () {}); return g; }
      return red.catch(function () { return c.match('./p-inicio.html'); });
    });
  }));
});
