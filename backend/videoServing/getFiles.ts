import { checkPath } from '../util';
import { SortTypes } from '../../interfaces';
import { FileData, BackendRequest } from '../../interfaces';
import * as index from '../../index';
import * as fs from 'fs';
import * as Path from 'path';
import { loadTime, IsOnWatchList, getStars } from '../fileStuff';
import { getUserFromToken } from '../UserMangement';

async function getFiles(path:string, token:string, ip:string, length: number, type:string|null|SortTypes = null): Promise<BackendRequest<Array<FileData>>> {
    let searchType:SortTypes;
    switch (type) {
    case null:
    case 'null':
    case '':
    case SortTypes.File:
        searchType = SortTypes.File;
        break;
    case SortTypes.Created:
        searchType = SortTypes.Created;
        break;
    case SortTypes.WatchList:
        searchType = SortTypes.WatchList;
        break;
    }
    if (searchType == null)
        return { isOk: false, statusCode: 400, message: 'Invalid search type' };
    const pathCheck = checkPath(path);
    if (pathCheck.isOk === false)
        return pathCheck;
    path = pathCheck.value;
    if(!fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) return {
        isOk: false,
        statusCode: 404,
        message: 'The given path does not exists'
    };

    if (length === -1) 
        /* If its set to infinity, all files will be used */
        length = Infinity;
    else
        /* If we dont decrement the lenght we will get lenght+1 files */
        length--;

    switch(searchType) {
    case SortTypes.File:
        return getFileFromFolder(path, token, ip, length);
    case SortTypes.Created:
        return getFileFromCreated(path, token, ip, length);
    case SortTypes.WatchList:
        return getFilesFromWatchList(token, ip, length);
    }
}

const getFileAmount = async (path:string, token:string, ip:string, type:null|string|SortTypes = null): Promise<BackendRequest<number>> => {
    let searchType:SortTypes;
    switch (type) {
    case null:
    case 'null':
    case '':
    case SortTypes.File:
        searchType = SortTypes.File;
        break;
    case SortTypes.Created:
        searchType = SortTypes.Created;
        break;
    case SortTypes.WatchList:
        searchType = SortTypes.WatchList;
        break;
    }
    if (searchType == null)
        return { isOk: false, statusCode: 400, message: 'Invalid search type' };
    const pathCheck = checkPath(path);
    if (pathCheck.isOk === false)
        return pathCheck;
    path = pathCheck.value;
    if(!fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) return {
        isOk: false,
        statusCode: 404,
        message: 'The given path does not exists'
    };

    const user = getUserFromToken(token, ip);
    if (user.isOk === false) return user;

    const pathFilter = (path: string): boolean => {
        const pathCheck = checkPath(path);
        if (pathCheck.isOk === false)
            return false;
        if (!fs.existsSync(path))
            return false;
        if (fs.lstatSync(path).isFile())
            if (!index.VideoNameExtensions.includes(path.split('.')[path.split('.').length - 1]))
                return false;
        if (!fs.existsSync(path + '.jpg'))
            return false;      
        return true;
    };

    if (searchType === SortTypes.Created) {
        let files = index.fileIndex.prepare('SELECT * FROM files').all();
        files = files.filter(a => !a['isDir']);
        files = files.sort((a, b) => b['created'] - a['created']);
        if (files.length > 50)
            files = files.slice(0, 50);
        return {
            value: files.length,
            isOk: true
        };
    } else if (searchType === SortTypes.WatchList) {
        const arr = index.db.prepare('SELECT * FROM watchlist WHERE UUID=?').all(user.value.uuid);
        return {
            isOk: true,
            value: arr.map(a => a['path']).filter(a => pathFilter(a)).length
        };
    } else {
        const files = index.fileIndex.prepare('SELECT * FROM files').all().filter(a => {
            return new RegExp(escapeRegExp(path + Path.sep) + '[^' + escapeRegExp(Path.sep) + ']*(' + escapeRegExp(Path.sep) + '|(' + index.VideoNameExtensions.join('|') + '))$').test(a['isDir'] ? a['path'] + Path.sep : a['path']);
        });
        return {
            isOk: true,
            value: files.map(a => a['path']).filter(a => pathFilter(a)).length
        };
    }
};

