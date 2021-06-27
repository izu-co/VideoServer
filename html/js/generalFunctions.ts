function loadCookie(name: string) : null|string {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function fetchBackendPromise(url: string, options: RequestInit) : Promise<Response> {
    return fetch(url, options);
}

function setCookie(name: string, cookie: string, expires: Date, path = '/') : void {
    document.cookie = name + '=' + cookie + ';' + (expires ? 'expires=' + expires.toUTCString() + ';' : '') + 'path=' + path;
}

function fetchBackend(url: string, options: RequestInit, callback?: ((data: any) => void)|undefined, sendBack = false, canFail = false) : void {
    fetch(url, options).then(async data => {
        if (!data.ok) {
            console.log('[Request Error] ' + data.bodyUsed ? await data.text() : '');
            if (sendBack)
                document.location.href = `/?redirect=${encodeURIComponent(location.pathname + location.search)}`;
            else if (!canFail)
                document.getElementById('offline').classList.remove('false');
        } else {
            document.getElementById('offline').classList.add('false');
            const text = await data.text();
            if (callback)
                try {
                    callback(JSON.parse(text));
                } catch {
                    callback(text);
                } 
        }
    })
        .catch(error => {
            document.getElementById('offline').classList.remove('false');
            console.log(error);
        });
}

export { fetchBackend, fetchBackendPromise, loadCookie, setCookie };