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

const isMobile = () => /Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

type EventCallback = (...args: unknown[]) => void;
type ValueCallback = (arg: unknown) => void;
type ValueStorage = {
    [valueName: string]: {
        value: unknown,
        listener: ValueCallback[]
    }
};

class EventEmitter {


    private listener = new Map<String, Array<EventCallback>>()
    private valueStorage: ValueStorage = {}

    public on(event: string,  callback: EventCallback) {
        if (this.listener.has(event)) {
            this.listener.get(event).push(callback)
        } else {
            this.listener.set(event, [ callback ])
        }
    }

    public emit(event: string, ...args: unknown[]) {
        if (this.listener.has(event)) {
            this.listener.get(event).forEach(callback => callback(args))
        }
    }

    public setValue(key:string, value: unknown) {
        if (key in this.valueStorage) {
            this.valueStorage[key].value = value;
            this.valueStorage[key].listener.forEach(callback => callback(value))
        } else {
            this.valueStorage[key] = {
                listener: [],
                value: value
            }
        }
    }

    /**
     * The callback gets called once on init
     */
    public subscribe(key:string, callback: ValueCallback) {
        if (key in this.valueStorage) {
            this.valueStorage[key].listener.push(callback)
            callback(this.valueStorage[key].value)
        } else {
            this.valueStorage[key] = {
                listener: [callback],
                value: undefined
            }
            callback(undefined)
        }
    }

    public hasValue(key: string) {
        return key in this.valueStorage;
    }

}

export { fetchBackend, fetchBackendPromise, loadCookie, setCookie, isMobile, EventCallback, EventEmitter };