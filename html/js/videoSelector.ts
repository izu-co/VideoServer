import { fetchBackend, loadCookie, setCookie, fetchBackendPromise } from './generalFunctions';
import { FileData as FileDataType, GetFilesResponse, SortTypes } from '../../interfaces';

fetchBackend('/api/checkToken/', {
    headers: {
        'content-type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
        'token': loadCookie('token')
    }),
    method: 'POST'
}, res => {
    if (res['perm'] === 'Admin')
        document.getElementById('admin').className = '';
    else
        document.getElementById('sortDiv').style.right = '120px';
}, true, false);

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
const container = document.getElementById('container');
const loadMore = document.getElementById('loadMore');
const loadAll = document.getElementById('loadAll')
const sort = <HTMLSelectElement> document.getElementById('sort');
let filter = '';


document.getElementById('admin').addEventListener('click', () => {
    location.href = '/admin';
});

const loading = {
    aInternal: false,
    aListener: undefined,
    set a(val) {
        this.aInternal = val;
        if (this.aListener)
            this.aListener(val);
    },
    get a() {
        return this.aInternal;
    },
    registerListener: function (listener) {
        this.aListener = listener;
    }
};

loading.registerListener(function (val) {
    const curr = val ? 'invis' : 'vis';
    const toset = val ? 'vis' : 'invis';

    document.getElementById('running').classList.remove(curr);
    document.getElementById('running').classList.add(toset);
});

class FileData {
    private data: Array<FileDataType>;
    private pathSep: string; 
    public defaultShowAmount = 20;
    public addShowAmount = 20;

    public showAmount = this.defaultShowAmount;
    public currentlyShown = 0;

    public hasMore() : boolean {
        if (!this.data)
            return false;
        return this.data.filter(a => a['name'].toLowerCase().includes(filter.toLowerCase())).length > this.showAmount;
    }

    public loadMore() : void {
        if (this.hasMore()) {
            this.showAmount+=this.addShowAmount;
            this.showData();
        }

        if (!this.hasMore()) {
            loadMore.style.display = 'none';
            loadAll.style.display = 'none';
        }
    }

    public loadAll() : void {
        while (this.hasMore()) 
            this.showAmount+=this.addShowAmount;
        this.showData()
        loadMore.style.display = 'none';
        loadAll.style.display = 'none';
    }

    public async loadData(path: string, type: null|SortTypes = null) : Promise<void> {
        loading.a = true;
        this.showAmount = this.defaultShowAmount;
        this.currentlyShown = 0;
        const url = new URL(window.location.origin + '/api/getFiles/');
        url.search = new URLSearchParams({
            'token': loadCookie('token'),
            'path': path,
            'type': type
        }).toString();
        const response = await fetchBackendPromise(url.toString(), {
            headers: {
                'content-type': 'application/json; charset=UTF-8'
            },
            method: 'GET'
        });

        if (!response.ok) {
            document.getElementById('offline').classList.remove('false');
            console.log(`[Request Failed] ${response.body ? await response.text() : ''}`);
            return;
        }

        const parsedData : GetFilesResponse = await response.json();

        console.log(parsedData.files.map(a => a.Path))
        this.data = parsedData.files.sort((a,b) =>  a.Path.localeCompare(b.Path));
        this.pathSep = parsedData.pathSep;

        loading.a = false;
    }

