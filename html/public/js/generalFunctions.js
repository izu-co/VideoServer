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
 * @param {string} url 
 * @param {object} options 
 */
function fetchBackendPromise(url, options) {
    return fetch(url, options)
}

/**
 * @param {Date} expires The date
 * @param {string} cookie The cokkie
 * @param {string} key The string
 */
function setCookie(name, cookie, expires) {
    document.cookie = name + "=" + cookie + "; expires=" + expires.toUTCString() + ";path=/";
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
 * @param {Function} callback
 */
 function fetchBackend(url, options, callback, sendBack = false) {
    fetch(url, options).then(data => data.json())
        .then(res => {
            if (!res["status"]) {
                if (sendBack)
                    document.location.href = "/"
                else
                    document.getElementById("offline").classList.remove("false")
            } else {
                document.getElementById("offline").classList.add("false")
                if (callback)
                    callback(res["data"])
            }
        })
        .catch(error => {
            document.getElementById("offline").classList.remove("false")
            console.log(error)
        })
}