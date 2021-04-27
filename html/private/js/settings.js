fetchBackend('/api/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, res => {}, true, false)


fetchBackend('/api/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, user => {
    let url = new URL(window.location.origin + '/api/getUserData/')
    url.search = new URLSearchParams({
        "token": loadCookie("token")
    })
    fetchBackend(url, {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        method: "GET"
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
                fetchBackend('/api/changePass/', {
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
    fetchBackend('/api/setUserData/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token"),
            "data" : {
                "volume" : volume
            }
        }),
        method: "PUT"
    }, () => alert("Lautstärke wurde geändert!"), false, true)
}