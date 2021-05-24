import { BasicAnswer } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function deleteToken (uuid: string, token:string, ip:string) : BasicAnswer {
    const AuthoriseUser = getUserFromToken(token, ip);
    if (AuthoriseUser['status'] && AuthoriseUser['data']['perm'] === 'Admin') {
        db.prepare('DELETE FROM tokens WHERE UUID=?').run(uuid);
        return {'status': true, data: null};
    } else {
        return {'status': false, 'reason': 'Permission denied!'};
    }
}

export {deleteToken};