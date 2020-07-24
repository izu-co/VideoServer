var container = document.getElementById('container')

async function getUsers() {
    return fetch('/backend/getUsers/', {
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
        return res["users"];
    })
    .catch(error => console.log(error))
}


getUsers().then(users => {
    users.forEach(user => {
        var userContainer = document.createElement("div")
        userContainer.className = "User";

        var name = document.createElement('b')
        name.innerHTML = user["username"]
        name.className = "Username"
        name.style.display = "block"

        /**
         * Start Password
         */
        var passwordDiv = document.createElement("div")
        passwordDiv.style.display = "inline-block"
        var PasswordLabel = document.createElement("label")
        PasswordLabel.htmlFor = "Password"
        PasswordLabel.innerHTML = "Passwort"



        var password = document.createElement("b")
        var passText = "";
        for (var a = 0; a < user["password"].length; a++) {
            passText += "*"
        }

        password.className = "Password"
        password.innerHTML = passText
        password.style.width = "80px"
        password.style.display = "inline-block"

        passwordDiv.appendChild(PasswordLabel)
        passwordDiv.appendChild(password)

        /**
         * End Password 
         * Start Perm
         */

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

        /**
         * End Perm 
         * Start Active
         * 
        <label class="switch">
        <input type="checkbox">
        <span class="slider round"></span>
      </label>
         */

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
            fetch('/backend/changeActive/', {
                headers: {
                    "content-type" : "application/json; charset=UTF-8"
                },
                body: JSON.stringify({
                    "token" : loadCookie("token"),
                    "state" : checkavtive.checked,
                    "username" : user["username"]
                }),
                method: "POST"
            }).then(data => data.json())
            .then(res =>{
                if (res["status"] !== true) {
                    alert("Something went wrong!\n" + res["reason"])
                    checkavtive.checked = !checkavtive.checked
                }
            })
            .catch(error => console.log(error))
        })

        var slider = document.createElement("span")
        slider.className = "slider round"

        activeL.appendChild(checkavtive)
        activeL.appendChild(slider)

        activeDiv.appendChild(activeLabel)
        activeDiv.appendChild(activeL)

        /**
         * End Active
         * Start Delete Tokens
         */

        var TokenDiv = document.createElement('div')
        TokenDiv.style.display = "inline-block"

        var Tokenlabel = document.createElement("label")
        Tokenlabel.htmlFor = "token"
        Tokenlabel.style.width = "70px"
        Tokenlabel.innerHTML = "Tokens"

        var token = document.createElement("button")

        token.className = "token"
        token.innerHTML = "Token löschen"

        if (user["token"].length === 0)
            token.disabled = "disabled"
        token.addEventListener("click", function() {
            if (confirm("Wirklick löschen?")) {
                fetch('/backend/deleteToken/', {
                    headers: {
                        "content-type" : "application/json; charset=UTF-8"
                    },
                    body: JSON.stringify({
                        "token" : loadCookie("token"),
                        "username" : user["username"]
                    }),
                    method: "POST"
                }).then(data => data.json())
                .then(res =>{
                    if (res["status"] !== true) {
                        alert("Something went wrong!\n" + res["reason"])
                    }
                    token.disabled = "disabled"
                })
                .catch(error => console.log(error))
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
    })
})
/**
 * @param {Boolean} is 
 */
function changeActive(is) {

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