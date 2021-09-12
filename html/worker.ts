/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />

import type Dexiee from 'dexie';

self.importScripts('dexie.js');

declare const Dexie;
declare const self: ServiceWorkerGlobalScope;

const cacheName = 'Serv_ Player Cache';
const videoFiles = 'Serv_ Player VideoData';

class DataBase extends Dexie {
    videos: Dexiee.Table<IVideos, number>;
    metaData: Dexiee.Table<IMetaData, number>;
    
    constructor (databaseName) {
        super(databaseName, { autoOpen: true });
        this.version(1).stores({
            videos: '&path',
            metaData: '&path, name, type',
            apiCache: '&name'
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

type IMessageType = 'download';

type IMessageData = {
    type: IMessageType,
    data: any
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
    '/api/getSortTypes/',
];

const customAPIResponse = [
    {
        name: '/api/checkToken',
        res: new Response(JSON.stringify({
            active: false,
            perm: "Admin",
            username: "Admin"
        }), {
            status: 200,
            statusText: 'allowsSinceOffline',
        }),
        test: () => !navigator.onLine
    }
]

const reloadPage = () => console.log('reload');

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(  
        Promise.all([
            caches.open(cacheName).then((cache) => {
                const chacheData = [];
                assetsToCache.map(async asset => {
                    await cache.add(asset).catch(er => {
                        chacheData.push({
                            path: asset,
                            has: false,
                            error: er
                        });
                    }).then(() => {
                        chacheData.push({
                            path: asset,
                            has: true,
                            error: undefined
                        });
                    });
                });
            }).catch((er) => {
                console.error('Cant open cache', er, event);
            }),
            database.open()
        ])
    );
});
    
    
self.addEventListener('fetch', (ev) => fetchHandler(ev));
    
const fetchHandler = async (ev: FetchEvent): Promise<Response> => {
    const url = new URL(ev.request.url);
    url.searchParams.delete('token');
    const request = new Request(url.toString(), {
        method: ev.request.method
    });
    
    if (request.method !== 'GET')
        return fetch(ev.request);
            
    if (url.pathname.startsWith('/video/') && !url.pathname.endsWith('.jpg'))
        return fetch(ev.request);
            
    const isAPIEndpoint = url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/');

    if (isAPIEndpoint && customAPIResponse.some(a => a.name === url.pathname)) {
        const customAPI = customAPIResponse.find(a => a.name === url.pathname);
        if (customAPI.test())
            return customAPI.res;
    }

    const item = await caches.match(request);
    if (!item && (!isAPIEndpoint || allowedAPIRequests.includes(url.pathname))) {
        const res = await fetch(ev.request, { credentials: 'same-origin' });
        if (res.status === 200) {
            (await caches.open(cacheName)).put(request, res.clone());
            console.log('Cached', url);
        }
        return res;
    } else {
        return item || fetch(ev.request);
    }
};

self.addEventListener('offline', reloadPage);
self.addEventListener('online', reloadPage);
    
self.addEventListener('message', async (ev) => {
    const port = ev.ports[0];
    const data = ev.data as IMessageData;
    switch (data.type) {
    case 'download':
        await database.videos.put({
            data: await requestToBase64(data.data, { credentials: 'same-origin' }, port),
            path: data.data
        });
    }
});
    
self.addEventListener('activate', (ev) => {
    ev.waitUntil(self.clients.claim());
});
    
const requestToBase64 = (url: string, options?: RequestInit, port?: MessagePort) => {
    return fetch(url, options)
        .then(async response => {
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            let receivedLength = 0;
            const chunks = [];
            while(true) {
                const {done, value} = await reader.read();

                if (done) {
                    break;
                }
                chunks.push(value);
                receivedLength += value.length;
                port.postMessage({
                    finished: false,
                    percent: receivedLength / contentLength,
                    received: receivedLength,
                    total: contentLength
                });
            }

            port.postMessage({
                finished: true,
                percent: 1,
                received: receivedLength,
                total: contentLength
            });

            return new Blob(chunks);
        }).then( blob => new Promise<string>(callback =>{
            const reader = new FileReader() ;
            reader.onload = function(){ callback(this.result as string); } ;
            reader.readAsDataURL(blob) ;
        }));
};

self.addEventListener('unhandledrejection', (er) => {
    console.trace(er.reason);
});

self.addEventListener('error', (er) => {
    console.trace(er);
});