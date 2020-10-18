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