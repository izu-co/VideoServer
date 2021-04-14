fetchBackend('/backend/checkToken/', {
    headers: {
        "content-type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token": loadCookie("token")
    }),
    method: "POST"
}, res => {
    if (res["perm"] === "Admin")
        document.getElementById("admin").className = ""
    else
        document.getElementById("sortDiv").style.right = "120px"
}, true, false)

var queryString = window.location.search;
let urlParams = new URLSearchParams(queryString)
const container = document.getElementById('container')
const loadMore = document.getElementById('loadMore')
let filter = ""


document.getElementById("admin").addEventListener("click", () => {
    location.href = "/admin"
})

let sort = document.getElementById("sort")

let loading = {
    aInternal: false,
    aListener: function (val) {},
    set a(val) {
        this.aInternal = val;
        this.aListener(val);
    },
    get a() {
        return this.aInternal;
    },
    registerListener: function (listener) {
        this.aListener = listener;
    }
}

loading.registerListener(function (val) {
    let curr = val ? "invis" : "vis"
    let toset = val ? "vis" : "invis"

    document.getElementById("running").classList.remove(curr)
    document.getElementById("running").classList.add(toset)
})

let fileData = {
    fileData: undefined,
    showAmount: 10,
    /**
     * @returns {boolean}
     */
    hasMore: function () {
        if (!this.fileData)
            return false;
        return this.fileData["files"].length > this.showAmount
    },
    loadMore: function() {
        if (this.hasMore()) {
            this.showAmount+=10;
            this.showData();
        }

        if (!this.hasMore())
            loadMore.style.display = "none";
    },
    /**
     * @returns {Promise<void>}
     */
    loadData: async function (path, type = null) {
        loading.a = true
        this.showAmount = 10
        let k = await fetchBackendPromise('/backend/getFiles/', {
            headers: {
                "content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "token": loadCookie("token"),
                "path": path,
                "type": type
            }),
            method: "POST"
        })
        k = await k.json();
        if (!k["status"])
            document.location.href = "/"
        else 
            this.fileData = k["data"]
        loading.a = false;
    },
    /**
     * @returns {void}
     */
    showData: function() {  
        loading.a = true;
        while (container.lastChild != null)
            container.removeChild(container.lastChild)

        if (this.hasMore())
            loadMore.style.display = "inline"
        else 
            loadMore.style.display = "none"
        
        let data = this.fileData["files"];

        data = data.filter(a => a["name"].toLowerCase().includes(filter.toLowerCase()))
        data = data.filter((_, i) => i < this.showAmount)

        data.forEach((file, index) => {
            var header = document.createElement("div");
            var div = document.createElement("div");

            div.className = "Item"

            let tubDiv = document.createElement("div")


            var tub = document.createElement("img");
            tub.className = "tumb"
            tub.src = "/video/" + encodeURI(file["image"]);
            if (index === data.length - 1)
                tub.addEventListener("load", () => setScroll())

            let add = document.createElement("button")
            add.classList.add("watchList")
            add.classList.add(file["watchList"] ? "already" : "add")
            add.addEventListener("click", () => {
                let pathToFetch = "/backend/" + (add.classList.contains("already") ? "removeWatchList" : "addWatchList/");
                fetchBackend(pathToFetch, {
                    headers: {
                        "content-type": "application/json; charset=UTF-8"
                    },
                    body: JSON.stringify({
                        "token": loadCookie("token"),
                        "path": file["Path"]
                    }),
                    method: "POST"
                }, (data) => {
                    if (data === "added") {
                        add.classList.remove("add")
                        add.classList.add("already")
                    } else {
                        add.classList.remove("already")
                        add.classList.add("add")
                    }
                }, false, true)
            })

            const stars = buildStarSVG();
            stars.classList.add("rating")

            const singleStars = stars.getElementsByTagNameNS("http://www.w3.org/2000/svg", "path")

            for (let i = 0; i < singleStars.length; i++) {
                const singleStar = singleStars.item(i);
                if (i < file["stars"])
                    singleStar.classList.add("starSelected")
                else 
                    singleStar.classList.add("notSelected")
                singleStar.addEventListener("mouseenter", (e) => {
                    for (let a = 0; a < singleStars.length; a++)
                        singleStars.item(a).classList.add(a <= i ? "tempSelected" : "tempNotSelected")
                })

                singleStar.addEventListener("click", () => {
                    fetchBackend("/backend/setStars", {
                        headers: {
                            "content-type": "application/json; charset=UTF-8"
                        },
                        body: JSON.stringify({
                            "token": loadCookie("token"),
                            "path": file["Path"],
                            "stars": (i+1)
                        }),
                        method: "POST"
                    }, (data) => {
                        for (let k = 0; k < singleStars.length; k++) {
                            singleStars.item(k).classList = []
                            singleStars.item(k).classList.add(k < data ? "starSelected" : "notSelected")
                        }
                    }, false, true)
                })

                singleStar.addEventListener("mouseleave", (e) => {
                    for (let a = 0; a < singleStars.length ; a++)
                        singleStars.item(a).classList.remove("tempSelected", "tempNotSelected")
                })
            }

            tubDiv.style.position = "relative"
            tubDiv.appendChild(stars);
            tubDiv.appendChild(tub)
            tubDiv.appendChild(add)
            div.appendChild(tubDiv)

            if (file["type"] === "video") {
                var fortschritt = document.createElement("div")
                fortschritt.className = "fortschritt"
                fortschritt.style.width = (file["timeStemp"] * 100) + "%"
                div.appendChild(fortschritt)
            }

            var text = document.createElement("b");

            text.className = "text"
            document.title = urlParams.get('path').split(this.fileData["pathSep"]).pop()

            let textToDisplay = file["name"];
            if (textToDisplay.startsWith(this.fileData["pathSep"])) textToDisplay = textToDisplay.substring(this.fileData["pathSep"].length)

            textToDisplay = textToDisplay.substring(textToDisplay.lastIndexOf(this.fileData["pathSep"]) + 1)

            text.innerText = textToDisplay;

            div.addEventListener("click", function (e) {
                if (!(e.target === this || e.target === tub || e.target === text)) {
                    return;
                }

                if (file["type"] === "folder") {
                    urlParams.set('path', file["Path"])
                    location.href = location.pathname + "?" + urlParams.toString();
                } else {
                    urlParams.set('path', file["Path"])
                    location.href = location.origin + "/player/player.html?" + urlParams.toString();
                }
            })

            div.appendChild(text);
            header.appendChild(div)
            header.className = "showItem";
            container.appendChild(header);
        })

        loading.a = false
    }
}

