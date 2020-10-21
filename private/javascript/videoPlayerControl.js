var video = document.querySelector('video');
var container = document.getElementById("c-video")
var bar = document.getElementById('orange-juice');
var barContainer = document.getElementById('orange-bar')
var buttonPlay = document.getElementById('play-pause');
var sound = document.getElementById('volume');
var soundbar = document.getElementById('volumeSlider');
var time = document.getElementById('timeText');
var TimeTooltipBar = document.getElementById('TimeBar')
var tooltip = document.getElementById('tooltiptext')
var fullScreenButton = document.getElementById('fullscreen')
var mouseDown = 0;
var standartLaustärke = 30;
var skiped = false;
var skipButton = document.getElementById('SkipButton')
var timer;
var controls = document.getElementById('controls')
var WaitToHideTime = 1000;
var next = document.getElementById('next')

document.body.onmousedown = function() { 
    ++mouseDown;
}
document.body.onmouseup = function() {
    --mouseDown;
}


var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString)

video.src = "/video/" + urlParams.get("path");

fetchBackend('/backend/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, () => {}, true, false)

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
    } else {
        next.style.opacity = 0.4
        next.addEventListener("click", function() {
            alert("Es wurde keine nächste Folge gefunden!")
        })
    }
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

function loadCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
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
            console.log(res)
            if (res !== 0) {
                togglePlayPause()
                if (window.confirm("Möchtest du da weitermachen wo du das letzte mal aufgehört hast?")) {
                    video.currentTime = (video.duration * res)
                    skiped = true;
                    togglePlayPause()
                }
            }
        }, true, false)
})

/**
 * @param {string} url 
 * @param {object} options 
 * @param {boolean} sendBack
 * @param {boolean} DoAlert
 * @param {Function} callback
 * @returns {Promise<any>}
 */
function fetchBackend(url, options, callback, sendBack = true, DoAlert = false) {
    fetch(url, options).then(data => data.json())
    .then(res => {
        if (!res["status"]) {
            if (sendBack)
                document.location.href = "/"
            else
                if (DoAlert)
                    alert("Something went wrong\n" + res["reason"])
        } else
            callback(res["data"])
    })
    .catch(error => console.log(error))
}