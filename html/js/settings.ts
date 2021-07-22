import { fetchBackend, loadCookie } from './generalFunctions';
declare let ___PREFIX_URL___: string;

fetchBackend(`${___PREFIX_URL___}/api/checkToken/`, {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
        'token' : loadCookie('token')
    }),
    method: 'POST'
}, undefined, true, false);


fetchBackend(`${___PREFIX_URL___}/api/checkToken/`, {
    headers: {
        'content-type' : 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
        'token' : loadCookie('token')
    }),
    method: 'POST'
}, user => {
    const url = new URL(window.location.origin + `${___PREFIX_URL___}/api/getUserData/`);
    url.search = new URLSearchParams({
        'token': loadCookie('token')
    }).toString();
    fetchBackend(url.toString(), {
        headers: {
            'content-type' : 'application/json; charset=UTF-8'
        },
        method: 'GET'
    }, userData => {
        updateData({
            'user' : user,
            'userData' : userData
        });
    }, true, false);
}, true, false);

const usernameText = document.getElementById('Username'),
    sendButton = document.getElementById('send'),
    oldPass = <HTMLInputElement> document.getElementById('oldPass'),
    newPass = <HTMLInputElement> document.getElementById('newPass'),
    newPassConfirm = <HTMLInputElement> document.getElementById('newPassConfirm'),
    volume = <HTMLInputElement> document.getElementById('stanLaut'),
    volumeButton = document.getElementById('change');


function updateData(data) {
    usernameText.innerHTML = data['user']['username'];
    volume.value = data['userData']['volume'];
    sendButton.addEventListener('click', function() {
        if (oldPass.value !== '' && newPass.value !== '' && newPassConfirm.value !== '') {
            if (newPass.value === newPassConfirm.value) {
                fetchBackend(`${___PREFIX_URL___}/api/changePass/`, {
                    headers: {
                        'content-type' : 'application/json; charset=UTF-8'
                    },
                    body: JSON.stringify({
                        'token' : loadCookie('token'),
                        'newPass' : newPass.value,
                        'oldPass' : oldPass.value
                    }),
                    method: 'POST'
                }, () => {
                    alert('Das Passwort wurde gespeichert!');
                    oldPass.value = '';
                    newPass.value = '';
                    newPassConfirm.value = '';
                }, false, true);
                
            } else
                alert('Die Passwörter stimmen nicht überein');
        } else
            alert('Bitte fülle die Felder aus!');
    });

    volumeButton.addEventListener('click', function() {
        sendData(parseInt(volume.value));
    });

}

function sendData(volume: number) {
    fetchBackend(`${___PREFIX_URL___}/api/setUserData/`, {
        headers: {
            'content-type' : 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            'token' : loadCookie('token'),
            'data' : {
                'volume' : volume
            }
        }),
        method: 'PUT'
    }, () => alert('Lautstärke wurde geändert!'), false, true);
}