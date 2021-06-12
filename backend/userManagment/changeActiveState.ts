import { Response } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function changeActiveState (state:1|0, uuid:string, token:string, ip:string): Response {
    const user = getUserFromToken(token, ip);
    if (!user['status'])
        return user;
    if (user['data']['perm'] !== 'Admin') return {status: false, reason: 'Unauthorized '};
   
    const tochange = db.prepare('SELECT * FROM users WHERE UUID=?').get(uuid);

    if (tochange === undefined)
        return {'status' : false, 'reason': 'UUID User not found'};

    db.prepare('UPDATE users SET active=? WHERE UUID=?').run(state, uuid);
    return { status: true };
}

export {changeActiveState};