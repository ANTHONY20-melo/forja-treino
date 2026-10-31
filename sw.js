/* FORJA — Service Worker (offline-first) */
var CACHE = 'forja-v7';

var CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(CORE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* não falha instalação */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isTile(url) {
  return url.hostname === 'tile.openstreetmap.org' ||
    /\.tile\.openstreetmap\.org$/.test(url.hostname);
}

function isCdn(url) {
  return url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net';
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* Navegação: network-first com fallback offline */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(function () {
        return caches.match('./index.html').then(function (r) {
          return r || caches.match('./');
        });
      })
    );
    return;
  }

  /* Tiles do mapa: cache-first (stale-while-revalidate), cache limitado */
  if (isTile(url)) {
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          var net = fetch(req).then(function (res) {
            if (res && res.ok) {
              c.put(req, res.clone()).then(function () { trimCache(c, 900); });
            }
            return res;
          }).catch(function () { return hit; });
          return hit || net;
        });
      })
    );
    return;
  }

  /* CDN (Leaflet): cache-first */
  if (isCdn(url)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, clone); });
          }
          return res;
        });
      })
    );
  }
  /* Demais requisições (ex.: OSRM): rede direta — não são críticas offline */
});

function trimCache(cache, max) {
  cache.keys().then(function (keys) {
    if (keys.length > max) {
      cache.delete(keys[0]).then(function () { trimCache(cache, max); });
    }
  });
}
