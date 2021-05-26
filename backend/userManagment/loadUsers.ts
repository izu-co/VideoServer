import { UserAccountInfo, UserAccountInfoResponse } from '../../interfaces';
import { getUserFromToken } from '../UserMangement';
import { db } from '../..';

function loadUsers (token:string, ip:string) : UserAccountInfoResponse {
    const user = getUserFromToken(token, ip);
    if (user['status'] === true) {
        if (user['data']['perm'] === 'Admin') {
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
            return {'status' : true, 'data' : retUsers}; 
        } else {
            return {'status' : false, 'reason' : 'You are not permitted to do that!'};
        }
    } else {
        return user;
    }
}

export {loadUsers};