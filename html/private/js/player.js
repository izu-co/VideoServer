const video = document.querySelector('video');
const container = document.getElementById("c-video")
const bar = document.getElementById('orange-juice');
const barContainer = document.getElementById('orange-bar')
const buttonPlay = document.getElementById('play-pause');
const sound = document.getElementById('volume');
const soundbar = document.getElementById('volumeSlider');
const time = document.getElementById('timeText');
const TimeTooltipBar = document.getElementById('TimeBar')
const tooltip = document.getElementById('tooltiptext')
const fullScreenButton = document.getElementById('fullscreen')
const skipButton = document.getElementById('SkipButton')
const next = document.getElementById('next')
const controls = document.getElementById('controls')
const info = document.getElementById("info")
let mouseDown = false;
let standartLaustärke = 30;
let skiped = false;
let timer;
let WaitToHideTime = 1000;
let infoProgress
const socket = io();

document.body.onmousedown = function() { 
    mouseDown = true;;
}

document.body.onmouseup = function() {
    mouseDown = false;
}

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString)

const videoMainSource = document.createElement("source")
const fallbackSource = document.createElement("source")

videoMainSource.type = "video/" + getVideoType(urlParams.get("path").split("\.").pop())
fallbackSource.src = "/video/" + urlParams.get("path") + ".mp4"
fallbackSource.type = "video/mp4"

console.log(fallbackSource.src)

if (true) {//!video.canPlayType(getVideoType(urlParams.get("path").split("\.").pop()))) {
    socket.on(urlParams.get("path") + ".mp4", (data) => {
        switch (data.type) {
            case "error":
                console.error(data.data)
                showError()
                break;
            case "progress":
                if (!infoProgress) {
                    infoProgress = document.createElement("p")
                    info.appendChild(infoProgress)
                }
                infoProgress.innerHTML = Math.ceil(data.data * 100) / 100 + "%"
                break;
            case "finish":
                if (!video.src)
                    video.src = "/video/" + urlParams.get("path") + ".mp4"
        }
    })

    socket.emit("transcodeStatus", encodeURIComponent(urlParams.get("path")) + ".mp4", (res) => {
        console.log(res.type)
        switch (res.type) {
            case "error":
                showError()
                break;
            case "ready":
                video.src = "/video/" + urlParams.get("path") + ".mp4"
                break;
            case "notFound":
                socket.emit("startTranscoding", urlParams.get("path") + ".mp4")
                break;
        }
    })
} else {
    video.src = "/video/" + urlParams.get("path")
}

fetchBackend('/backend/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, undefined, true, false)

fetchBackend('/backend/FileData/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token"),
        "path":  urlParams.get("path")
    }),
    method: "POST"
}, res => loadData(res), false, false)

function loadData(res) {
    document.title = res["current"].split(res["pathSep"]).pop()


    if (res["skip"]["startTime"] !== -1 && res["skip"]["startTime"] !== -1) {
        skipButton.addEventListener("click", function() {
            video.currentTime = res["skip"]["stopTime"];
        })

        video.addEventListener("timeupdate", function() {
            var start = res["skip"]["startTime"];
            var stop = res["skip"]["stopTime"];
            var currTime = Math.round(video.currentTime)
            if (currTime > start && currTime < stop)
                skipButton.className = "allowed"
            else
                skipButton.className = "denied"
        })
    }

    if (res.hasOwnProperty("next")) {
        next.style.opacity = 1;
        next.addEventListener("click", function() {
            document.location.href = document.location.href.split("?")[0] + "?path=" + res["next"];
        })
    } else 
        next.disabled = true
    
}

document.body.onkeyup = function(e){
    if(e.keyCode == 32){
        togglePlayPause()
    } else if (e.keyCode == 122) {
        togglefullScreen()
    } else if (e.keyCode === 39) {
        Move()
        video.currentTime = (video.currentTime + 10 > video.duration) ? video.duration : video.currentTime + 10;
    } else if (e.keyCode == 37) {
        Move();
        video.currentTime = (video.currentTime - 10 < 0) ? 0 : video.currentTime - 10;
    }
}

video.onplay = function() {
    buttonPlay.className = video.paused ? 'pause' : 'play';
}

function togglePlayPause() {
    if (video.paused) {
        buttonPlay.className = 'pause';
        video.play()
    } else {
        buttonPlay.className = 'play';
        video.pause()
    }
}

fetchBackend('/backend/getUserData/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, res => {
    video.volume = res["volume"] / 100
    soundbar.value = res["volume"]
}, true, false)

soundbar.onchange = function() {
    video.volume = soundbar.value / 100;
    if (soundbar.value === 0)
        sound.className = "muted";
    else
        sound.className = "unmuted";
}

barContainer.addEventListener("click", getClickPosition, false);