async function getFilesFromWatchList(token:string, ip:string, length:number) : Promise<BackendRequest<Array<FileData>>> {
    const user = getUserFromToken(token, ip);

    if (user.isOk === false) return user;

    const answers = index.db.prepare('SELECT * FROM watchlist WHERE UUID=?').all(user.value.uuid);

    const retarr = [];

    const files = answers.map(a => a['path']);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (retarr.length > length)
            break;  
        const pathCheck = checkPath(file);
        if (pathCheck.isOk === false) return;

        const path = pathCheck.value;

        if (!fs.existsSync(path)) return;

        if (fs.lstatSync(path).isFile())
            if (!index.VideoNameExtensions.includes(path.split('.')[path.split('.').length - 1]))
                return;
        if (!fs.existsSync(path + '.jpg'))
            return;      
        const name = path.substring(path.lastIndexOf(Path.sep));
        const stars = getStars(token, ip, path);
        const push = {
            'name' : name,
            'Path' : path.replace(index.argv['Video Directory'], ''),
            'type' : fs.lstatSync(path).isDirectory() ? 'folder' : 'video',
            'image' : (await fs.promises.readFile(path + '.jpg')).toString('base64'),
            'watchList': true,
            'stars': stars.isOk ? stars.value : 0
        };
        if (push['type'] === 'video') {
            const time = loadTime(file['path'], token, ip, user);
            push['timeStemp'] = time.isOk ? time.value : 0;          
        }    
        retarr.push(push);        
    }

    return {
        isOk: true,
        value: retarr
    };
}

async function getFileFromFolder(path:string, token:string, ip:string, length:number): Promise<BackendRequest<Array<FileData>>> {
    const retarr = [];
    const user = getUserFromToken(token, ip);
    if (user.isOk === false)
        return user;
    const files = index.fileIndex.prepare('SELECT * FROM files').all().filter(a => {
        return new RegExp(escapeRegExp(path + Path.sep) + '[^' + escapeRegExp(Path.sep) + ']*(' + escapeRegExp(Path.sep) + '|(' + index.VideoNameExtensions.join('|') + '))$').test(a['isDir'] ? a['path'] + Path.sep : a['path']);
    });
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (retarr.length > length)
            break; 
        let name:string = file['path'].split(Path.sep)[file['path'].split(Path.sep).length - 1];
        if (!file['isDir'])
            name = name.substring(0, name.lastIndexOf('.'));
        const stars = getStars(token, ip, file['path']);
        const watchlist = IsOnWatchList(user.value, file['path'].replace(index.argv['Video Directory'], ''));
        const push = {
            'name' : name,
            'Path' : file['path'].replace(index.argv['Video Directory'], ''),
            'type' : file['isDir'] ? 'folder' : 'video',
            'image' : (await fs.promises.readFile(file['path'] + '.jpg')).toString('base64'),
            'watchList': watchlist.isOk ? watchlist.value : false,
            'stars': stars.isOk ? stars.value : 0
        };
        if (push['type'] === 'video') {
            const time = loadTime(file['path'], token, ip, user);
            push['timeStemp'] = time.isOk ? time.value : 0;          
        }
        retarr.push(push);
    }
    
    return {
        isOk: true,
        value: retarr
    };
}

async function getFileFromCreated(path:string, token:string, ip:string, length:number) : Promise<BackendRequest<Array<FileData>>> {
    const user = getUserFromToken(token, ip);

    if (user.isOk === false) return user;
    const retarr = [];
    let files = index.fileIndex.prepare('SELECT * FROM files').all();
    files = files.filter(a => !a['isDir']);
    files = files.sort((a, b) => b['created'] - a['created']);
    if (files.length > 50)
        files = files.slice(0, 50);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (retarr.length > length)
            break; 
        let name:string = file['path'].split(Path.sep)[file['path'].split(Path.sep).length - 1];
        if (!file['isDir'])
            name = name.substring(0, name.lastIndexOf('.'));
        const stars = getStars(token, ip, file['path']);
        const time = loadTime(path + Path.sep + file, token, ip, user);
        const watchlist = IsOnWatchList(user.value, file['path'].replace(index.argv['Video Directory'], ''));
        const push = {
            'name' : name,
            'Path' : file['path'].replace(index.argv['Video Directory'], ''),
            'type' : 'video',
            'image' : (await fs.promises.readFile(file['path'] + '.jpg')).toString('base64'),
            'watchList': watchlist.isOk ? watchlist.value : false,
            'timeStemp': time.isOk ? time.value : 0,
            'stars': stars.isOk ? stars.value : 0
        };
        retarr.push(push);
            
    }
    
    return {
        isOk: true,
        value: retarr
    };
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

export { getFiles, getFileAmount };