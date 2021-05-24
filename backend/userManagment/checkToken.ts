import { SecretUser } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';

function checkToken (token:string, ip:string): SecretUser {
    const user = getUserFromToken(token, ip);
    if (user['status'] === true) {
        delete user['data']['password'];
        delete user['data']['token'];
    } 
    return user;
}

export { checkToken };