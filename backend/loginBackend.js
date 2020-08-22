const fs = require("fs")
const index = require("../index")
const path = require("path")

module.exports = {
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