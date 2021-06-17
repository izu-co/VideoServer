import { BackendRequest } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function changePassword (token:string, ip:string, oldPass:string, newPass:string): BackendRequest<undefined> {
    const user = getUserFromToken(token, ip);
    if (user.isOk === false)
        return user;
    if (user.value.password === oldPass) {
        db.prepare('UPDATE users SET password=? WHERE UUID=?').run(newPass, user.value.uuid);
        return { isOk: true, value: undefined };
    } else {
        return { isOk: false, statusCode: 400, message: 'The old password is wrong!'};
    }
}

export { changePassword };