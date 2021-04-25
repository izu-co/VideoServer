import * as index from "../index"
import * as Path from "path"
import * as fs from "fs"
import { SettingsDataInterface, SettingsInterface, StatusInterface, IntroSkipInterface, LoginInterface } from "../interfaces";
import * as loginBackend from "./UserMangement"
import { db } from "../index";
import { RunResult } from "better-sqlite3";

export interface Status {
    "status": true|false
}

export interface FileData {
    "name": string,
    "Path": string,
    "type": "video"|"folder",
    "image": string,
    "watchList": boolean,
    "timeStemp"?: number|Promise<number>
}

export interface BasicAnswer {
    "status": true|false,
    "reason"?:string,
    "data"?:any
}

export interface SkipData {
    "startTime": number,
    "stopTime": number,
    "next"?: string,
    "current": string,
    "pathSep": string
}


export interface UserDataAnswer {
    "status": true|false,
    "data"?: {
        "volume"?: string
    } | object
}

export interface Token {
    "when":number,
    "to":number,
    "token":string,
    "ip":string
}

export interface User {
    "username":string,
    "password":string,
    "perm":"Admin"|"User",
    "active":true|false,
    "uuid": string
}

export interface SecretUser {
    "status":true|false,
    "reason"?:string,
    "data"?: {
        "username":string,
        "perm":"Admin"|"User",
        "active":true|false
    }
}

export interface UserRequestAnswer {
    "status": true|false,
    "data"?:User,
    "reason"?:string
}

export interface BasicAnswer {
    "status": true|false,
    "reason"?:string,
    "data"?:any
}

export interface TokenAnswer {
    "status":true|false,
    "data"?:string,
    "reason"?:string
}

export enum SortTypes {
    File = "Nach Ordner", Created = "Zuletzt hinzugefügt", WatchList = "Watchlist"
}

function isEmptyObject(obj:object) {
    return !Object.keys(obj).length;
}

function checkPath(path:string): BasicAnswer {
    if (!path)
        path = index.argv["Video Directory"]
    if (!path.startsWith(index.argv["Video Directory"]))
        path = Path.join(index.argv["Video Directory"], path)

    if (!Path.resolve(path).startsWith(Path.resolve(index.argv["Video Directory"])))
        return {
            status: false,
            reason: "The path provided is invalid"
        }
    return {
        "status": true,
        "data": path
    }
}

function getUserData (token:string, ip:string): UserDataAnswer {
    let answer = loginBackend.getUserFromToken(token, ip)
    if (!answer["status"])
        return answer;
    
    let volume = db.prepare("SELECT * from settings WHERE UUID=?").get(answer.data.uuid)
    var ret = {};
    
    if (volume === undefined) {
        ret["volume"] = db.prepare("SELECT * from settings WHERE UUID=?").get("default")["volume"]
    } else {
        ret["volume"] = volume["volume"]
    }
    
    return {"status" : true, "data" : ret};
}

function saveUserData (token:string, ip:string, data:SettingsDataInterface) : Status{
    let user = loginBackend.getUserFromToken(token, ip)
    if (!user.status) return user;

    let exists = db.prepare("SELECT * FROM settings WHERE UUID=?").get(user.data.uuid)
    let answer:RunResult;
    if (exists)
        answer = db.prepare("UPDATE settings SET volume = ? WHERE UUID = ?").run(data["volume"], user.data.uuid)
    else 
        answer = db.prepare("INSERT INTO settings VALUES(?,?)").run(user.data.uuid, data["volume"])
    return {"status" : answer.changes > 0}
}

function readdir(path:string) {
    return fs.readdirSync(path)
}

function generateToken(TokenLenght) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let generateNewToken = true;

  
    while (generateNewToken) {
        for ( var i = 0; i < TokenLenght; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        generateNewToken = false;
        
        let data = db.prepare("SELECT * FROM users WHERE UUID=?").get(result)
        if (data !== undefined) {
            generateNewToken = true;
            result = ''
        }
    }
    return result;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export {isEmptyObject, checkPath, getUserData, saveUserData, readdir, generateToken, uuidv4}