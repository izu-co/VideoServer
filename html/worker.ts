/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />

import type Dexiee from "dexie";

self.importScripts('dexie.js')

declare const Dexie;
declare const self: ServiceWorkerGlobalScope

const cacheName = 'Serv_ Player Cache'
const videoFiles = 'Serv_ Player VideoData'

class DataBase extends Dexie {
    videos: Dexiee.Table<IVideos, number>;
    metaData: Dexiee.Table<IMetaData, number>;

    constructor (databaseName) {
        super(databaseName, { autoOpen: true });
        this.version(1).stores({
            videos: '&path',
            metaData: '&path, name, type'
        });
        this.videos = this.table('videos');
        this.metaData = this.table('metaData');
    }
}

type IVideos = {
    path: string,
    data: string
}

type IMetaData = {
    path: string,
    name: string,
    type: string,
    image: string
}

const database = new DataBase(videoFiles);


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
    '/api/getSortTypes/'
]

const reloadPage = () => console.log('reload');

self.addEventListener('install', (event) => {
    console.log("install", event)
    event.waitUntil(  
        Promise.all([
            caches.open(cacheName).then((cache) => {
                let chacheData = [];
                assetsToCache.map(async asset => {
                    await cache.add(asset).catch(er => {
                        chacheData.push({
                            path: asset,
                            has: false,
                            error: er
                        })
                    }).then(() => {
                        chacheData.push({
                            path: asset,
                            has: true,
                            error: undefined
                        })
                    });
                });
                console.table(chacheData);
            }).catch((er) => {
                console.error('Cant open cache', er, event);
            }),
            database.open()
        ])
    );
});


self.addEventListener('fetch', (ev) => fetchHandler(ev))

const fetchHandler = async (ev: FetchEvent): Promise<Response> => {
    const url = new URL(ev.request.url);
    console.log(url.toString());
    let isAPIEndpoint = url.pathname.startsWith('/api/');
    let item = await caches.match(ev.request);
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