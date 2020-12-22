import { readLogins, UserRequestAnswer, User } from "../util";

async function getUserFromToken (token:string, ip:string): Promise<UserRequestAnswer> {
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

export {getUserFromToken}