    public showData() : void {  
        loading.a = true;
        while (container.children.length > this.currentlyShown)
            container.removeChild(container.lastChild);
        if (this.hasMore()) {
            loadMore.style.display = 'inline';
            loadAll.style.display = 'inline';
        } else {
            loadMore.style.display = 'none';
            loadAll.style.display = 'none';
        } 
        
        let data = this.data;

        data = data.filter(a => a['name'].toLowerCase().includes(filter.toLowerCase()));
        data = data.filter((_, i) => this.currentlyShown <= i  && i < this.showAmount);

        data.forEach((file, index) => {
            const header = document.createElement('div');
            const div = document.createElement('div');

            div.className = 'Item';

            const tubDiv = document.createElement('div');


            const tub = document.createElement('img');
            tub.className = 'tumb';
            tub.alt = 'Thumbnail';
            tub.src = '/video/' + encodeURI(file['image']);
            if (index === data.length - 1)
                tub.addEventListener('load', () => setScroll());

            const add = document.createElement('button');
            add.classList.add('watchList');
            add.classList.add(file['watchList'] ? 'already' : 'add');
            add.addEventListener('click', () => {
                const pathToFetch = '/api/' + (add.classList.contains('already') ? 'removeWatchList' : 'addWatchList/');
                fetchBackend(pathToFetch, {
                    headers: {
                        'content-type': 'application/json; charset=UTF-8'
                    },
                    body: JSON.stringify({
                        'token': loadCookie('token'),
                        'path': file['Path']
                    }),
                    method: (add.classList.contains('already') ? 'DELETE' : 'PUT')
                }, (data) => {
                    console.log(data);
                    if (data === 'added') {
                        add.classList.remove('add');
                        add.classList.add('already');
                    } else {
                        add.classList.remove('already');
                        add.classList.add('add');
                    }
                }, false, true);
            });

            const stars = buildStarSVG();
            stars.classList.add('rating');

            const singleStars = stars.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'path');

            for (let i = 0; i < singleStars.length; i++) {
                const singleStar = singleStars.item(i);
                if (i < file['stars'])
                    singleStar.classList.add('starSelected');
                else 
                    singleStar.classList.add('notSelected');
                singleStar.addEventListener('mouseenter', () => {
                    for (let a = 0; a < singleStars.length; a++)
                        singleStars.item(a).classList.add(a <= i ? 'tempSelected' : 'tempNotSelected');
                });

                singleStar.addEventListener('click', () => {
                    fetchBackend('/api/setStars', {
                        headers: {
                            'content-type': 'application/json; charset=UTF-8'
                        },
                        body: JSON.stringify({
                            'token': loadCookie('token'),
                            'path': file['Path'],
                            'stars': (i+1)
                        }),
                        method: 'PUT'
                    }, (data) => {
                        for (let k = 0; k < singleStars.length; k++) {
                            singleStars.item(k).classList.forEach(a => singleStars.item(k).classList.remove(a));
                            singleStars.item(k).classList.add(k < data ? 'starSelected' : 'notSelected');
                        }
                    }, false, true);
                });

                singleStar.addEventListener('mouseleave', () => {
                    for (let a = 0; a < singleStars.length ; a++)
                        singleStars.item(a).classList.remove('tempSelected', 'tempNotSelected');
                });
            }

            tubDiv.style.position = 'relative';
            tubDiv.appendChild(stars);
            tubDiv.appendChild(tub);
            tubDiv.appendChild(add);
            div.appendChild(tubDiv);

            if (file.type === 'video') {
                const fortschritt = document.createElement('div');
                fortschritt.className = 'fortschritt';
                fortschritt.style.width = (file.timeStemp * 100) + '%';
                div.appendChild(fortschritt);
            }

            const text = document.createElement('b');

            text.className = 'text';
            
            let textToDisplay = file['name'];
            if (textToDisplay.startsWith(this.pathSep)) textToDisplay = textToDisplay.substring(this.pathSep.length);

            textToDisplay = textToDisplay.substring(textToDisplay.lastIndexOf(this.pathSep) + 1);

            text.innerText = textToDisplay;

            div.addEventListener('click', function (e) {
                if (!(e.target === this || e.target === tub || e.target === text)) {
                    return;
                }

                if (file['type'] === 'folder') {
                    urlParams.set('path', file['Path']);
                    location.href = location.pathname + '?' + urlParams.toString();
                } else {
                    urlParams.set('path', file['Path']);
                    location.href = location.origin + '/player?' + urlParams.toString();
                }
            });

            div.appendChild(text);
            header.appendChild(div);
            header.className = 'showItem';
            container.appendChild(header);
        });
        this.currentlyShown = container.children.length;
        loading.a = false;
    }

}

const fileData = new FileData();

fileData.loadData(urlParams.get('path')).then(() => fileData.showData()).catch((er) => {
    document.getElementById('offline').classList.remove('false');
    console.log(er);
});

loadMore.addEventListener('click', () => fileData.loadMore());
loadAll.addEventListener('click', () => fileData.loadAll());

