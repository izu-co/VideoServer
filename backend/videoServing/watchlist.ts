import { sep } from 'path';
import { db } from '../..';
import { getUserFromToken } from '../UserMangement';
import { WatchListResponse, User } from '../../interfaces';

function addToWatchList(token: string, ip:string, path:string) : WatchListResponse {

    const user = getUserFromToken(token, ip);

    if (user.status === false) return user;

    if (!path.startsWith(sep)) path = sep + path;

    if (db.prepare('SELECT * FROM watchlist WHERE path=? AND UUID=?').get(path, user.data.uuid) === undefined) {
        db.prepare('INSERT INTO watchlist VALUES (?, ?)').run(user.data.uuid, path);
        return {
            status: true,
            data: 'added'
        };
    } else {
        return {
            status: false,
            reason: 'Allready on watchlist'
        };
    }

}

function removeFromWatchList(token:string, ip:string, path:string) : WatchListResponse {
    const user = getUserFromToken(token ,ip);

    if (user.status === false) return user;

    if (!path.startsWith(sep)) path = sep + path; 

    db.prepare('DELETE FROM watchlist WHERE UUID=? AND path=?').run(user.data.uuid, path);
    
    return {
        status: true,
        data: 'removed'
    };
}

function IsOnWatchList(user: User, path:string) : boolean {

    if (!path.startsWith(sep)) path = sep + path;

    return db.prepare('SELECT * FROM watchlist where UUID=? AND path=?').get(user.uuid, path) !== undefined;
}

export { addToWatchList, removeFromWatchList, IsOnWatchList};