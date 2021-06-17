import { BackendRequest } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function changeActiveState (state:1|0, uuid:string, token:string, ip:string): BackendRequest<undefined> {
    const user = getUserFromToken(token, ip);
    if (user.isOk === false)
        return user;
    if (user.value.perm !== 'Admin') return {isOk: false, statusCode: 401, message: 'Unauthorized' };
   
    const tochange = db.prepare('SELECT * FROM users WHERE UUID=?').get(uuid);

    if (tochange === undefined)
        return {isOk: false, statusCode: 400, message: 'UUID not found' };

    db.prepare('UPDATE users SET active=? WHERE UUID=?').run(state, uuid);
    return { isOk: true, value: undefined };
}

export {changeActiveState};