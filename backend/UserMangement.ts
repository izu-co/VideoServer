import * as index from "../index";
import * as path from "path";
import * as fs from "fs";
const PermissionLevel = ["User", "Admin"];
const TokenLenght = 20;
const loginFilePath = path.join(index.argv["Working Directory"], "data", "logins.json")


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
    "user"?: {
        "username":string,
        "perm":"Admin"|"User",
        "active":true|false
    }
}

export interface UserRequestAnswer {
    "status": true|false,
    "user"?:User,
    "reason"?:string
}

export interface BasicAnswer {
    "status": true|false,
    "reason"?:string
}

export interface TokenAnswer {
    "status":true|false,
    "token"?:string,
    "reason"?:string
}

export async function getUserFromToken (token:string, ip:string): Promise<UserRequestAnswer> {
    var data = await readLogins();

    let keys = Object.keys(data);
    for (let a = 0; a < keys.length; a++) {
        var user = <User> data[keys[a]];
        for (let i = 0; i < user["token"].length; i++) {
            if (user["token"][i]["token"] === token && user["token"][i]["ip"] === ip) {
                if (user["active"]) {
                    user["uuid"] = keys[a];
                    return {"status" : true, "user" : user};
                } else {
                    return { "status" : false, "reason" : "Der Account ist deaktiviert!" }
                }
            }
        }
    }
    console.log(token ,ip)
    return { "status" : false, "reason" : "User not Found" }
}

export async function addNewUser (username:string, password:string, perm:string) : Promise<BasicAnswer> {
    var data = await readLogins();

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

    return {"status": await writeLogins(data)};
}

export async function GenerateUserToken (username:string, password:string, ip:string): Promise<TokenAnswer>{
    var data = await readLogins();
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
            return {"status": await writeLogins(data), "token" : rohtoken};
        }
    }
    return {"status" : false, "reason" : "Der Benutzername oder das Passwort ist falsch"};
}

export async function checkToken (token:string, ip:string): Promise<SecretUser> {
    var user = await getUserFromToken(token, ip);
    if (user["status"] === true) {
        delete user["user"]["password"];
        delete user["user"]["token"];
    } 
    return user;
}

export async function loadUsers (token:string, ip:string) {
    let user = await getUserFromToken(token, ip);
    if (user["status"] === true) {
        if (user["user"]["perm"] === "Admin") {
            let users = await readLogins();
            let retUsers = [];
            let keys = Object.keys(users);
            for (let i = 0; i < keys.length; i++) {
                let AddUser = users[keys[i]];
                AddUser["uuid"] = keys[i];
                delete AddUser["token"];
                var passText = "";
                for (var a = 0; a < AddUser["password"].length; a++) {
                    passText += "*"
                }
                AddUser["password"] = passText;
                retUsers.push(AddUser);
            }
            return {"status" : true, "users" : retUsers} 
        } else {
            return {"status" : false, "reason" : "You are not permitted to do that!"}
        }
    } else {
        return user;
    }
}

export async function deleteToken (uuid:string, token:string, ip:string) : Promise<BasicAnswer>{
    let AuthoriseUser = await getUserFromToken(token, ip);
    if (AuthoriseUser["status"] && AuthoriseUser["user"]["perm"] === "Admin") {
        let data = await readLogins();
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === uuid) {
                let user = data[keys[i]];
                user["token"] = [];
                data[keys[i]] = user;
                return {"status": await writeLogins(data)};
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
            return {"status": await writeLogins(data)};
        }
    }
    return {"status" : false, "reason": "UUID User not found"}
}
    
    
export async function changePassword (token:string, ip:string, oldPass:string, newPass:string): Promise<BasicAnswer> {
    var user = await getUserFromToken(token, ip);
    if (!user["status"])
        return user;
        
    let data = await readLogins();
    if (data.hasOwnProperty(user["user"]["uuid"])) {
        if (user["user"]["password"] === oldPass) {
            let uuid = user["user"]["uuid"];
            user["user"]["password"] = newPass;
            delete user["user"]["uuid"]
            data[uuid] = user["user"];
            return {"status": await writeLogins(data)};
        } else {
            return {"status" : false, "reason": "The old password is wrong!"}
        }
    } else {
        return {"status" : false, "reason": "Something went wrong in the backend!"}
    }
}

export async function checkTokenForValid() {
    readLogins().then(data => {
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
    })
}


async function generateToken() {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.-:_!%&/()}][{';
    let generateNewToken = true;

    var data = await readLogins();
    let keys = Object.keys(data);
    
    while (generateNewToken) {
        for ( var i = 0; i < length; i++ ) {
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

function writeLogins(data) {
    return new Promise<boolean>(function (resolve, reject) {
        fs.writeFile(loginFilePath, JSON.stringify(data, null, 4), function (err) {
            if (err)
                reject(false);
            else 
                resolve(true);
        })
    })
}

function readLogins() {
    return new Promise(function (resolve, reject) {
        fs.readFile(loginFilePath, 'utf8', function (err, data) {
            if (err)
                reject(err);
            else
                resolve(JSON.parse(data));
        });
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}