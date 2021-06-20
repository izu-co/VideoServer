
import { checkPath } from '../util';
import { BackendRequest, User } from '../../interfaces';
import * as loginBackend from '../UserMangement';
import { db } from '../..';

function loadTime(path:string, token:string, ip:string, user:BackendRequest<User> = null) : BackendRequest<number> {
    const pathCeck = checkPath(path);
    if (pathCeck.isOk === false)
        return {
            isOk: true,
            value: 0
        };
    path = pathCeck.value;    
    if (user === null) {
        user = loginBackend.getUserFromToken(token, ip);
    }
    if (user.isOk === false)
        return {
            isOk: true,
            value: -1
        };

    const data = db.prepare('SELECT * FROM status WHERE UUID=? AND path=?').get(user.value.uuid, path);
    if (data === undefined)
        return {
            isOk: true,
            value: 0
        };
    else 
        return {
            isOk: true,
            value: data['data']
        };
}

export {loadTime};