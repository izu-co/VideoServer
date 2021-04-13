var container = document.getElementById('container')

fetchBackend("/backend/getUsers/", {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, users => {
users = users.sort((a,b) => {
    if (a["perm"] !== b["perm"])
        return b["perm"] === "Admin" ? 1 : 0 - a["perm"] === "Admin" ? 1 : 0
    else 
        return a["username"].localeCompare(b["username"]) 
})
users.forEach(user => {
    var userContainer = document.createElement("div")
    userContainer.className = "User";

    var name = document.createElement('b')
    name.innerHTML = user["username"]
    name.className = "Username"
    name.style.display = "block"

    var passwordDiv = document.createElement("div")
    passwordDiv.style.display = "inline-block"
    var PasswordLabel = document.createElement("label")
    PasswordLabel.htmlFor = "Password"
    PasswordLabel.innerHTML = "Passwort"

    var password = document.createElement("b")

    password.className = "Password"
    password.innerHTML = user["password"]
    password.style.width = "80px"
    password.style.display = "inline-block"

    passwordDiv.appendChild(PasswordLabel)
    passwordDiv.appendChild(password)

    var PermDiv = document.createElement('div')
    PermDiv.style.display = "inline-block"

    var PermLabel = document.createElement("label")
    PermLabel.htmlFor = "permission"
    PermLabel.style.width = "70px"
    PermLabel.innerHTML = "Rechte"

    var Perm = document.createElement("b")

    Perm.className = "permission"
    Perm.innerHTML = user["perm"]

    PermDiv.appendChild(PermLabel)
    PermDiv.appendChild(Perm)


    var activeDiv = document.createElement('div')
    activeDiv.style.display = "inline-block"

    var activeLabel = document.createElement("label")
    activeLabel.htmlFor = "active"
    activeLabel.innerHTML = "Active"

    var activeL = document.createElement("label")
    activeL.className = "switch active"

    var checkavtive = document.createElement("input")
    checkavtive.type = "checkbox";
    checkavtive.checked = user["active"]

    checkavtive.addEventListener("change", function() {
    fetchBackend("/backend/changeActive/", {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token"),
            "state" : checkavtive.checked,
            "uuid" : user["UUID"]
        }),
        method: "POST"
        }, () => {}, false, true)
    })

    var slider = document.createElement("span")
    slider.className = "slider round"

    activeL.appendChild(checkavtive)
    activeL.appendChild(slider)

    activeDiv.appendChild(activeLabel)
    activeDiv.appendChild(activeL)


    var TokenDiv = document.createElement('div')
    TokenDiv.style.display = "inline-block"

    var Tokenlabel = document.createElement("label")
    Tokenlabel.htmlFor = "token"
    Tokenlabel.style.width = "70px"
    Tokenlabel.innerHTML = "Tokens"

    var token = document.createElement("button")

    token.className = "token"
    token.innerHTML = "Token löschen"

    token.addEventListener("click", function() {
        if (confirm("Wirklick löschen?")) {
            fetchBackend("/backend/deleteToken/", {
                headers: {
                    "content-type" : "application/json; charset=UTF-8"
                },
                body: JSON.stringify({
                    "token" : loadCookie("token"),
                    "uuid" : user["UUID"]
                }),
                method: "POST"
            }, () => {
                token.disabled = "disabled"
            }, false, true)
        }
    })

    TokenDiv.appendChild(Tokenlabel)
    TokenDiv.appendChild(token)

    userContainer.appendChild(name)
    userContainer.appendChild(passwordDiv)
    userContainer.appendChild(PermDiv)
    userContainer.appendChild(activeDiv)
    userContainer.appendChild(TokenDiv)

    container.appendChild(userContainer)

})}, false, false)

document.getElementById("submit").addEventListener("click", function() {
    let username = document.getElementById('Name').value
    let pass = document.getElementById('Pass').value
    let passCon = document.getElementById('ConPass').value
    let perm = document.getElementById('perm').options[document.getElementById('perm').selectedIndex].value
    if (username === "") 
        alert("Please enter a username!")
    else if (pass === "")
        alert("Please enter a password!")
    else if (passCon === "")
        alert("Please confirm the password!")
    else if (pass !== passCon)
        alert("The passwords are not the same!")
    fetchBackend('/backend/addUser/', {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token"),
            "username" : username,
            "password": pass,
            "perm": perm
        }),
        method: "POST"
    }, res => {
        location.reload();
    }, false, true)
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