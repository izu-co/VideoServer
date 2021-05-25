const cacheName = 'Serv_ Player Cache';

const assetsToCache = [
    '/icon',
    '',
    '/js/generalFunctions.js',
    '/style/index.css',
    '/style/generalStyle.css',
    '/js/index.js',
    '/fonts/AXIS_Extra_Bold_800.otf'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(  
        caches.open(cacheName).then((cache) => {
            assetsToCache.forEach(asset => {
                console.log('Started chaching', asset);
                cache.add(asset).catch(er => {
                    console.log(asset, er, event);
                }).then(() => {
                    console.log('Cached', asset, event);
                });
            });
        }).catch((er) => {
            console.error('Cant open cache', er, event);
        })
    );
});