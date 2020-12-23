import * as index from "../index"
import * as Path from "path"
import * as fs from "fs"
import { SettingsDataInterface, SettingsInterface, StatusInterface, IntroSkipInterface, LoginInterface } from "../interfaces";
import * as loginBackend from "./UserMangement"


export interface Status {
    "status": true|false
}

export interface FileData {
    "name": string,
    "Path": string,
    "type": "video"|"folder",
    "image": string,
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
    "token": Array<Token>
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
    File = "Nach Ordner", Created = "Zuletzt hinzugefügt"
}

function isEmptyObject(obj:object) {
    return !Object.keys(obj).length;
}

function checkPath(path:string): BasicAnswer {
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

async function getUserData (token:string, ip:string): Promise<UserDataAnswer> {
    return await loginBackend.getUserFromToken(token, ip).then(answer => {
        if (!answer["status"])
            return answer;
        let user = answer["data"]
        var settings = loadSettings()
        var ret = {};
    
        if (user !== null && settings.hasOwnProperty(user["username"])) {
            ret["volume"] = settings[user["username"]]["volume"]
        } else {
            ret["volume"] = settings["default"]["volume"];
        }
    
        return {"status" : true, "data" : ret};
    })
}

async function saveUserData (token:string, ip:string, data:SettingsDataInterface) : Promise<Status>{
    return await loginBackend.getUserFromToken(token, ip).then(user => {
        var settings = loadSettings();
    
        settings[user["data"]["username"]] = data;
    
        saveSettings(settings);
        return {"status" : true}
    })
}

function loadSettings(): SettingsInterface {
    return index.cache.settings
}

function saveSettings(settings:SettingsInterface) {
    index.cache.settings = settings
}

function getData(): StatusInterface {
    return index.cache.status
}

function saveData(data:StatusInterface) {
    index.cache.status = data
}
function loadSkips(): IntroSkipInterface {
    return index.cache.introSkips;
}

async function readdir(path:string) {
    return new Promise<string[]>(function (resolve, reject) {
        fs.readdir(path, 'utf8', function (err, data) {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}

async function generateToken(TokenLenght) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let generateNewToken = true;

    var data = readLogins();
    let keys = Object.keys(data);
    
    while (generateNewToken) {
        for ( var i = 0; i < TokenLenght; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        generateNewToken = false;
        
        for (let a = 0; a < keys.length; a++) {
            var user = data[keys[a]];
            for (let i = 0; i < user["token"].length; i++) 
                if (user["token"]["token"] === result) {
                    generateNewToken = true;
                    result = ''
                }
        }
    }
    return result;
}


function writeLogins(data:LoginInterface) {
    index.cache.logins = data;
    return true;
}

function readLogins() {           
    return Object.assign({}, index.cache.logins)
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export {isEmptyObject, checkPath, getUserData, saveUserData, loadSettings, saveSettings, getData, saveData, loadSkips, readdir, generateToken, writeLogins, readLogins, uuidv4}