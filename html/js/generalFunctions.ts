declare var ___PREFIX_URL___

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


function setCookie(name: string, cookie: string, expires: Date, path = '/') : void {
    document.cookie = name + '=' + cookie + ';' + (expires ? 'expires=' + expires.toUTCString() + ';' : '') + 'path=' + path;
}

async function fetchBackendAsPromise(url: string, options: RequestInit, sendBack = false, canFail = false) : Promise<undefined|object|string> {
    return fetch(url, options).then(async data => {
        if (!data.ok) {
            console.log('[Request Error] ' + data.bodyUsed ? await data.text() : '');
            if (sendBack)
                document.location.href = ___PREFIX_URL___ + '/';
        } else {
            const text = await data.text();
            try {
                return JSON.parse(text);
            } catch {
                return text;
            } 
        }
    }).catch(er => {
        document.getElementById('offline').classList.remove('false');
        console.log(er);
        return undefined;
    });
}

function fetchBackend(url: string, options: RequestInit, callback?: ((data: any) => void)|undefined, sendBack = false, canFail = false) : void {
    fetch(url, options).then(async data => {
        if (!data.ok) {
            console.log('[Request Error] ' + data.bodyUsed ? await data.text() : '');
            if (sendBack)
                document.location.href = ___PREFIX_URL___ + '/';
        } else {
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

const b64toBlob = (b64Data:string, contentType='', sliceSize=512) : Blob => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
  
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
  
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
};

const openIDBDatabase = async (name: string) : Promise<IDBDatabase> => {
    const res: IDBOpenDBRequest|undefined = await new Promise<IDBOpenDBRequest>((resolve, reject) => {
        let promise = indexedDB.open(name);
        promise.addEventListener("error", () => reject());
        promise.addEventListener("success", () => resolve(promise))

    }).catch(() => undefined);

    if (res === undefined)
        return undefined;
    else 
        return res.result;

}

export { fetchBackend, fetchBackendAsPromise, loadCookie, setCookie, b64toBlob, openIDBDatabase };