const cacheName = 'Serv_ Player Cache'

const assetsToCache = [
    '/icon',
    '',
    '/css.css',
    '/js.js',
    '/fonts/AXIS_Extra_Bold_800.otf'
]

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.open(cacheName).then(function(cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function(response) {
            if (event.request.method === "GET")
                cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
});

self.addEventListener('install', ( event ) => {
    self.skipWaiting();
    event.waitUntil(  
        caches.open(cacheName).then((cache) => {
            assetsToCache.forEach(asset => {
                console.log("Started chaching", asset)
                cache.add(asset).catch(er => {
                    console.log(asset, er)
                }).then(() => {
                    console.log("Cached", asset)
                })
            })
        })
    );
});