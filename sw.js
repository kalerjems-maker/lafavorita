// Guarda todas las pantallas en el celular: abren al instante y también sin internet.
// Los datos siempre vienen frescos de Google (si no hay señal, se muestran los últimos guardados).
var CACHE = 'favorita-v8';
var ARCHIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icono-192.png', './icono-512.png', './icono-maskable-512.png', './apple-touch-icon.png', './logo-tienda.png',
  './p-inicio.html', './p-cuadre.html', './p-cuentas.html', './p-proveedores.html', './p-precios.html', './p-catalogo.html', './p-panel.html', './p-historial.html', './p-fijos.html', './p-inventario.html'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: 'reload' }); })); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
function nueva(viejo, r) {
  var a = viejo.headers.get('etag') || viejo.headers.get('last-modified'), b = r.headers.get('etag') || r.headers.get('last-modified');
  return !!(a && b && a !== b);
}
var CAMBIO = 0, ULT_AVISO = 0, REFRESCANDO = null;
var PANTALLAS = ARCHIVOS.filter(function (u) { return /\.html$|\/$/.test(u); });
// Cuando una pantalla cambió en GitHub se traen TODAS de una vez y se avisa una sola vez
// (antes se avisaba en cada pantalla que uno abría, por eso el aviso azul salía varias veces)
function refrescarTodo(c) {
  if (REFRESCANDO) return REFRESCANDO;
  REFRESCANDO = Promise.all(PANTALLAS.map(function (u) {
    var url = new URL(u, self.location.href);
    return fetch(url.href, { cache: 'no-cache' }).then(function (r) { if (r.ok) return c.put(url.origin + url.pathname, r); }).catch(function () {});
  })).then(function () {
    REFRESCANDO = null;
    if (Date.now() - ULT_AVISO > 120000) { ULT_AVISO = CAMBIO = Date.now(); avisar(); }
  });
  return REFRESCANDO;
}
// La pantalla pregunta al abrir: "¿cambió algo?" (el aviso directo puede llegar antes de que la pantalla esté lista)
self.addEventListener('message', function (e) {
  if (e.data === 'hay-nueva' && CAMBIO && Date.now() - CAMBIO < 600000 && e.source) { CAMBIO = 0; e.source.postMessage('nueva-version'); }  // se avisa una sola vez
});
function avisar() { self.clients.matchAll({ type: 'window' }).then(function (cs) { cs.forEach(function (c) { c.postMessage('nueva-version'); }); }); }
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  var fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !fuentes) return;   // lo de Google (datos) no se toca
  // Se abre lo guardado de una vez y por detrás se trae la versión nueva para la próxima vez
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: !fuentes }).then(function (g) {
      var red = fetch(fuentes ? e.request : u.href, fuentes ? undefined : { cache: 'no-cache' }).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) {
          // Si la pantalla cambió en GitHub, se avisa para que el usuario toque "Actualizar"
          var cambio = g && /\.html$|\/$/.test(u.pathname) && nueva(g, r);
          c.put(fuentes ? e.request : u.origin + u.pathname, r.clone()).then(function () { if (cambio) refrescarTodo(c); });
        }
        return r;
      });
      if (g) { red.catch(function () {}); return g; }
      return red.catch(function () { return c.match('./p-inicio.html'); });
    });
  }));
});
