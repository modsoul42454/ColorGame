var cacheName = 'phaser-v1';
const version = 0.05
var filesToCache = [
  '/',
  '/index.html',
  '/game.js',
  '/dist/phaser.js',
  'js-colormaps/js-colormaps.js'

];
self.addEventListener('install', function(event) {
  console.log('sw install');
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('sw caching files');
      return cache.addAll(filesToCache);
    }).catch(function(err) {
      console.log(err);
    })
  );
});

self.addEventListener('fetch', (event) => {
    console.log('sw fetch');
    console.log(event.request.url);
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      }).catch(function (error) {
        console.log(error);
      })
    );
  });