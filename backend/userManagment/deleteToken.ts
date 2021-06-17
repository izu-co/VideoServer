import { BackendRequest } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function deleteToken (uuid: string, token:string, ip:string) : BackendRequest<undefined> {
    const authoriseUser = getUserFromToken(token, ip);
    if (authoriseUser.isOk === false)
        return authoriseUser;
    if (authoriseUser.value.perm === 'Admin') {
        db.prepare('DELETE FROM tokens WHERE UUID=?').run(uuid);
        return { isOk: true, value: undefined };
    } else {
        return { isOk: false, statusCode: 401, message: 'Permission denied!'};
    }
}

export {deleteToken};