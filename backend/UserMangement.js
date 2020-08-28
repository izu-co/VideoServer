const path = require("path")
const index = require("../index.js")
const fs = require("fs")
const PermissionLevel = ["User", "Admin"];
const length = 20;
const loginFilePath = path.join(index.path, "data", "logins.json")
module.exports = {
    /**
     * @param {string} token 
     * @param {string} ip 
     */
    getUserFromToken : async function (token, ip) {
        var data = await readLogins();

        let keys = Object.keys(data);
        for (let a = 0; a < keys.length; a++) {
            var user = data[keys[a]];
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
        return { "status" : false, "reason" : "User not Found" }
    },

    /**
     * @param {string} username The Username the user want´s to have
     * @param {string} password The Password the user want´s to have
     * @param {string} perm The Permission Level of the User (User, Admin)
     */
    addNewUser: async function (username, password, perm) {

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
    },

    /**
     * Used to generate a Token for a User (exp. Login)
     * 
     * @param {string} username Der Nutzname mit dem sich der Nutzer anmelden möchte
     * @param {string} password Das Passwort mit dem sich der Nutzer anmelden möchte
     * @param {string} ip Die IP des Nutzers
     */
    GenerateUserToken: async function(username, password, ip) {
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
    },

    /**
     * Used to check a Token and get an object suited to return to the user
     * Password and Token were removed!
     * 
     * @param {string} token The Token to check
     * @param {string} ip The IP to check
     */
    checkToken: async function (token, ip) {
        var user = await this.getUserFromToken(token, ip);
        if (user["status"] === true) {
            delete user["user"]["password"];
            delete user["user"]["token"];
        } 
        return user;
    },

    /**
     * Used to get all Users with censored Passwords (match Password length)
     * Require Admin Permission!
     * 
     * @param {string} token The Token of the User making the request
     * @param {string} ip The IP of the User making the request
     */
    loadUsers: async function(token, ip) {
        let user = await this.getUserFromToken(token, ip);
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
    },

    /**
     * Used to delete all token from a user
     * 
     * @param {string} uuid The UUID of the User from which the Token should be deleted
     * @param {string} token The Token of the Administrator issuing this request
     * @param {string} ip The IP of the Administrator issuing this request
     */
    deleteToken: async function(uuid, token, ip) {
        let AuthoriseUser = await this.getUserFromToken(token, ip);
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
            return {"status": false, "reson": "User not Found!"}
        } else {
            return {"status": false, "reason": "Permission denied!"}
        }
    },

    changeActiveState: async function(state, uuid, token, ip) {
        var user = await this.getUserFromToken(token, ip);
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
    },
    
    
    changePassword: async function(token, ip, oldPass, newPass) {
        var user = await this.getUserFromToken(token, ip);
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
    }, 

    checkTokenForValid: async function () {
        let data = await readLogins();
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            let user = data[keys[i]];
            for (let a = 0; a < user["token"].length; a++) {
                let token = user["token"][a];
                
            }
        }
    }
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
    return new Promise(function (resolve, reject) {
        fs.writeFile(loginFilePath, JSON.stringify(data, null, 4), function (err, data) {
            if (err)
                reject(err);
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