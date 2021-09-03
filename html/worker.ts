/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />

import { openIDBDatabase } from "./js/generalFunctions";

declare const self: ServiceWorkerGlobalScope

const cacheName = 'Serv_ Player Cache'
const videoFiles = 'Serv_ Player VideoData'

const assetsToCache = [
    '/icon',
    '.',
    '/',
    '/index.html',
    '/js/generalFunctions.js',
    '/style/index.css',
    '/style/generalStyle.css',
    '/js/login.js',
    '/fonts/AXIS_Extra_Bold_800.otf',
    '/js/player.js',
    '/js/videoSelector.js',
    '/videoSelector',
    '/player',
    '/style/player.css',
    '/style/videoSelector.css',
    '/style/videoSelectorFooter.css',
    'https://kit-free.fontawesome.com/releases/latest/css/free.min.css'
];

const allowedAPIRequests = [
    
]

const reloadPage = () => console.log('reload');

self.addEventListener('install', (event) => {
    event.waitUntil(  
        caches.open(cacheName).then((cache) => {
            assetsToCache.forEach(asset => {
                console.log('Started chaching', asset);
                cache.add(asset).catch(er => {
                    console.log(asset, er);
                }).then(() => {
                    console.log('Cached', asset);
                });
            });
        }).catch((er) => {
            console.error('Cant open cache', er, event);
        })
    );
    event.waitUntil(async () => {
        const db = await openIDBDatabase(videoFiles);
        console.log(db);
        const videos = db.createObjectStore('videos');
        videos.createIndex('path', 'path', { unique: true });
        videos.createIndex('data', 'data');
        const metaData = db.createObjectStore('metaData');
        metaData.createIndex('path', 'path', { unique: true });
        metaData.createIndex('image', 'image');
        metaData.createIndex('name', 'name');
        metaData.createIndex('type', 'type');
        metaData.add({ path: '/test.mp4', image: 'binary', 'name': 'test', 'type': 'type' })
    })
});

self.addEventListener('fetch', (ev) => fetchHandler(ev))

const fetchHandler = async (ev: FetchEvent): Promise<Response> => {
    const url = new URL(ev.request.url);
    console.log(url.toString());
    let isAPIEndpoint = url.pathname.startsWith('/api/');
    let item = await caches.match(ev.request);
    console.log(!item && (!isAPIEndpoint || allowedAPIRequests.includes(url.pathname)), item,  !isAPIEndpoint, allowedAPIRequests.includes(url.pathname));
    if (!item && (!isAPIEndpoint || allowedAPIRequests.includes(url.pathname))) {
        let res = await fetch(ev.request);
        if (res.status === 200) {
            (await caches.open(cacheName)).put(ev.request, res.clone());
            console.log('Cached', url)
        }
        return res;
    } else {
        return item || fetch(ev.request);
    }
}

self.addEventListener("offline", reloadPage);
self.addEventListener("online", reloadPage);

self.addEventListener("message", (ev) => {
    console.log(ev.data);
})

self.addEventListener('activate', (ev) => {
    ev.waitUntil(self.clients.claim())
})

export { videoFiles };
export default null;