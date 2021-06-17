import { BackendRequest } from '../../interfaces';
import { generateToken } from '../util';
import { db } from '../../index';

const TokenLenght = 20;

function generateUserToken (username:string, password:string, ip:string): BackendRequest<string> {

    const user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, password);
    if (user === undefined) return {isOk: false, statusCode: 403, message : 'Der Benutzername oder das Passwort ist falsch'};
    if (!user['active']) return {isOk: false, statusCode: 401, message: 'Der account ist deaktiviert!'};
    const rohtoken = generateToken(TokenLenght);
    db.prepare('INSERT INTO tokens VALUES (?, ?, ?, ?, ?)').run(rohtoken, user['UUID'], Date.now(), new Date(Date.now() + (1000 * 60 * 60 * 24)).getTime(), ip);
    return {
        isOk: true,
        value: rohtoken
    };
    
}

export {generateUserToken as GenerateUserToken};