import * as index from "../index";
import { LoginInterface } from "../interfaces";
const PermissionLevel = ["User", "Admin"];
const TokenLenght = 20;


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

export async function getUserFromToken (token:string, ip:string): Promise<UserRequestAnswer> {
    var data = readLogins();

    let keys = Object.keys(data);
    for (let a = 0; a < keys.length; a++) {
        var user = <User> Object.assign({}, data[keys[a]]);
        for (let i = 0; i < user["token"].length; i++) {
            if (user["token"][i]["token"] === token && user["token"][i]["ip"] === ip) {
                if (user["active"]) {
                    user["uuid"] = keys[a];
                    return {"status" : true, "data" : user};
                } else {
                    return { "status" : false, "reason" : "Der Account ist deaktiviert!" }
                }
            }
        }
    }
    return { "status" : false, "reason" : "User not Found" }
}

export async function addNewUser (username:string, password:string, perm:"Admin"|"User") : Promise<BasicAnswer> {
    var data = readLogins();

    let keys = Object.keys(data);
    for (let a = 0; a < keys.length; a++) {
        if (username === data[keys[a]]["username"])
            return { "status" : false, "reason" : "Der Username exestiert bereits!" }
    }
    let uuid = uuidv4();
    while (data.hasOwnProperty(uuid)) {
        uuid = uuidv4();
    }

    if (!PermissionLevel.includes(perm))
        return { "status" : false, "reason" : "Die Permission gibt es nicht!" }

    data[uuid] = {
        "username" : username,
        "password" : password,
        "perm" : perm,
        "active" : true,
        "token" : []
    }

    return {"status": writeLogins(data)};
}

export async function GenerateUserToken (username:string, password:string, ip:string): Promise<TokenAnswer>{
    var data = readLogins()
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        var user = data[keys[i]];
        if (user["username"] === username && user["password"] === password) {
            if (!user["active"])
                return {"status" : false, "reason" : "Der account ist deaktiviert!"}
            var rohtoken = await generateToken();
            var token = {
                "when" : Date.now(),
                "to" : new Date(Date.now() + (1000 * 60 * 60 * 24)).getTime(),
                "token" : rohtoken,
                "ip" : ip
            }
            var tokens = user["token"];
            tokens.push(token)
            user["token"] = tokens;
            data[keys[i]] = user;
            return {"status": writeLogins(data), "data" : rohtoken};
        }
    }
    return {"status" : false, "reason" : "Der Benutzername oder das Passwort ist falsch"};
}

export async function checkToken (token:string, ip:string): Promise<SecretUser> {
    var user = await getUserFromToken(token, ip);
    if (user["status"] === true) {
        delete user["data"]["password"];
        delete user["data"]["token"];
    } 
    return user;
}

export async function loadUsers (token:string, ip:string) : Promise<BasicAnswer> {
    let user = await getUserFromToken(token, ip);
    if (user["status"] === true) {
        if (user["data"]["perm"] === "Admin") {
            let users = readLogins();
            let retUsers = [];
            let keys = Object.keys(users);
            for (let i = 0; i < keys.length; i++) {
                let AddUser = Object.assign({}, users[keys[i]]);
                AddUser["uuid"] = keys[i];
                delete AddUser["token"];
                var passText = "";
                for (var a = 0; a < AddUser["password"].length; a++) {
                    passText += "*"
                }
                AddUser["password"] = passText;
                retUsers.push(AddUser);
            }
            return {"status" : true, "data" : retUsers} 
        } else {
            return {"status" : false, "reason" : "You are not permitted to do that!"}
        }
    } else {
        return user;
    }
}

export async function deleteToken (uuid:string, token:string, ip:string) : Promise<BasicAnswer>{
    let AuthoriseUser = await getUserFromToken(token, ip);
    if (AuthoriseUser["status"] && AuthoriseUser["data"]["perm"] === "Admin") {
        let data = await readLogins();
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === uuid) {
                let user = data[keys[i]];
                user["token"] = [];
                data[keys[i]] = user;
                return {"status": writeLogins(data)};
            }
        }
        return {"status": false, "reason": "User not Found!"}
    } else {
        return {"status": false, "reason": "Permission denied!"}
    }
}

export async function changeActiveState (state:boolean, uuid:string, token:string, ip:string): Promise<BasicAnswer>{
    var user = await getUserFromToken(token, ip);
    if (!user["status"])
        return user;
        
    let data = await readLogins();
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i] === uuid) {
            let user = data[keys[i]];
            user["active"] = state;
            data[keys[i]] = user;
            return {"status": writeLogins(data)};
        }
    }
    return {"status" : false, "reason": "UUID User not found"}
}
    
    
export async function changePassword (token:string, ip:string, oldPass:string, newPass:string): Promise<BasicAnswer> {
    var user = await getUserFromToken(token, ip);
    if (!user["status"])
        return user;
        
    let data = await readLogins();
    if (data.hasOwnProperty(user["data"]["uuid"])) {
        if (user["data"]["password"] === oldPass) {
            let uuid = user["data"]["uuid"];
            user["data"]["password"] = newPass;
            delete user["data"]["uuid"]
            data[uuid] = user["data"];
            return {"status": writeLogins(data)};
        } else {
            return {"status" : false, "reason": "The old password is wrong!"}
        }
    } else {
        return {"status" : false, "reason": "Something went wrong in the backend!"}
    }
}

export async function checkTokenForValid() {
    let data = readLogins()
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        let user = <User> data[keys[i]];
        let tokens = user["token"]
        for (let a = 0; a < tokens.length; a++) {
            let token = tokens[a];
            if (Date.now() > new Date(token["to"]).getTime()) {
                tokens.splice(a, 1);
            }
        }
        user["token"] = tokens;
        data[keys[i]] = user;
        writeLogins(data)
    }
}

export async function logout(tokenToLogout:string, ip:string): Promise<BasicAnswer> {
    let data = readLogins()
    let user = await getUserFromToken(tokenToLogout, ip)
    if (!user["status"])
        return <BasicAnswer> user;
    let tokens = user.data.token
    let found = false
    for (let a = 0; a < tokens.length; a++) {
        let token = tokens[a];
        if (token.token === tokenToLogout) {
            tokens.splice(a, 1);
            found = true;
        }
    }
    user["token"] = tokens;
    writeLogins(data)
    if (found)
        return {
            status: true
        }
    else
        return {
            status: false,
            reason: "Token not found"
        }
}


async function generateToken() {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.-:_!%&/()}][{';
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