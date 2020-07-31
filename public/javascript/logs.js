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
})
.catch(error => console.log(error))

fetch("/backend/logs", {
    headers: {
        "content-type" : "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
        "token" : loadCookie("token")
    }),
    method: "POST"
}).then(data => data.json())
.then(res => {
    if (res["status"] !== true)
        document.location.href = "/";
    else 
        loadLogs(res["data"])
})
.catch(error => console.log(error))

document.getElementById("clear").addEventListener("click", function() {
    fetch("/backend/clearLogs/", {
        headers: {
            "content-type" : "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            "token" : loadCookie("token")
        }),
        method: "POST"
    }).then(data => data.json())
    .then(res => {
        if (res["status"] !== true)
            alert("Something went wrong\nReason: " + res["reason"])
        else document.getElementById("logs").childNodes.forEach(child => {
            if (child instanceof HTMLDivElement)
                document.getElementById("logs").removeCnohild(child);
        })
    })
    .catch(error => console.log(error))
})

/**
 * @param {Array} logs 
 */
async function loadLogs(logs) {

    var logsDiv = document.createElement("div")
    var label = document.createElement("label")
    label.innerHTML = "Logs:"
    label.htmlFor = "logs";
    logsDiv.className = "logs";
    logsDiv.id = "logs"
    logsDiv.appendChild(label)

    logs.forEach(log => {
        var div = document.createElement("div")
        div.className = "logItem";
        var text = document.createElement("b")
        text.innerHTML = log;
        div.appendChild(text);
        logsDiv.appendChild(div)
    })
    document.getElementById("holder").appendChild(logsDiv)
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