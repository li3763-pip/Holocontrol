/* HoloVerifica — Service Worker v2 */
const CACHE = 'holoVerifica-v2';

const PRECACHE = [
  './',
  './index.html',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './js/auth.js',
  './js/dictamen.js',
  './js/hologramas.js',
  './js/instrumentos.js',
  './js/render.js',
  '../../shared/assets/fonts.css',
  '../../shared/css/variables.css',
  '../../shared/js/auth.js',
  '../../shared/js/catalog.js',
  '../../shared/js/utils.js',
  './manifest.json'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Solo cachear peticiones GET del mismo origen
  if (e.request.method !== 'GET') return;
  // No interceptar rutas del panel administrativo
  var url = new URL(e.request.url);
  if (url.pathname.indexOf('/apps/admin/') !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(response){
        // No cachear respuestas de error
        if (!response || response.status !== 200) {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return response;
      });
    })
  );
});
