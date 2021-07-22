import { loadCookie, fetchBackend, setCookie } from './generalFunctions';

const loginbtn = document.getElementById('submit');
const username = <HTMLInputElement> document.getElementById('username');
const password = <HTMLInputElement> document.getElementById('password');
const wrongPass = document.getElementById('wrongPass');
const wrongPassText = document.getElementById('wrongPassText');

let canlogin = true;

loginbtn.addEventListener('click', login);
username.addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
        if (canlogin)
            login();
    }
});

password.addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
        if (canlogin)
            login();
    }
});

declare let ___PREFIX_URL___: string;

if (loadCookie('token')) {
    fetchBackend(`${___PREFIX_URL___}/api/checkToken/`, {
        headers: {
            'content-type' : 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            'token' : loadCookie('token')
        }),
        method: 'POST'
    }, () => {
        wrongPass.style.color = 'greenyellow';
        wrongPass.innerHTML = 'Token geladen, Login nicht notwendig!';
        wrongPass.style.opacity = '1';
        canlogin = false;
        setTimeout(() => { document.location.href = window.location.origin + `${___PREFIX_URL___}/videoSelector/?path=`; }, 2000);
    }, false, true);
}

async function login() {
    if (username.value && password.value) {
        fetch(`${___PREFIX_URL___}/api/login/`, {
            headers: {
                'content-type' : 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                'Username' : username.value,
                'Passwort' : password.value
            }),
            method: 'POST'
        }).then(async data => {
            if (data.ok) {
                setCookie('token', await data.text(), new Date(Date.now() + (1000 * 60 * 60 * 24)));
                wrongPass.style.color = 'greenyellow';
                wrongPass.innerHTML = 'Erfolgreich eingeloggt!';
                wrongPass.style.opacity = '1';
                canlogin = false;
                setTimeout(() => { document.location.href = window.location.origin + `${___PREFIX_URL___}/videoSelecto/?path=`; }, 2000);
            } else {
                wrongPassText.innerHTML = data.body ? await data.text() : 'Login failed';
                wrongPassText.className = 'vis';
                setTimeout(() => { wrongPassText.className = 'unvis'; }, 600);
            }
        })
            .catch(error => {
                document.getElementById('offline').classList.remove('false');
                console.log(error);
            });
        return;
    } else {
        wrongPassText.className = 'vis';
        setTimeout(() => { wrongPassText.className = 'unvis'; }, 600);
    }
}