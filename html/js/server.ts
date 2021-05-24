import { fetchBackend, loadCookie } from "./generalFunctions"

let url = new URL(window.location.origin + '/api/getWatchers/');
url.search = new URLSearchParams({
    'token': loadCookie('token')
}).toString();

fetchBackend('/api/checkToken/', {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
        'token' : loadCookie('token')
    }),
    method: 'POST'
}, res => {
    fetchBackend(url.toString(), {
        headers: {
            'content-type' : 'application/json; charset=UTF-8'
        },
        method: 'GET'
    }, answer => {
        let table = document.getElementById('activeUser');
    
        for (let key in answer) {
            let tr = document.createElement('tr');
            let username = document.createElement('td');
            username.innerHTML = key;
            let activeCount = document.createElement('td');
            activeCount.innerHTML = answer[key];
            tr.appendChild(username);
            tr.appendChild(activeCount);
            table.appendChild(tr);
        }
    });
}, true);