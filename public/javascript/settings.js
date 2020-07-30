fetch('/backend/checkToken/', {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}).then(data => data.json())
.then(res =>{
    if (res["status"] !== true) 
        document.location.href = "/";
    if (res["userdata"]["perm"] === "Admin")
        isAdmin()
})
.catch(error => console.log(error))

function isAdmin() {

    var reloadDiv = document.createElement("div");
    reloadDiv.id = "ReloadDiv";
    reloadDiv.className = "category";

    var reloadLabel = document.createElement("label")
    reloadLabel.htmlFor = "reload";
    reloadLabel.innerHTML = "Generiere Vorschaubilder"

    var reload = document.createElement("button");
    reload.innerHTML = "Reload";
    reload.className = "item";
    reload.id = "reload";
    reload.addEventListener("click", function() {
    fetch('/backend/reload/', {
            headers: {
                "content-type" : "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "token" : loadCookie("token")
            }),
            method: "POST"
        }).then(data => data.json())
        .then(res =>{
            if (res["status"] !== true) 
                alert("Reload failed!\nReason: " + res["reason"])
            else
                alert("Started Reload!")
        })
        .catch(error => console.log(error))
    })

    reloadDiv.appendChild(reloadLabel)
    reloadDiv.appendChild(reload)

    var reloadYTDiv = document.createElement("div");
    reloadYTDiv.id = "ReloadYTDiv";
    reloadYTDiv.className = "category";

    var reloadYTLabel = document.createElement("label")
    reloadYTLabel.htmlFor = "reloadYT";
    reloadYTLabel.innerHTML = "Download YT"

    var reloadYT = document.createElement("button");
    reloadYT.innerHTML = "Downloade neue YouTube Videos";
    reloadYT.className = "item";
    reloadYT.id = "reloadYT";
    reloadYT.addEventListener("click", function() {
    fetch('/backend/reloadYT/', {
            headers: {
                "content-type" : "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                "token" : loadCookie("token")
            }),
            method: "POST"
        }).then(data => data.json())
        .then(res =>{
            if (res["status"] !== true) 
                alert("Reload failed!\nReason: " + res["reason"])
            else
                alert("Started Reload!")
        })
        .catch(error => console.log(error))
    })

    reloadYTDiv.appendChild(reloadYTLabel)
    reloadYTDiv.appendChild(reloadYT)

    document.getElementById('container').appendChild(reloadDiv);
    document.getElementById('container').appendChild(reloadYTDiv);
}

async function getData() {
    var token = await fetch('/backend/checkToken/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token")
        }),
        method: "POST"
    }).then(data => data.json())
    .then(res =>{
        if (res["status"] !== true) 
            document.location.href = "/";
    
        return res;
    })
    .catch(error => console.log(error))

    var userData = await fetch('/backend/getUserData/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token")
        }),
        method: "POST"
    }).then(data => data.json())
    .then(res =>{
        if (res["status"] !== true) 
            document.location.href = "/";
    
        return res;
    })
    .catch(error => console.log(error))

    delete token["status"]
    delete userData["status"]
    return {
        "token" : token,
        "userData" : userData["data"]
    }

}

var usernameText = document.getElementById('Username'),
sendButton = document.getElementById('send'),
oldPass = document.getElementById('oldPass'),
newPass = document.getElementById('newPass'),
newPassConfirm = document.getElementById('newPassConfirm'),
volume = document.getElementById('stanLaut'),
volumeButton = document.getElementById('change')


getData().then(data => {
    usernameText.innerHTML = data["token"]["userdata"]["username"]
    volume.value = data["userData"]["volume"]
    sendButton.addEventListener("click", function() {
        if (oldPass.value !== "" && newPass.value !== "" && newPassConfirm.value !== "") {
            if (newPass.value === newPassConfirm.value) {
                fetch('/backend/changePass/', {
                    headers: {
                        "content-type" : "application/json; charset=UTF-8"
                    },
                    body: JSON.stringify({
                        "token" : loadCookie("token"),
                        "newPass" : newPass.value,
                        "oldPass" : oldPass.value
                    }),
                    method: "POST"
                }).then(data => data.json())
                .then(res => {
                    if (res["status"] !== true) 
                        alert("Something went wrong")
                    else 
                        alert("Das Passwort wurde gespeichert!")
                    
                })
                .catch(error => console.log(error))
                
            } else
                alert("Die Passwörter stimmen nicht überein")
        } else
            alert("Bitte fülle die Felder aus!")
    })

    volumeButton.addEventListener("click", function() {
        sendData(volume.value)
    })

}) 

/**
 * @param {Number} volume 
 */
function sendData(volume) {
    fetch('/backend/setUserData/', {
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
    }).then(data => data.json())
    .then(res =>{
        if (res["status"] !== true) 
            alert("Lautstärke wurde nicht geändert!")
        else 
            alert("Lautstärke wurde geändert!")
    })
    .catch(error => console.log(error))
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