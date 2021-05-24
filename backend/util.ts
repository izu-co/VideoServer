import * as index from '../index';
import * as Path from 'path';
import * as fs from 'fs';
import { SettingsDataInterface } from '../interfaces';
import * as loginBackend from './UserMangement';
import { db } from '../index';
import { RunResult } from 'better-sqlite3';
import { BasicAnswer, UserDataAnswer, Status } from "../interfaces";

function isEmptyObject(obj:object) : boolean {
    return !Object.keys(obj).length;
}

function checkPath(path:string): BasicAnswer {
    if (!path)
        path = index.argv['Video Directory'];
    if (!path.startsWith(index.argv['Video Directory']))
        path = Path.join(index.argv['Video Directory'], path);

    if (!Path.resolve(path).startsWith(Path.resolve(index.argv['Video Directory'])))
        return {
            status: false,
            reason: 'The path provided is invalid'
        };
    return {
        'status': true,
        'data': path
    };
}

function getUserData (token:string, ip:string): UserDataAnswer {
    const answer = loginBackend.getUserFromToken(token, ip);
    if (!answer['status'])
        return answer;
    
    const volume = db.prepare('SELECT * from settings WHERE UUID=?').get(answer.data.uuid);
    const ret = {};
    
    if (volume === undefined) {
        ret['volume'] = db.prepare('SELECT * from settings WHERE UUID=?').get('default')['volume'];
    } else {
        ret['volume'] = volume['volume'];
    }
    
    return {'status' : true, 'data' : ret};
}

function saveUserData (token:string, ip:string, data:SettingsDataInterface) : Status{
    const user = loginBackend.getUserFromToken(token, ip);
    if (!user.status) return user;

    if (!('volume' in data && Number.isInteger(data.volume) && data.volume >= 0 && data.volume <= 100 )) 
        return { status: false };

    const exists = db.prepare('SELECT * FROM settings WHERE UUID=?').get(user.data.uuid);
    let answer:RunResult;
    if (exists)
        answer = db.prepare('UPDATE settings SET volume = ? WHERE UUID = ?').run(data['volume'], user.data.uuid);
    else 
        answer = db.prepare('INSERT INTO settings VALUES(?,?)').run(user.data.uuid, data['volume']);
    return {'status' : answer.changes > 0};
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