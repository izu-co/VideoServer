import { loadCookie, fetchBackend } from "./generalFunctions"
import { UserData } from "../../interfaces"

var container = document.getElementById('container');

let url = new URL(window.location.origin + '/api/getUsers/');
url.search = new URLSearchParams({
    'token': loadCookie('token')
}).toString()


fetchBackend(url.toString(), {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    method: 'GET'
}, (users: Array<UserData>) => {
    users = users.sort((a,b) => {
        if (a['perm'] !== b['perm'])
            return a.perm === "Admin" ? 1 : -1;
        else 
            return a['username'].localeCompare(b['username']); 
    });
    users.forEach(user => {
        var userContainer = document.createElement('div');
        userContainer.className = 'User';

        var name = document.createElement('b');
        name.innerHTML = user['username'];
        name.className = 'Username';
        name.style.display = 'block';

        var passwordDiv = document.createElement('div');
        passwordDiv.style.display = 'inline-block';
        var PasswordLabel = document.createElement('label');
        PasswordLabel.htmlFor = 'Password';
        PasswordLabel.innerHTML = 'Passwort';

        var password = document.createElement('b');

        password.className = 'Password';
        password.innerHTML = user['password'];
        password.style.width = '80px';
        password.style.display = 'inline-block';

        passwordDiv.appendChild(PasswordLabel);
        passwordDiv.appendChild(password);

        var PermDiv = document.createElement('div');
        PermDiv.style.display = 'inline-block';

        var PermLabel = document.createElement('label');
        PermLabel.htmlFor = 'permission';
        PermLabel.style.width = '70px';
        PermLabel.innerHTML = 'Rechte';

        var Perm = document.createElement('b');

        Perm.className = 'permission';
        Perm.innerHTML = user['perm'];

        PermDiv.appendChild(PermLabel);
        PermDiv.appendChild(Perm);


        var activeDiv = document.createElement('div');
        activeDiv.style.display = 'inline-block';

        var activeLabel = document.createElement('label');
        activeLabel.htmlFor = 'active';
        activeLabel.innerHTML = 'Active';

        var activeL = document.createElement('label');
        activeL.className = 'switch active';

        var checkavtive = document.createElement('input');
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
            }, () => {}, false, true);
        });

        var slider = document.createElement('span');
        slider.className = 'slider round';

        activeL.appendChild(checkavtive);
        activeL.appendChild(slider);

        activeDiv.appendChild(activeLabel);
        activeDiv.appendChild(activeL);


        var TokenDiv = document.createElement('div');
        TokenDiv.style.display = 'inline-block';

        var Tokenlabel = document.createElement('label');
        Tokenlabel.htmlFor = 'token';
        Tokenlabel.style.width = '70px';
        Tokenlabel.innerHTML = 'Tokens';

        var token = document.createElement('button');

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
    let username = (<HTMLInputElement> document.getElementById('Name')).value;
    let pass = (<HTMLInputElement> document.getElementById('Pass')).value;
    let passCon = (<HTMLInputElement> document.getElementById('ConPass')).value;
    let perm = (<HTMLSelectElement> document.getElementById('perm')).options[(<HTMLSelectElement> document.getElementById('perm')).selectedIndex].value;
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
    }, _ => {
        location.reload();
    }, false, true);
});