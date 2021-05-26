import { loadCookie, fetchBackend } from './generalFunctions';
import { UserAccountInfo } from '../../interfaces';

const container = document.getElementById('container');

const url = new URL(window.location.origin + '/api/getUsers/');
url.search = new URLSearchParams({
    'token': loadCookie('token')
}).toString();


fetchBackend(url.toString(), {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    method: 'GET'
}, (users: Array<UserAccountInfo>) => {
    users = users.sort((a,b) => {
        if (a['perm'] !== b['perm'])
            return a.perm === 'Admin' ? 1 : -1;
        else 
            return a['username'].localeCompare(b['username']); 
    });
    users.forEach(user => {
        const userContainer = document.createElement('div');
        userContainer.className = 'User';

        const name = document.createElement('b');
        name.innerHTML = user['username'];
        name.className = 'Username';
        name.style.display = 'block';

        const passwordDiv = document.createElement('div');
        passwordDiv.style.display = 'inline-block';
        const PasswordLabel = document.createElement('label');
        PasswordLabel.htmlFor = 'Password';
        PasswordLabel.innerHTML = 'Passwort';

        const password = document.createElement('b');

        password.className = 'Password';
        password.innerHTML = user['password'];
        password.style.width = '80px';
        password.style.display = 'inline-block';

        passwordDiv.appendChild(PasswordLabel);
        passwordDiv.appendChild(password);

        const PermDiv = document.createElement('div');
        PermDiv.style.display = 'inline-block';

        const PermLabel = document.createElement('label');
        PermLabel.htmlFor = 'permission';
        PermLabel.style.width = '70px';
        PermLabel.innerHTML = 'Rechte';

        const Perm = document.createElement('b');

        Perm.className = 'permission';
        Perm.innerHTML = user['perm'];

        PermDiv.appendChild(PermLabel);
        PermDiv.appendChild(Perm);


        const activeDiv = document.createElement('div');
        activeDiv.style.display = 'inline-block';

        const activeLabel = document.createElement('label');
        activeLabel.htmlFor = 'active';
        activeLabel.innerHTML = 'Active';

        const activeL = document.createElement('label');
        activeL.className = 'switch active';

        const checkavtive = document.createElement('input');
        checkavtive.type = 'checkbox';
        checkavtive.checked = user['active'];

        checkavtive.addEventListener('change', function() {
            fetchBackend('/api/changeActive/', {
                headers: {
                    'content-type' : 'application/json; charset=UTF-8'
                },
                body: JSON.stringify({
                    'token' : loadCookie('token'),
                    'state' : checkavtive.checked ? 1 : 0,
                    'uuid' : user['UUID']
                }),
                method: 'POST'
            }, undefined, false, true);
        });

        const slider = document.createElement('span');
        slider.className = 'slider round';

        activeL.appendChild(checkavtive);
        activeL.appendChild(slider);

        activeDiv.appendChild(activeLabel);
        activeDiv.appendChild(activeL);


        const TokenDiv = document.createElement('div');
        TokenDiv.style.display = 'inline-block';

        const Tokenlabel = document.createElement('label');
        Tokenlabel.htmlFor = 'token';
        Tokenlabel.style.width = '70px';
        Tokenlabel.innerHTML = 'Tokens';

        const token = document.createElement('button');

        token.className = 'token';
        token.innerHTML = 'Token löschen';

        token.addEventListener('click', function() {
            if (confirm('Wirklick löschen?')) {
                fetchBackend('/api/deleteToken/', {
                    headers: {
                        'content-type' : 'application/json; charset=UTF-8'
                    },
                    body: JSON.stringify({
                        'token' : loadCookie('token'),
                        'uuid' : user['UUID']
                    }),
                    method: 'POST'
                }, () => {
                    token.disabled = true;
                }, false, true);
            }
        });

        TokenDiv.appendChild(Tokenlabel);
        TokenDiv.appendChild(token);

        userContainer.appendChild(name);
        userContainer.appendChild(passwordDiv);
        userContainer.appendChild(PermDiv);
        userContainer.appendChild(activeDiv);
        userContainer.appendChild(TokenDiv);

        container.appendChild(userContainer);

    });}, false, false);

document.getElementById('submit').addEventListener('click', function() {
    const username = (<HTMLInputElement> document.getElementById('Name')).value;
    const pass = (<HTMLInputElement> document.getElementById('Pass')).value;
    const passCon = (<HTMLInputElement> document.getElementById('ConPass')).value;
    const perm = (<HTMLSelectElement> document.getElementById('perm')).options[(<HTMLSelectElement> document.getElementById('perm')).selectedIndex].value;
    if (username === '') 
        alert('Please enter a username!');
    else if (pass === '')
        alert('Please enter a password!');
    else if (passCon === '')
        alert('Please confirm the password!');
    else if (pass !== passCon)
        alert('The passwords are not the same!');
    fetchBackend('/api/addUser/', {
        headers: {
            'content-type' : 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            'token' : loadCookie('token'),
            'username' : username,
            'password': pass,
            'perm': perm
        }),
        method: 'PUT'
    }, () => {
        location.reload();
    }, false, true);
});