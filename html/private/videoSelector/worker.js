importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

workbox.routing.registerRoute(
    ({request}) => {
        console.log(request.destination)
        return request.destination === 'image'
    },
    new workbox.strategies.CacheFirst()
);