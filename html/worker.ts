/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />

import type Dexiee from 'dexie';

self.importScripts('dexie.js');

declare const Dexie;
declare const self: ServiceWorkerGlobalScope;

const ___PREFIX_URL___ = self.registration.scope.substring(0, -1);
const cacheName = 'Serv_ Player Cache';
const videoFiles = 'Serv_ Player VideoData';

class DataBase extends Dexie {
    videos: Dexiee.Table<IVideos, number>;
    metaData: Dexiee.Table<IMetaData, number>;
    
    constructor (databaseName) {
        super(databaseName, { autoOpen: true });
        this.version(1).stores({
            videos: '&path',
            metaData: '&path, name, type, watchList, stars'
        });
        this.videos = this.table('videos');
        this.metaData = this.table('metaData');
    }
}

export type IVideos = {
    path: string,
    data: string|ArrayBuffer
}

export type IMetaData = {
    path: string,
    name: string,
    type: string,
    image: string,
    watchList: boolean,
    stars: number,
    timestemp?: number
}

export type IMessageType = 'download' | 'metaData' | 'all' | 'videoItem' | 'delete';

export type IMessageData<T> = {
    type: IMessageType,
    data: T
}

export type IMessageDownload = {
    token: string,
    path: string
}

const database = new DataBase(videoFiles);

const assetsToCache = [
    '/icon',
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
    'https://kit-free.fontawesome.com/releases/latest/css/free.min.css',
    '/manifest',
    '/favicon.ico'
].map(a => ___PREFIX_URL___ + a);

const allowedAPIRequests = [
    '/api/getSortTypes/',
];

const customAPIResponse = [
    {
        name: '/api/checkToken/',
        res: new Response(JSON.stringify({
            active: false,
            perm: 'Admin',
            username: 'Admin'
        }), {
            status: 200,
            statusText: 'allowsSinceOffline',
        }),
        test: () => !navigator.onLine
    }
];

const reloadPage = () => console.log('reload');

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(  
        Promise.all([
            caches.open(cacheName).then((cache) => {
                if (navigator.onLine)
                    cache.addAll(assetsToCache).catch(er => console.error(er));
            }).catch((er) => {
                console.error('Cant open cache', er, event);
            }),
            database.open()
        ])
    );
});
    
    
self.addEventListener('fetch', (ev) => ev.respondWith(fetchHandler(ev)));
    
const fetchHandler = async (ev: FetchEvent): Promise<Response> => {
    const url = new URL(ev.request.url);
    url.searchParams.delete('token');
    const request = new Request(url.toString(), {
        method: ev.request.method
    });
    
    const isAPIEndpoint = url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/');

    if (isAPIEndpoint && customAPIResponse.some(a => a.name === url.pathname)) {
        const customAPI = customAPIResponse.find(a => a.name === url.pathname);
        if (customAPI.test())
            return customAPI.res;
    }

    if (request.method !== 'GET')
        return fetch(ev.request);
            
    if (url.pathname.startsWith('/video/') && !url.pathname.endsWith('.jpg'))
        return fetch(ev.request);
            
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
    const data = ev.data as IMessageData<any>;
    switch (data.type) {
    case 'download':
        const downloadData = ev.data as IMessageData<IMessageDownload>;
        const url = new URL(self.location.origin + `${___PREFIX_URL___}/api/getMetaData`);
        url.searchParams.set('path', downloadData.data.path);
        url.searchParams.set('token', downloadData.data.token);
        const metaRequest = await (await fetch(url.toString())).json();
        await database.metaData.put({
            path: metaRequest.Path,
            image: metaRequest.image,
            name: metaRequest.name,
            type: metaRequest.type,
            stars: metaRequest.stars,
            watchList: metaRequest.watchList,
            timestemp: metaRequest.timeStemp
        });
        await database.videos.put({
            data: await requestToBase64(`/video/${downloadData.data.path}`, { credentials: 'same-origin' }, port),
            path: downloadData.data.path
        });
        break;
    case 'metaData':
        const metaDataRes = database.metaData.where('path').equals(data.data);
        if (await  metaDataRes.count() > 0)
            port.postMessage(await metaDataRes.first());
        else 
            port.postMessage([]);
        break;
    case 'all':
        const allMetaData = await database.metaData.where('path').startsWith(data.data).toArray();
        port.postMessage(allMetaData);
        break;
    case 'videoItem':
        const videoData = database.videos.where('path').equals(data.data);
        if (await videoData.count() > 0)
            port.postMessage(await videoData.first());
        else 
            port.postMessage(null);
        break;
    case 'delete':
        const deleteRes = await database.videos.where('path').equals(data.data).delete();
        await database.metaData.where('path').equals(data.data).delete();
        port.postMessage(deleteRes);
        break;
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
        }).then( blob => new Promise<string|ArrayBuffer>(callback =>{
            const reader = new FileReader() ;
            reader.onload = function(){ callback(this.result); } ;
            reader.readAsDataURL(blob) ;
        }));
};

self.addEventListener('unhandledrejection', (er) => {
    console.trace(er.reason);
});

self.addEventListener('error', (er) => {
    console.trace(er);
});
