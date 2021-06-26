import { uuidv4 } from '../util';
import { db } from '../../index';
import { BackendRequest } from "../../interfaces";

const PermissionLevel = ['User', 'Admin'];

function addNewUser(username:string, password:string, perm:'Admin'|'User') : BackendRequest<undefined> {

    const userWithName = db.prepare('SELECT * FROM users WHERE username=?').get(username);
    if (userWithName !== undefined)
        return { isOk: false, statusCode: 400, message : 'The username already exists!' };
    let uuid = uuidv4();
    while (db.prepare('SELECT * FROM users WHERE UUID=?').get(uuid) !== undefined) {
        uuid = uuidv4();
    }

    if (!PermissionLevel.includes(perm))
        return { isOk: false, statusCode: 400, message : 'Unknown Permission!' };
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)').run(uuid, username, password, perm, 'true');
    
    return { isOk: true, value: undefined };
}

export { addNewUser };