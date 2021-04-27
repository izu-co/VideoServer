let url = new URL(window.location.origin + '/api/getWatchers/')
url.search = new URLSearchParams({
    "token": loadCookie("token")
})
fetchBackend(url, {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    method: "GET"
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