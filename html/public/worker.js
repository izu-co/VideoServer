const cacheName = 'Serv_ Player Cache'

const assetsToCache = [
    '/icon',
    '',
    '/css.css',
    '/js.js',
    '/fonts/AXIS_Extra_Bold_800.otf'
]

self.addEventListener('fetch', function(event) {
    if (event.request.method !== "GET")
        return;
    event.respondWith(
        caches.open(cacheName).then(function(cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function(response) {
                    if (response.status === 206)
                        return response;
                    cache.put(event.request, response.clone());
                    return response;
                }).catch((er) => {
                    console.error('Cant fetch', er, event)
                })
            }).catch((er) => {
                console.error('Cant match', er, event)
            })
        }).catch((er) => {
            console.error('Cant open cache', er, event)
        })
    );
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(  
        caches.open(cacheName).then((cache) => {
            assetsToCache.forEach(asset => {
                console.log("Started chaching", asset)
                cache.add(asset).catch(er => {
                    console.log(asset, er, event)
                }).then(() => {
                    console.log("Cached", asset, event)
                })
            })
        }).catch((er) => {
            console.error('Cant open cache', er, event)
        })
    );
});