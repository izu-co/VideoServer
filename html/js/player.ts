import io from 'socket.io-client';
import { fetchBackend, loadCookie, multipleResponseMessageToWorker, sendMessageToWorker, b64toBlob, testMobile } from './generalFunctions';
import { SkipData } from '../../interfaces';
import type { IVideos } from '../worker';
declare let ___PREFIX_URL___: string;

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
const downloadButton = document.getElementById('download')
downloadButton.classList.add("loading");
const downloadDiv = document.getElementById('downloadDiv')
const progressRing = document.getElementById('progressRing') as unknown as SVGCircleElement

const radius = progressRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = `${circumference}`;

const setProgress = (percent: number) => {
    const offset = circumference - percent / 100 * circumference;
    progressRing.style.strokeDashoffset = `${offset}`;
}

let mouseDown = false;
let skiped = false;
let timer: NodeJS.Timeout;
const WaitToHideTime = 1000;
let infoProgress: HTMLParagraphElement;

document.body.onmousedown = function() { 
    mouseDown = true;
};

document.body.onmouseup = function() {
    mouseDown = false;
};
fetchBackend(`${___PREFIX_URL___}/api/checkToken/`, {
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

(async () => {
    if (navigator.onLine) {
        const socket = io({
            path: ___PREFIX_URL___ + '/socket.io'
        });
        if (!video.canPlayType(getVideoType(urlParams.get('path').split('.').pop()))) {
            video.src = `${___PREFIX_URL___}/video/` + urlParams.get('path') + '.mp4';
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
                        video.src = `${___PREFIX_URL___}/video/` + urlParams.get('path') + '.mp4';
                }
            });
        
            socket.emit('transcodeStatus', encodeURIComponent(urlParams.get('path')) + '.mp4', (res) => {
                console.log(res.type);
                switch (res.type) {
                case 'error':
                    showError();
                    break;
                case 'ready':
                    video.src = `${___PREFIX_URL___}/video/` + urlParams.get('path') + '.mp4';
                    break;
                case 'notFound':
                    socket.emit('startTranscoding', urlParams.get('path') + '.mp4');
                    break;
                }
            });
        } else {
            video.src = `${___PREFIX_URL___}/video/` + urlParams.get('path');
        }
    } else {
        const res = await sendMessageToWorker({
            type: 'videoItem',
            data: decodeURIComponent(urlParams.get('path'))
        })
        if (res) {
            const videoRes = res as IVideos;
            if (videoRes.data instanceof ArrayBuffer) {
                video.src = URL.createObjectURL(new Blob([videoRes.data]))
                return;
            }
            const parts = videoRes.data.split(',');
            video.src = URL.createObjectURL(b64toBlob(parts[1], parts[0].substring(5)))
            
        } else {
            alert("Video not found. Playing is not an option while offline!")
        }
    }
})();


const fileDataURL = new URL(window.location.origin + `${___PREFIX_URL___}/api/FileData`);
fileDataURL.search = new URLSearchParams({
    'token' : loadCookie('token'),
    'path':  urlParams.get('path')
}).toString();

if (navigator.onLine)
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
            const nextURL = new URL(window.location.origin + `${___PREFIX_URL___}` + document.location.href);
            nextURL.search = new URLSearchParams({
                path: res.next
            }).toString();
            document.location.href = nextURL.toString();
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
        move();
        video.currentTime = (video.currentTime + 10 > video.duration) ? video.duration : video.currentTime + 10;
    } else if (e.keyCode == 37) {
        move();
        video.currentTime = (video.currentTime - 10 < 0) ? 0 : video.currentTime - 10;
    }
};

video.onplay = () => buttonPlay.className = video.paused ? 'play' : 'pause';
video.onpause = () => buttonPlay.className = video.paused ? 'play' : 'pause';

function togglePlayPause() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

const url = new URL(window.location.origin + `${___PREFIX_URL___}/api/getUserData/`);
url.search = new URLSearchParams({
    'token': loadCookie('token')
}).toString();

if (navigator.onLine)
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
    const timePer = Math.floor(video.currentTime / video.duration * 100) / 100;
    if (timePer !== last && navigator.onLine) {
        last = timePer;
        fetchBackend(`${___PREFIX_URL___}/api/setTime/`, {
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
    downloadButton.classList.add("hide");
    controls.className = 'hide';
    controls.style.cursor = 'none';
    video.style.cursor = 'none';
};

const move = () => {
    clearTimeout(timer);
    if (testMobile())
        return;
    timer = setTimeout(timeout, WaitToHideTime);
    downloadButton.classList.remove("hide")
    controls.className = 'show';
    controls.style.cursor = 'auto';
    video.style.cursor = 'auto';
}

if (!testMobile()) {
    timer = setTimeout(timeout, WaitToHideTime);

    container.onmousemove = move;
    container.onclick = move;
}

fullScreenButton.addEventListener('click', function() {
    togglefullScreen();    
});

function togglefullScreen() {
    if (document.fullscreen) 
        document.exitFullscreen();
    else {
        if (!testMobile()) {
            container.requestFullscreen();
        } else {
            if (video['requestFullscreen'])
                video['requestFullscreen']()
            else 
                video['webkitRequestFullScreen']()
        }
    }
}

document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreen) 
        fullScreenButton.className = 'isnot';
    else 
        fullScreenButton.className = 'is';
});

video.addEventListener('loadeddata', async () => {
    info.style.display = 'none';
    downloadButton.classList.remove("loading")

    if (!skiped && navigator.onLine) {
        const url = new URL(window.location.origin + `${___PREFIX_URL___}/api/getTime/`);
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

const checkDownloadExists = async () => {
    const res = await sendMessageToWorker({
        type: 'videoItem',
        data: decodeURIComponent(urlParams.get('path'))
    })
    
    return res == null ;
}

const updateButtonState = async () => {
    if (await checkDownloadExists()) {
        
    } else {
        downloadButton.classList.remove('already');
    }
};


document.addEventListener("load", updateButtonState);

downloadButton.addEventListener("click", async () => {
    if (await checkDownloadExists()) {
        if (window.confirm("Do you want to delete the video?")) {
            console.log(await sendMessageToWorker({
                type: 'delete',
                data: decodeURIComponent(urlParams.get('path'))
            }))
            await updateButtonState()
        } else {
            return;
        }
    } else {
        if (navigator.onLine) {
            downloadDiv.className = "downloadProgress"
            
            const res = multipleResponseMessageToWorker({
                type: "download",
                data: {
                    path: urlParams.get('path'),
                    token: loadCookie('token')
                }
            });
            let last: number;
            res.addEventListener("message", async (data) => {
                const msg = data as CustomEvent;
                if (last > +(msg.detail.percent as number).toFixed(2)) {
                    last = +(msg.detail.percent as number).toFixed(2);
                    console.log(`${msg.detail.received}/${msg.detail.total} (${msg.detail.percent})`);
                }

                setProgress(msg.detail.percent * 100);

                if (msg.detail.finished) {
                    downloadDiv.className = "download"
                    await updateButtonState();
                }
            })
        } else {
            alert("No internet connection found")
        }
    }
})