fileData.loadData(urlParams.get('path')).then(_ => fileData.showData()).catch((er) => alert("An error occured:\n" + er))

fetchBackend('/backend/getSortTypes/', {
    headers: {
        "content-type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token": loadCookie("token")
    }),
    method: "POST"
}, res => {
    res.forEach(a => {
        let option = document.createElement("option")
        option.value = a;
        option.innerHTML = a;
        sort.appendChild(option)
    })
}, true, false)

let last = sort.value;

sort.addEventListener("change", (e) => {
    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString)
    if (loading.a) {
        sort.value = last;
        return;
    }
    last = sort.value;
    fileData.loadData(urlParams.get('path'), e.target.value).then(_ => fileData.showData())
})

window.addEventListener("scroll", () => {
    setCookie("scroll:" + location.search.slice("?path=".length), window.scrollY, location.href)
})

const logoutButton = document.getElementById("logout")
logoutButton.addEventListener("click", () => {
    fetch('/backend/logout', {
            headers: {
                "content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "token": loadCookie("token")
            }),
            method: "POST"
        }).then(data => data.json())
        .then(res => {
            if (res["status"] === true)
                document.location.href = "/"
            else
                alert("Something went wrong")
        })
})

document.getElementById("settings").addEventListener("click", () => {
    location.href = "/settings"
})

