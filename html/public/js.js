var loginbtn = document.getElementById('submit')
var username = document.getElementById('username')
var password = document.getElementById('password')
var wrongPass = document.getElementById('wrongPass')
var wrongPassText = document.getElementById('wrongPassText')

var canlogin = true;

loginbtn.addEventListener("click", login)
username.addEventListener("keyup", function(e) {
    if (e.keyCode === 13) {
        if (canlogin)
            login();
    }
})

password.addEventListener("keyup", function(e) {
    if (e.keyCode === 13) {
        if (canlogin)
            login();
    }
})

if (loadCookie("token")) {
    fetchBackend('/backend/checkToken/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token")
        }),
        method: "POST"
    }, () => {
        wrongPass.style.color = "greenyellow";
        wrongPass.innerHTML = "Token geladen, Login nicht notwendig!";
        wrongPass.style.opacity = 1;
        canlogin = false;
        setTimeout(() => { document.location.href = "/videoSelector?path=" }, 2000);
    }, false, false)
}

async function login() {

    if (username.value && password.value) {
            fetch('/backend/login/', {
                headers: {
                    "content-type" : "application/json; charset=UTF-8"
                },
                body: JSON.stringify({
                    "Username" : username.value,
                    "Passwort" : password.value
                }),
                method: "POST"
            }).then(data => data.json())
            .then(res => {
                if (res["status"] === true) {
                    setCookie("token", res["data"], new Date(Date.now() + (1000 * 60 * 60 * 24)))
                    wrongPass.style.color = "greenyellow";
                    wrongPass.innerHTML = "Erfolgreich eingeloggt!";
                    wrongPass.style.opacity = 1;
                    canlogin = false;
                    setTimeout(() => { document.location.href = "/videoSelector?path=" }, 2000);
                } else {
                    wrongPassText.innerHTML = res["reason"];
                    wrongPassText.className = "vis"
                    setTimeout(() => { wrongPassText.className = "unvis" }, 600);
                }
            })
            .catch(error => console.log(error))
            return;
    } else {
        wrongPassText.className = "vis"
        setTimeout(() => { wrongPassText.className = "unvis" }, 600);
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


/**
 * @param {Date} expires The date
 * @param {string} cookie The cokkie
 * @param {string} key The string
 */
function setCookie(name, cookie, expires) {
    document.cookie = name + "=" + cookie + "; expires=" + expires.toUTCString() + ";path=/";
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