import io from 'socket.io-client';
import { EventEmitter, fetchBackend, loadCookie } from '../generalFunctions';

const video = document.querySelector('video');
const info = document.getElementById('info');

let skiped = false;
const WaitToHideTime = 1000;
let infoProgress: HTMLParagraphElement;

const stateHandler = new EventEmitter();

const socket = io({
    auth: {
        token: loadCookie('token')
    }
});

socket.on('error', (err:string, critical:boolean) => {
    stateHandler.emit("error", "socketIO", err)
    console.log(`[SocketIO] Recived error: ${err}`);
    if (critical)
        socket.disconnect();
});

socket.on("connect", () => stateHandler.emit("SocketIOConnection"))

fetchBackend('/api/checkToken/', {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
        'token' : loadCookie('token')
    }),
    method: 'POST'
}, undefined, true, false);

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

if (!urlParams.get("roomID"))
    if (!video.canPlayType(getVideoType(urlParams.get('path').split('.').pop()))) {
        video.src = '/video/' + urlParams.get('path') + '.mp4';
        socket.on(urlParams.get('path') + '.mp4', (data) => {
            switch (data.type) {
            case 'error':
                console.error(data.data);
                showError();
                break;
            case 'progress':
                if (!infoProgress) {
                    infoProgress = document.createElement('p');
                    info.appendChild(infoProgress);
                }
                infoProgress.innerHTML = Math.ceil(data.data * 100) / 100 + '%';
                break;
            case 'finish':
                if (!video.src)
                    video.src = '/video/' + urlParams.get('path') + '.mp4';
            }
        });

        socket.emit('transcodeStatus', encodeURIComponent(urlParams.get('path')) + '.mp4', (res) => {
            console.log(res.type);
            switch (res.type) {
            case 'error':
                showError();
                break;
            case 'ready':
                video.src = '/video/' + urlParams.get('path') + '.mp4';
                break;
            case 'notFound':
                socket.emit('startTranscoding', urlParams.get('path') + '.mp4');
                break;
            }
        });
    } else {
        video.src = '/video/' + urlParams.get('path');
    }


const togglePlayPause = () => {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

video.addEventListener('loadeddata', function () {
    info.style.display = 'none';
    if (!skiped) {
        const url = new URL(window.location.origin + '/api/getTime/');
        url.search = new URLSearchParams({
            'token': loadCookie('token'),
            'path': urlParams.get('path')
        }).toString();
        fetchBackend(url.toString(), {
            headers: {
                'content-type' : 'application/json; charset=UTF-8'
            },
            method: 'GET'
        }, res => {
            if (res !== 0) {
                video.currentTime = (video.duration * res);
                skiped = true;
            }
        }, true, false);
    }
    video.play();
});

function getVideoType(filenameExtension) {
    switch (filenameExtension) {
    case 'ogg':
        return 'application/ogg';
    case 'ogv':
        return 'video/ogg';
    default:
        return 'video/' + filenameExtension;
    }
}

function showError(message = undefined) {
    while (info.lastChild != null)
        info.removeChild(info.lastChild);
    const title = document.createElement('p');
    title.style.color = 'red';
    title.innerHTML = 'An error occured';
    title.style.fontSize = '150%';
    const msg = document.createElement('P');
    msg.innerHTML = 'You may now reload the page';
    if (message)
        msg.innerHTML = msg.innerHTML += '\n' + message;
    info.appendChild(title);
    info.appendChild(msg);
}

export { video, socket, stateHandler, togglePlayPause, WaitToHideTime, urlParams }