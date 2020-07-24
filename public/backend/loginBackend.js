const fs = require("fs")
const index = require("../../index")
const path = require("path")

module.exports = {
    maketoken: function (length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.-:_!%&/()}][{';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },

    getUsers : function(token, ip) {
        var user = this.checkTokenReturnEveryThing(token, ip);
        if (user["user"]["perm"] === "Admin") {
            return {"status" : true, "users" : loadData()}
        } else {
            return {"status" : false, "reason" : "Not found"}
        }

    },

    /**
     * 
     * @param {string} username 
     * @param {string} password 
     * @param {string} ip 
     */
    getToken: function (username, password, ip) {
        var data = loadData();
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item.username === username && item.password === password) {
                if (!item["active"])
                    return {"status" : false, "reason" : "Der account ist deaktiviert!"}
                var rohtoken = this.maketoken(20);
                var token = {
                    "when" : Date.now(),
                    "to" : new Date(Date.now() + (1000 * 60 * 60 * 24)).getTime(),
                    "token" : rohtoken,
                    "ip" : ip
                }
                var tokens = data[i]["token"];
                tokens.push(token)
                data[i]["token"] = tokens;

                saveData(data);

                return {"status" : true, "token" : rohtoken};
            }
        }
        return {"status" : false, "reason" : "Der Benutzername oder das Passwort ist falsch"};
        
    },

    /**
     * 
     * @param {string} token 
     * @param {string} ip 
     */
    checkToken: function (token, ip) {
        var data = loadData();
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item.token !== null) {
                var tokens = item["token"];
                for (let i = 0; i < tokens.length; i++) {
                    var tokenItem = tokens[i];  
                    if (tokenItem["token"] === token && tokenItem["ip"] === ip && item["active"]) {                  
                        delete item["password"];
                        delete item["token"];
                        return { "status" : true, "userdata" : item };
                    }
                }
            }
        }
        return { "status" : false, "reason" : "Not found"};
    },

    checkTokenReturnEveryThing: function(token, ip) {
        var data = loadData();
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item.token !== null) {
                var tokens = item["token"];
                for (let a = 0; a < tokens.length; a++) {
                    var tokenItem = tokens[a];  
                    if (tokenItem["token"] === token && tokenItem["ip"] === ip && item["active"]) {
                        return {
                            "user" : item,
                            "index" : i
                        }
                    }
                }
            }
        }
        return null
    },

    /**
     * @param {String} username 
     */
    getUserFromNameReturnEverything: function(username) {
        var data = loadData();
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item["username"] === username)
                return {
                    "user" : item,
                    "index" : i
                }
        }
        return null
    },

    checkTokenForValid: function () {
        var data = loadData();
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item.token !== null) {
                var tokens = item["token"];
                for (let a = 0; a < tokens.length; a++) {
                    var tokenItem = tokens[a];  
                    if (Date.now() > new Date(tokenItem.to))
                        tokens.splice(a, 1);
                }
                item["token"] = tokens;
            }
            data[i] = item;
        }
        saveData(data);
    },

    changePassword: function(token, ip, oldPass, newPass) {
        var data = loadData()
        var user = this.checkTokenReturnEveryThing(token, ip)
        if (user === null)
            return {"status" : false, "reason" : "User not found!"}
        if (oldPass === user["user"]["password"]) {
            user["user"]["password"] = newPass;
            data[user["index"]] = user["user"];
            saveData(data)
            return {"status": true}
        } else {
            return {"status" : false, "reason" : "Old Password not right!"}
        }
    },

    /**
     * @param {Boolean} state 
     * @param {String} username 
     */
    changeActiveState: function(state, username) {
        var user = this.getUserFromNameReturnEverything(username)
        if (user === null)
            return {"status" : false, "reason" : "User not found!"}
        
        var data = loadData();
        user["user"]["active"] = state;
        data[user["index"]] = user["user"];
        saveData(data)
        return {"status" : true}
    },

    deleteToken: function(username) {
        var user = this.getUserFromNameReturnEverything(username)
        if (user === null)
            return {"status" : false, "reason" : "User not found!"}
        
        var data = loadData();
        user["user"]["token"] = []
        data[user["index"]] = user["user"];
        saveData(data)
        return {"status" : true}
    }
}

function saveData(data) {
    var set = {
        "logins" : data
    } 
    fs.writeFileSync(path.join(index.path, "data" , "logins.json"), JSON.stringify(set, null, 4))
}

function loadData() {
    return JSON.parse(fs.readFileSync(index.path + "/data/logins.json"))["logins"];
}