const url = new URL(window.location.origin + '/api/getSortTypes/');
url.search = new URLSearchParams({
    'token': loadCookie('token')
}).toString();
fetchBackend(url.toString(), {
    headers: {
        'content-type': 'application/json; charset=UTF-8'
    },
    method: 'GET'
}, res => {
    while (sort.lastChild != null)
        sort.removeChild(sort.lastChild);
    res.forEach(a => {
        const option = document.createElement('option');
        option.value = a;
        option.innerHTML = a;
        sort.appendChild(option);
    });
}, true, false);

let last = sort.value;

sort.addEventListener('change', (e) => {
    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString);
    if (loading.a) {
        sort.value = last;
        return;
    }
    last = sort.value;
    fileData.loadData(urlParams.get('path'), (<SortTypes> (<HTMLSelectElement> e.target).value)).then(() => fileData.showData());
});

window.addEventListener('scroll', () => {
    setCookie('scroll:' + location.search.slice('?path='.length), window.scrollY.toString(), undefined, location.href);
});

const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', () => {
    fetch('/api/logout', {
        headers: {
            'content-type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            'token': loadCookie('token')
        }),
        method: 'POST'
    }).then(data => data.json())
        .then(res => {
            if (res['status'] === true)
                document.location.href = '/';
            else
                alert('Something went wrong');
        });
    setCookie('token', '', new Date(0));
});

document.getElementById('settings').addEventListener('click', () => {
    location.href = '/settings';
});

document.getElementById('server').addEventListener('click', () => {
    location.href = '/server';
});

function setScroll() {
    const cookie = loadCookie('scroll:' + location.search.slice('?path='.length));
    window.scrollTo({
        top: parseFloat(cookie)
    });
}

let lastSearch = '';

document.getElementById('search').addEventListener('input', (e) => {
    filter = (<HTMLInputElement> e.target).value;

    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString);
    if (loading.a) {
        (<HTMLInputElement> e.target).value = lastSearch;
        return;
    }
    fileData.loadData(urlParams.get('path'), <SortTypes> sort.value).then(() => fileData.showData());
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    filter = new FormData(<HTMLFormElement> e.target).get('search').toString();

    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString);
    if (loading.a) {
        (<HTMLFormElement> e.target).value = lastSearch;
        return;
    }
    lastSearch = filter;
    fileData.loadData(urlParams.get('path'), <SortTypes> sort.value).then(() => fileData.showData());
});


function buildStarSVG() : SVGElement {
    const svg = getNode('svg', {'width': 500, 'height': 100, 'viewBox': '0 0 500 100', 'xmlsn': 'http://www.w3.org/2000/svg'});
    const g = getNode('g', {});
    g.appendChild(getNode('path', {'id': 'path1', 'd': 'M50 0L61.2257 34.5491H97.5528L68.1636 55.9017L79.3893 90.4509L50 69.0983L20.6107 90.4509L31.8364 55.9017L2.44717 34.5491H38.7743L50 0Z'}));
    g.appendChild(getNode('path', {'id': 'path2', 'd': 'M150 0L161.226 34.5491H197.553L168.164 55.9017L179.389 90.4509L150 69.0983L120.611 90.4509L131.836 55.9017L102.447 34.5491H138.774L150 0Z'}));
    g.appendChild(getNode('path', {'id': 'path3', 'd': 'M250 0L261.226 34.5491H297.553L268.164 55.9017L279.389 90.4509L250 69.0983L220.611 90.4509L231.836 55.9017L202.447 34.5491H238.774L250 0Z'}));
    g.appendChild(getNode('path', {'id': 'path4', 'd': 'M350 0L361.226 34.5491H397.553L368.164 55.9017L379.389 90.4509L350 69.0983L320.611 90.4509L331.836 55.9017L302.447 34.5491H338.774L350 0Z'}));
    g.appendChild(getNode('path', {'id': 'path5', 'd': 'M450 0L461.226 34.5491H497.553L468.164 55.9017L479.389 90.4509L450 69.0983L420.611 90.4509L431.836 55.9017L402.447 34.5491H438.774L450 0Z'}));
    
    svg.appendChild(g);
    return svg;
}

function getNode(n: string, v: object) : SVGElement {
    const f = document.createElementNS('http://www.w3.org/2000/svg', n);
    for (const p in v)
        f.setAttributeNS(null, p, v[p]);
    return f;
}