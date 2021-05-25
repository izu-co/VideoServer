import { fetchBackend, loadCookie } from './generalFunctions';

const url = new URL(window.location.origin + '/api/getWatchers/');
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
}, () => {
    fetchBackend(url.toString(), {
        headers: {
            'content-type' : 'application/json; charset=UTF-8'
        },
        method: 'GET'
    }, answer => {
        const table = document.getElementById('activeUser');
    
        for (const key in answer) {
            const tr = document.createElement('tr');
            const username = document.createElement('td');
            username.innerHTML = key;
            const activeCount = document.createElement('td');
            activeCount.innerHTML = answer[key];
            tr.appendChild(username);
            tr.appendChild(activeCount);
            table.appendChild(tr);
        }
    });
}, true);