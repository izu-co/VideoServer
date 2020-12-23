fetchBackend('/backend/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, res => {
    if (res["perm"] === "Admin") 
        document.getElementById("admin").className = ""
    else
        document.getElementById("sortDiv").style.right = "120px"
}, true, false)

var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString)
var container = document.getElementById('container')

var filter = ""

document.getElementById("admin").addEventListener("click", () => {
    location.href = "/admin"
})

let sort = document.getElementById("sort")

let loading = {
    aInternal: false,
    aListener: function(val) {},
    set a(val) {
      this.aInternal = val;
      this.aListener(val);
    },
    get a() {
      return this.aInternal;
    },
    registerListener: function(listener) {
      this.aListener = listener;
    }
}

loading.registerListener(function (val) {
    let curr = val ? "invis" : "vis"
    let toset = val ? "vis" : "invis"

    document.getElementById("running").classList.remove(curr)
    document.getElementById("running").classList.add(toset)
})

fetchBackend('/backend/getSortTypes/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
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
        sort.value  = last;
        return;
    }
    last = sort.value
    getFiles(urlParams.get('path'), e.target.value)
})

window.addEventListener("scroll", () => {
    setCookie("scroll:"+location.search.slice("?path=".length), window.scrollY, location.href)
})

const logoutButton = document.getElementById("logout")
logoutButton.addEventListener("click", () => {
    fetch('/backend/logout', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token")
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

getFiles(urlParams.get('path'))
function getFiles(path, type = null) {
    loading.a = true
    fetchBackend('/backend/getFiles/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token"),
            "path" : path,
            "type": type
        }),
        method: "POST"
    }, res => loadData(res), true, false)
}
/**
 * @param {Object} input 
 */
function loadData(input) {

    while (container.lastChild != null)
        container.removeChild(container.lastChild)

    data = input["files"];
    data.sort(function(a, b) {
        if (a["type"] === "video" && b["type"] === "video")
            if(a["name"].match(/\d+/g) != null && b["name"].match(/\d+/g) != null)
                return a["name"].match(/\d+/g)[0] - b["name"].match(/\d+/g)[0];
            else 
                a["name"].localeCompare(b["name"]);
        else
            return 0;
    })

    data = data.filter(a => a["name"].toLowerCase().includes(filter.toLowerCase()))

    data.forEach((file, index) => {
        var header = document.createElement("div");
        var div = document.createElement("div");

        div.addEventListener("click", function() {
            if (file["type"] === "folder") {
                urlParams.set('path', file["Path"])
                location.href = location.pathname + "?" + urlParams.toString();
            } else {
                urlParams.set('path', file["Path"])
                location.href = location.origin + "/player/player.html?" + urlParams.toString();
            }
        })

        div.className = "Item"
        
        var tub = document.createElement("img");
        tub.className = "tumb"
        tub.src = "/video/" + encodeURI(file["image"]);
        if (index === data.length - 1)
            tub.addEventListener("load", () => setScroll())
        div.appendChild(tub)

        if (file["type"] === "video") {
            var fortschritt = document.createElement("div")
            fortschritt.className = "fortschritt"
            fortschritt.style.width = (file["timeStemp"] * 100) + "%"
            div.appendChild(fortschritt)
        }
        var text = document.createElement("b");

        text.className = "text"
        document.title = urlParams.get('path').split(input["pathSep"]).pop()

        text.innerText = file["name"];
        div.appendChild(text);
        header.appendChild(div)
        header.className = "showItem";
        container.appendChild(header);
    })
    loading.a = false
}


document.getElementById("settings").addEventListener("click", () => {
    location.href = "/settings"
})

document.getElementById("server").addEventListener("click", () => {
    location.href = "/server"
})

function setScroll() {
    let cookie = loadCookie("scroll:"+location.search.slice("?path=".length))
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
    lastSearch = filter;
    getFiles(urlParams.get('path'), sort.value)
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
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

/**
 * @param {string} cookie The cokkie
 * @param {string} key The string
 * @param {String} path
 */
function setCookie(name, cookie, path) {
    document.cookie = name + "=" + cookie + ";path="+path;
}

/**
 * @param {Date} expires The date
 * @param {string} cookie The cokkie
 * @param {string} key The string
 * @param {string} path
 */
function setTimeCookie(name, cookie, expires, path) {
    document.cookie = name + "=" + cookie + "; expires=" + expires.toUTCString() + ";path="+path;
}

/**
 * @param {string} url 
 * @param {object} options 
 * @param {boolean} sendBack
 * @param {boolean} doAlert
 * @param {Function} callback
 * @returns {Promise<any>}
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