document.getElementById("server").addEventListener("click", () => {
    location.href = "/server"
})

function setScroll() {
    let cookie = loadCookie("scroll:" + location.search.slice("?path=".length))
    window.scrollTo({
        top: cookie
    })
}

let lastSearch = ""

document.getElementById("search").addEventListener("input", (e) => {
    filter = e.target.value

    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString)
    if (loading.a) {
        e.target.value = lastSearch;
        return;
    }
    fileData.loadData(urlParams.get('path'), sort.value).then(_ => fileData.showData())
})



document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    filter = new FormData(e.target).get("search")

    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString)
    if (loading.a) {
        e.target.value = lastSearch;
        return;
    }
    lastSearch = filter;
    getFiles(urlParams.get('path'), sort.value)
})


function loadCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * @param {string} cookie The cokkie
 * @param {string} key The string
 * @param {String} path
 */
function setCookie(name, cookie, path) {
    document.cookie = name + "=" + cookie + ";path=" + path;
}

/**
 * @param {Date} expires The date
 * @param {string} cookie The cokkie
 * @param {string} key The string
 * @param {string} path
 */
function setTimeCookie(name, cookie, expires, path) {
    document.cookie = name + "=" + cookie + "; expires=" + expires.toUTCString() + ";path=" + path;
}

/**
 * @param {string} url 
 * @param {object} options 
 * @param {boolean} sendBack
 * @param {boolean} doAlert
 * @param {Function} callback
 */
function fetchBackend(url, options, callback, sendBack = true, doAlert = false) {
    fetch(url, options).then(data => data.json())
        .then(res => {
            if (!res["status"]) {
                if (sendBack)
                    document.location.href = "/"
                else
                if (doAlert)
                    alert("Something went wrong\n" + res["reason"])
            } else
                callback(res["data"])
        })
        .catch(error => console.log(error))
}

/**
 * @param {string} url 
 * @param {object} options 
 */
 function fetchBackendPromise(url, options) {
    return fetch(url, options)
}


/**
 * @returns {HTMLElement}
 */
function buildStarSVG() {
    const svg = getNode("svg", {"width": 500, "height": 100, "viewBox": "0 0 500 100", "xmlsn": "http://www.w3.org/2000/svg"})
    const g = getNode("g", {})
    g.appendChild(getNode("path", {"id": "path1", "d": "M50 0L61.2257 34.5491H97.5528L68.1636 55.9017L79.3893 90.4509L50 69.0983L20.6107 90.4509L31.8364 55.9017L2.44717 34.5491H38.7743L50 0Z"}))
    g.appendChild(getNode("path", {"id": "path2", "d": "M150 0L161.226 34.5491H197.553L168.164 55.9017L179.389 90.4509L150 69.0983L120.611 90.4509L131.836 55.9017L102.447 34.5491H138.774L150 0Z"}))
    g.appendChild(getNode("path", {"id": "path3", "d": "M250 0L261.226 34.5491H297.553L268.164 55.9017L279.389 90.4509L250 69.0983L220.611 90.4509L231.836 55.9017L202.447 34.5491H238.774L250 0Z"}))
    g.appendChild(getNode("path", {"id": "path4", "d": "M350 0L361.226 34.5491H397.553L368.164 55.9017L379.389 90.4509L350 69.0983L320.611 90.4509L331.836 55.9017L302.447 34.5491H338.774L350 0Z"}))
    g.appendChild(getNode("path", {"id": "path5", "d": "M450 0L461.226 34.5491H497.553L468.164 55.9017L479.389 90.4509L450 69.0983L420.611 90.4509L431.836 55.9017L402.447 34.5491H438.774L450 0Z"}))
    
    svg.appendChild(g);
    return svg;
}

function getNode(n, v) {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v)
      n.setAttributeNS(null, p, v[p]);
    return n
}