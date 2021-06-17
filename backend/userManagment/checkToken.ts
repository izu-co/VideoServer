import { SecretUser, BackendRequest } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';

function checkToken (token:string, ip:string): BackendRequest<SecretUser> {
    const user = getUserFromToken(token, ip);
    if (user.isOk) {
        delete user.value.password;
        delete user.value.uuid;
        return {
            isOk: true,
            value: user.value
        };
    } else {
        return user;
    }
}

export { checkToken };