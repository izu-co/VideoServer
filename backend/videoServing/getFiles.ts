import { checkPath } from '../util';
import { SortTypes } from '../../interfaces';
import { FileData, BackendRequest } from '../../interfaces';
import * as index from '../../index';
import * as fs from 'fs';
import * as Path from 'path';
import { loadTime, IsOnWatchList, getStars } from '../fileStuff';
import { getUserFromToken } from '../UserMangement';

function getFiles(path:string, token:string, ip:string, type:string|null|SortTypes = null): BackendRequest<Array<FileData>> {
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
    
    switch(searchType) {
    case SortTypes.File:
        return getFileFromFolder(path, token, ip);
    case SortTypes.Created:
        return getFileFromCreated(path, token, ip);
    case SortTypes.WatchList:
        return getFilesFromWatchList(token, ip);
    }
}

function getFilesFromWatchList(token:string, ip:string) : BackendRequest<Array<FileData>> {
    const user = getUserFromToken(token, ip);

    if (user.isOk === false) return user;

    const answers = index.db.prepare('SELECT * FROM watchlist WHERE UUID=?').all(user.value.uuid);

    const retarr = [];

    answers.map(a => a['path']).forEach(file => {
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
            'image' : (path + '.jpg').replace(index.argv['Video Directory'], ''),
            'watchList': true,
            'stars': stars.isOk ? stars.value : 0
        };
        if (push['type'] === 'video') {
            const time = loadTime(file['path'], token, ip, user)
            push['timeStemp'] = time.isOk ? time.value : 0          
        }    
        retarr.push(push);        
    });

    return {
        isOk: true,
        value: retarr
    };
}

function getFileFromFolder(path:string, token:string, ip:string): BackendRequest<Array<FileData>> {
    const retarr = [];
    const user = getUserFromToken(token, ip);
    if (user.isOk === false)
        return user;
    index.fileIndex.prepare('SELECT * FROM files').all().filter(a => {
        return new RegExp(escapeRegExp(path + Path.sep) + '[^' + escapeRegExp(Path.sep) + ']*(' + escapeRegExp(Path.sep) + '|(' + index.VideoNameExtensions.join('|') + '))$').test(a['isDir'] ? a['path'] + Path.sep : a['path']);
    }).forEach(file => { 
        let name:string = file['path'].split(Path.sep)[file['path'].split(Path.sep).length - 1];
        if (!file['isDir'])
            name = name.substring(0, name.lastIndexOf('.'));
        const stars = getStars(token, ip, file['path']);
        const watchlist = IsOnWatchList(user.value, file['path'].replace(index.argv['Video Directory'], ''));
        const push = {
            'name' : name,
            'Path' : file['path'].replace(index.argv['Video Directory'], ''),
            'type' : file['isDir'] ? 'folder' : 'video',
            'image' : (file['path'] + '.jpg').replace(index.argv['Video Directory'], ''),
            'watchList': watchlist.isOk ? watchlist.value : false,
            'stars': stars.isOk ? stars.value : 0
        };
        if (push['type'] === 'video') {
            const time = loadTime(file['path'], token, ip, user)
            push['timeStemp'] = time.isOk ? time.value : 0          
        }
        retarr.push(push);
            
    });
    return {
        isOk: true,
        value: retarr
    };
}

function getFileFromCreated(path:string, token:string, ip:string) : BackendRequest<Array<FileData>> {
    const user = getUserFromToken(token, ip);

    if (user.isOk === false) return user;
    const retarr = [];
    let files = index.fileIndex.prepare('SELECT * FROM files').all();
    files = files.filter(a => !a['isDir']);
    files = files.sort((a, b) => b['created'] - a['created']);
    if (files.length > 50)
        files = files.slice(0, 50);
    files.forEach(file => { 
        let name:string = file['path'].split(Path.sep)[file['path'].split(Path.sep).length - 1];
        if (!file['isDir'])
            name = name.substring(0, name.lastIndexOf('.'));
        const stars = getStars(token, ip, file['path']);
        const time = loadTime(path + Path.sep + file, token, ip, user)
        const watchlist = IsOnWatchList(user.value, file['path'].replace(index.argv['Video Directory'], ''));
        const push = {
            'name' : name,
            'Path' : file['path'].replace(index.argv['Video Directory'], ''),
            'type' : 'video',
            'image' : (file['path'] + '.jpg').replace(index.argv['Video Directory'], ''),
            'watchList': watchlist.isOk ? watchlist.value : false,
            'timeStemp': time.isOk ? time.value : 0,
            'stars': stars.isOk ? stars.value : 0
        };
        retarr.push(push);
            
    });
    
    return {
        isOk: true,
        value: retarr
    };
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

export {getFiles};