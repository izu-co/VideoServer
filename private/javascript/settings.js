fetchBackend('/backend/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, res => {}, true, false)


fetchBackend('/backend/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, user => {
    fetchBackend('/backend/getUserData/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token")
        }),
        method: "POST"
    }, userData => {
        updateData({
            "user" : user,
            "userData" : userData
        })
    }, true, false)
}, true, false)

var usernameText = document.getElementById('Username'),
sendButton = document.getElementById('send'),
oldPass = document.getElementById('oldPass'),
newPass = document.getElementById('newPass'),
newPassConfirm = document.getElementById('newPassConfirm'),
volume = document.getElementById('stanLaut'),
volumeButton = document.getElementById('change')


function updateData(data) {
    usernameText.innerHTML = data["user"]["username"]
    volume.value = data["userData"]["volume"]
    sendButton.addEventListener("click", function() {
        if (oldPass.value !== "" && newPass.value !== "" && newPassConfirm.value !== "") {
            if (newPass.value === newPassConfirm.value) {
                fetchBackend('/backend/changePass/', {
                    headers: {
                        "content-type" : "application/json; charset=UTF-8"
                    },
                    body: JSON.stringify({
                        "token" : loadCookie("token"),
                        "newPass" : newPass.value,
                        "oldPass" : oldPass.value
                    }),
                    method: "POST"
                }, () => {
                    alert("Das Passwort wurde gespeichert!")
                    oldPass.value = ""
                    newPass.value = ""
                    newPassConfirm.value = ""
                }, false, true)
                
            } else
                alert("Die Passwörter stimmen nicht überein")
        } else
            alert("Bitte fülle die Felder aus!")
    })

    volumeButton.addEventListener("click", function() {
        sendData(volume.value)
    })

}

/**
 * @param {Number} volume 
 */
function sendData(volume) {
    fetchBackend('/backend/setUserData/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token"),
            "data" : {
                "volume" : volume
            }
        }),
        method: "POST"
    }, () => alert("Lautstärke wurde geändert!"), false, true)
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