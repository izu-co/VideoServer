import { UserAccountInfo, BackendRequest } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function loadUsers (token:string, ip:string) : BackendRequest<Array<UserAccountInfo>> {
    const user = getUserFromToken(token, ip);
    if (user.isOk === true) {
        if (user.value.perm === 'Admin') {
            const users = db.prepare('SELECT * from users').all();
            const retUsers : Array<UserAccountInfo> = [];
            for (let i = 0; i < users.length; i++) {
                const addUser = users[i];
                let passText = '';
                for (let a = 0; a < addUser['password'].length; a++) {
                    passText += '*';
                }
                addUser['password'] = passText;
                retUsers.push(addUser);
            }
            return {isOk: true, value : retUsers}; 
        } else {
            return {isOk: false, statusCode: 401, message : 'You are not permitted to do that!'};
        }
    } else {
        return user;
    }
}

export {loadUsers};