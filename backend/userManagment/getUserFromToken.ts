import { BackendRequest, User } from '../../interfaces';
import { db } from '../../index';

function getUserFromToken (token:string, ip:string): BackendRequest<User> {

    const tokenUser = db.prepare('SELECT * FROM tokens WHERE token=?').get(token);

    if (tokenUser === undefined) return { statusCode: 404, isOk: false };
    if (tokenUser['ip'] !== ip)  return { statusCode: 404, isOk: false };

    const User = db.prepare('SELECT * FROM users WHERE UUID=?').get(tokenUser['UUID']);

    if (User === undefined) return { statusCode: 404, isOk: false };
    if (!User['active']) return { statusCode: 403, message: 'The account has been disabled!', isOk: false };

    return {
        isOk: true,
        value: {
            active: User['active'] === 'true' || User['active'] === true ? true : false,
            password: User['password'],
            perm: User['perm'],
            username: User['username'],
            uuid: User['UUID']
        }
    };
}

export {getUserFromToken};