import io from 'socket.io-client';
import { fetchBackend, loadCookie } from './generalFunctions';
import { SkipData } from '../../interfaces';

const video = document.querySelector('video');
const container = document.getElementById('c-video');
const bar = document.getElementById('orange-juice');
const barContainer = document.getElementById('orange-bar');
const buttonPlay = document.getElementById('play-pause');
const sound = document.getElementById('volume');
const soundbar = <HTMLInputElement> document.getElementById('volumeSlider');
const time = document.getElementById('timeText');
const TimeTooltipBar = document.getElementById('TimeBar');
const tooltip = document.getElementById('tooltiptext');
const fullScreenButton = document.getElementById('fullscreen');
const skipButton = document.getElementById('SkipButton');
const next = <HTMLButtonElement> document.getElementById('next');
const controls = document.getElementById('controls');
const info = document.getElementById('info');

let mouseDown = false;
let skiped = false;
let timer: NodeJS.Timeout;
const WaitToHideTime = 1000;
let infoProgress: HTMLParagraphElement;
const socket = io();

document.body.onmousedown = function() { 
    mouseDown = true;
};

document.body.onmouseup = function() {
    mouseDown = false;
};

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

if (!video.canPlayType(getVideoType(urlParams.get('path').split('.').pop()))) {
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

const fileDataURL = new URL(window.location.origin + '/api/FileData/');
fileDataURL.search = new URLSearchParams({
    'token' : loadCookie('token'),
    'path':  urlParams.get('path')
}).toString();

fetchBackend(fileDataURL.toString(), {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    method: 'GET'
}, res => loadData(res), false, false);

function loadData(res: SkipData) {
    document.title = res['current'].split(res['pathSep']).pop();


    if (res['skip']['startTime'] !== -1 && res['skip']['startTime'] !== -1) {
        skipButton.addEventListener('click', function() {
            video.currentTime = res['skip']['stopTime'];
        });

        video.addEventListener('timeupdate', function() {
            const start = res['skip']['startTime'];
            const stop = res['skip']['stopTime'];
            const currTime = Math.round(video.currentTime);
            if (currTime > start && currTime < stop)
                skipButton.className = 'allowed';
            else
                skipButton.className = 'denied';
        });
    }

    if (res.next) {
        next.style.opacity = '1';
        next.addEventListener('click', function() {
            const nextURL = new URL(document.location.href)
            nextURL.search = new URLSearchParams({
                path: res.next
            }).toString()
            document.location.href = nextURL.toString()
        });
    } else 
        next.disabled = true;
    
}

document.body.onkeyup = function(e){
    if(e.keyCode == 32){
        togglePlayPause();
    } else if (e.keyCode == 122) {
        togglefullScreen();
    } else if (e.keyCode === 39) {
        Move();
        video.currentTime = (video.currentTime + 10 > video.duration) ? video.duration : video.currentTime + 10;
    } else if (e.keyCode == 37) {
        Move();
        video.currentTime = (video.currentTime - 10 < 0) ? 0 : video.currentTime - 10;
    }
};

video.onplay = function() {
    buttonPlay.className = video.paused ? 'pause' : 'play';
};

function togglePlayPause() {
    if (video.paused) {
        buttonPlay.className = 'pause';
        video.play();
    } else {
        buttonPlay.className = 'play';
        video.pause();
    }
}

const url = new URL(window.location.origin + '/api/getUserData/');
url.search = new URLSearchParams({
    'token': loadCookie('token')
}).toString();

fetchBackend(url.toString(), {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    method: 'GET'
}, res => {
    video.volume = res['volume'] / 100;
    soundbar.value = res['volume'];
}, true, false);

soundbar.onchange = function() {
    video.volume = parseFloat(soundbar.value) / 100;
    if (parseFloat(soundbar.value) === 0)
        sound.className = 'muted';
    else
        sound.className = 'unmuted';
};

barContainer.addEventListener('click', getClickPosition, false);

TimeTooltipBar.addEventListener('mousemove', function(e) {
    const width = (e.clientX  - (this.offsetLeft + (<HTMLElement>this.offsetParent).offsetLeft)) / this.offsetWidth;
    const time = width * video.duration;
    const mincur = Math.floor(time / 60);
    let seccur: number|string = Math.floor(time % 60);
    if (seccur < 10)
        seccur = '0' + seccur;
    tooltip.innerHTML = mincur + ':' + seccur;
    if (e.offsetX > 70 && TimeTooltipBar.offsetWidth - e.offsetX > 70) 
        tooltip.style.left = e.offsetX + 'px';
    else if (e.offsetX < 70 )  
        tooltip.style.left = 70 + 'px';
    else if (TimeTooltipBar.offsetWidth - e.offsetX < 70)
        tooltip.style.left = (TimeTooltipBar.offsetWidth - 70) + 'px';

    if (mouseDown) {
        video.currentTime = time;
        if (seccur < 10)
            seccur = '0' + seccur;
        tooltip.innerHTML = mincur + ':' + seccur;
    }

}, false); 

function getClickPosition(e) {
    if (e.target === barContainer || e.target === bar || e.target === document.getElementById('TimeBar')) {
        const width = (e.clientX  - (this.offsetLeft + this.offsetParent.offsetLeft)) / this.offsetWidth;
        const time = width * video.duration;
        video.currentTime = time;
        const mincur = Math.floor(time / 60);
        let seccur:number|string = Math.floor(time % 60);
        if (seccur < 10)
            seccur = '0' + seccur;
        tooltip.innerHTML = mincur + ':' + seccur;
    }
}

video.addEventListener('click', function() {
    togglePlayPause();
});

sound.onclick = function() {
    if (video.muted) {
        video.muted = false;
        sound.className = 'unmuted';
    } else {
        video.muted = true;
        sound.className = 'muted';
    }
};

buttonPlay.onclick = function() {
    togglePlayPause();
};

let last = 0;

video.addEventListener('timeupdate', function() {
    const barPos = video.currentTime / video.duration;
    bar.style.width = barPos * 100 + '%';

    const currTime = Math.round(video.currentTime);
    const dur = Math.round(video.duration);

    const min = Math.floor(dur / 60);
    let sec:number|string = Math.floor(dur % 60);

    const mincur = Math.floor(currTime / 60);
    let seccur:number|string = Math.floor(currTime % 60);

    if (sec < 10)
        sec = '0' + sec;
    if (seccur < 10)
        seccur = '0' + seccur;

    time.innerHTML = mincur + ':' + seccur + ' / ' + min + ':' + sec;
    if (video.ended)
        buttonPlay.className = 'play';
    const timePer = Math.floor(video.currentTime / video.duration * 100) / 100;
    if (timePer !== last) {
        last = timePer;
        fetchBackend('/api/setTime/', {
            headers: {
                'content-type' : 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                'token' : loadCookie('token'),
                'percent' : timePer,
                'path' : urlParams.get('path')
            }),
            method: 'PUT'
        }, undefined, false, false);

    }
});


const timeout = function () {
    controls.className = 'hide';
    controls.style.cursor = 'none';
    video.style.cursor = 'none';
};

timer = setTimeout(timeout, WaitToHideTime);

function Move() {
    clearTimeout(timer);
    timer = setTimeout(timeout, WaitToHideTime);
    controls.className = 'show';
    controls.style.cursor = 'auto';
    video.style.cursor = 'auto';
}

container.onmousemove = Move;
container.onclick = Move;


fullScreenButton.addEventListener('click', function() {
    togglefullScreen();    
});

function togglefullScreen() {
    if (document.fullscreen) 
        document.exitFullscreen();
    else 
        container.requestFullscreen();
}

document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreen) 
        fullScreenButton.className = 'isnot';
    else 
        fullScreenButton.className = 'is';
});

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