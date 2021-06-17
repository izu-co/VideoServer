import { sep } from 'path';
import { db } from '../..';
import { getUserFromToken } from '../UserMangement';
import { BackendRequest, User } from '../../interfaces';

function addToWatchList(token: string, ip:string, path:string) : BackendRequest<string> {

    const user = getUserFromToken(token, ip);

    if (user.isOk === false) return user;

    if (!path.startsWith(sep)) path = sep + path;

    if (db.prepare('SELECT * FROM watchlist WHERE path=? AND UUID=?').get(path, user.value.uuid) === undefined) {
        db.prepare('INSERT INTO watchlist VALUES (?, ?)').run(user.value.uuid, path);
        return {
            isOk: true,
            value: 'added'
        };
    } else {
        return {
            isOk: true,
            value: 'Allready on watchlist'
        };
    }

}

function removeFromWatchList(token:string, ip:string, path:string) : BackendRequest<string> {
    const user = getUserFromToken(token ,ip);

    if (user.isOk === false) return user;

    if (!path.startsWith(sep)) path = sep + path; 

    db.prepare('DELETE FROM watchlist WHERE UUID=? AND path=?').run(user.value.uuid, path);
    
    return {
        isOk: true,
        value: 'removed'
    };
}

function IsOnWatchList(user: User, path:string) : BackendRequest<boolean> {

    if (!path.startsWith(sep)) path = sep + path;

    return {
        isOk: true,
        value: db.prepare('SELECT * FROM watchlist where UUID=? AND path=?').get(user.uuid, path) !== undefined
    };
}

export { addToWatchList, removeFromWatchList, IsOnWatchList};