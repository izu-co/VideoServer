fetchBackend("/backend/getWatchers/", {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}, answer => {
    let table = document.getElementById("activeUser")

    for (let key in answer) {
        let tr = document.createElement("tr");
        let username = document.createElement("td")
        username.innerHTML = key
        let activeCount = document.createElement("td")
        activeCount.innerHTML = answer[key]
        tr.appendChild(username)
        tr.appendChild(activeCount)
        table.appendChild(tr)
    }
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
            else if (DoAlert)
                    alert("Something went wrong\n" + res["reason"])
        } else
            callback(res["data"])
    })
    .catch(error => console.log(error))
}