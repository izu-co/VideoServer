import { BasicAnswer, readLogins, uuidv4, writeLogins } from "../util";

const PermissionLevel = ["User", "Admin"];

async function addNewUser (username:string, password:string, perm:"Admin"|"User") : Promise<BasicAnswer> {
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

export { addNewUser }