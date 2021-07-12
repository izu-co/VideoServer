import * as index from '../index';
import * as Path from 'path';
import * as fs from 'fs';
import { SettingsDataInterface } from '../interfaces';
import * as loginBackend from './UserMangement';
import { db } from '../index';
import { UserData, BackendRequest} from '../interfaces';

function isEmptyObject(obj:object) : boolean {
    return !Object.keys(obj).length;
}

function checkPath(path:string): BackendRequest<string> {
    if (!path)
        path = index.argv['Video Directory'];
    if (!path.startsWith(index.argv['Video Directory']))
        path = Path.join(index.argv['Video Directory'], path);

    if (!Path.resolve(path).startsWith(Path.resolve(index.argv['Video Directory'])))
        return {
            isOk: false,
            statusCode: 404,
            message: 'The path provided is invalid'
        };
    return {
        isOk: true,
        value: path
    };
}

function getUserData (token:string, ip:string): BackendRequest<UserData> {
    const answer = loginBackend.getUserFromToken(token, ip);
    if (answer.isOk === false)
        return answer;
    
    const volume = db.prepare('SELECT * from settings WHERE UUID=?').get(answer.value.uuid);
    const ret = {
        volume: (volume ?? {})['volume'] || db.prepare('SELECT * from settings WHERE UUID=?').get('default')['volume']
    };
    
    return {
        isOk: true,
        value: ret
    };
}

function saveUserData (token:string, ip:string, data:SettingsDataInterface) : BackendRequest<undefined> {
    const user = loginBackend.getUserFromToken(token, ip);
    if (user.isOk === false) return user;

    if (!('volume' in data && Number.isInteger(data.volume) && data.volume >= 0 && data.volume <= 100 )) 
        return {isOk: false, statusCode: 400, message: 'Malformatted data' };

    const exists = db.prepare('SELECT * FROM settings WHERE UUID=?').get(user.value.uuid);
    if (exists)
        db.prepare('UPDATE settings SET volume = ? WHERE UUID = ?').run(data['volume'], user.value.uuid);
    else 
        db.prepare('INSERT INTO settings VALUES(?,?)').run(user.value.uuid, data['volume']);
    return { isOk: true, value: undefined };
}

function readdir(path:string) : string[] {
    return fs.readdirSync(path);
}

function generateToken(TokenLenght: number) : string {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let generateNewToken = true;

  
    while (generateNewToken) {
        for ( let i = 0; i < TokenLenght; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        generateNewToken = false;
        
        const data = db.prepare('SELECT * FROM users WHERE UUID=?').get(result);
        if (data !== undefined) {
            generateNewToken = true;
            result = '';
        }
    }
    return result;
}

function uuidv4() : string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export {isEmptyObject, checkPath, getUserData, saveUserData, readdir, generateToken, uuidv4};