TimeTooltipBar.addEventListener("mousemove", function(e) {
    var width = (e.clientX  - (this.offsetLeft + this.offsetParent.offsetLeft)) / this.offsetWidth;
    var time = width * video.duration;
    var mincur = Math.floor(time / 60)
    var seccur = Math.floor(time % 60)
    if (seccur < 10)
        seccur = "0" + seccur
    tooltip.innerHTML = mincur + ":" + seccur;
    if (e.offsetX > 70 && TimeTooltipBar.offsetWidth - e.offsetX > 70) 
        tooltip.style.left = e.offsetX + "px";
    else if (e.offsetX < 70 )  
        tooltip.style.left = 70 + "px";
    else if (TimeTooltipBar.offsetWidth - e.offsetX < 70)
        tooltip.style.left = (TimeTooltipBar.offsetWidth - 70) + "px";

    if (mouseDown) {
        video.currentTime = time;
        if (seccur < 10)
            seccur = "0" + seccur
        tooltip.innerHTML = mincur + ":" + seccur;
    }

}, false) 

function getClickPosition(e) {
    if (e.target === barContainer || e.target === bar || e.target === document.getElementById('TimeBar')) {
        var width = (e.clientX  - (this.offsetLeft + this.offsetParent.offsetLeft)) / this.offsetWidth;
        var time = width * video.duration;
        video.currentTime = time;
        var mincur = Math.floor(time / 60)
        var seccur = Math.floor(time % 60)
        if (seccur < 10)
            seccur = "0" + seccur
        tooltip.innerHTML = mincur + ":" + seccur;
    }
}

video.addEventListener("click", function() {
    togglePlayPause();
})

sound.onclick = function() {
    if (video.muted) {
        video.muted = false;
        sound.className = "unmuted";
    } else {
        video.muted = true;
        sound.className = "muted";
    }
}

buttonPlay.onclick = function() {
    togglePlayPause();
}

var last = 0;

video.addEventListener('timeupdate', function() {
    var barPos = video.currentTime / video.duration;
    bar.style.width = barPos * 100 + "%";

    var currTime = Math.round(video.currentTime)
    var dur = Math.round(video.duration);

    var min = Math.floor(dur / 60)
    var sec = Math.floor(dur % 60)

    var mincur = Math.floor(currTime / 60)
    var seccur = Math.floor(currTime % 60)

    if (sec < 10)
        sec = "0" + sec;
    if (seccur < 10)
        seccur = "0" + seccur;

    time.innerHTML = mincur + ":" + seccur + " / " + min + ":" + sec;
    if (video.ended)
        buttonPlay.className = 'play';
    var timePer = Math.floor(video.currentTime / video.duration * 100) / 100;
    if (timePer !== last) {
        last = timePer;
        fetchBackend('/backend/setTime/', {
            headers: {
                "content-type" : "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "token" : loadCookie("token"),
                "percent" : timePer,
                "path" : urlParams.get("path")
            }),
            method: "POST"
        }, () => {}, false, false)

    }
})


var timeout = function () {
    controls.className = "hide";
    controls.style.cursor = "none";
    video.style.cursor = "none";
}

timer = setTimeout(timeout, WaitToHideTime);

function Move() {
    clearTimeout(timer);
    timer = setTimeout(timeout, WaitToHideTime);
    controls.className = "show";
    controls.style.cursor = "auto";
    video.style.cursor = "auto";
}

container.onmousemove = Move;
container.onclick = Move;


fullScreenButton.addEventListener("click", function() {
    togglefullScreen()    
})

function togglefullScreen() {
    if (document.fullscreen) 
        document.exitFullscreen()
    else 
        container.requestFullscreen()
}

document.addEventListener("fullscreenchange", function() {
    if (!document.fullscreen) 
        fullScreenButton.className = "isnot"
    else 
        fullScreenButton.className = "is"
})

video.addEventListener("loadeddata", function () {
    info.style.display = "none"
    if (!skiped)
        fetchBackend('/backend/getTime/', {
            headers: {
                "content-type" : "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "token" : loadCookie("token"),
                "path" : urlParams.get("path")
            }),
            method: "POST"
        }, res => {
            if (res !== 0) {
                video.currentTime = (video.duration * res)
                skiped = true;
            }
        }, true, false)
    video.play()
})

function getVideoType(filenameExtension) {
    switch (filenameExtension) {
        case "ogg":
            return "application/ogg"
        case "ogv":
            return "video/ogg"
        default:
            return filenameExtension
    }
}

function showError(message = undefined) {
    while (info.lastChild != null)
        info.removeChild(info.lastChild)
    let title = document.createElement("p")
    title.style.color = "red"
    title.innerHTML = "An error occured"
    title.style.fontSize = "150%"
    let msg = document.createElement("P")
    msg.innerHTML = "You may now reload the page"
    if (message)
        msg.innerHTML = msg.innerHTML += "\n" + message
    info.appendChild(title)
    info.appendChild(msg)
}