import { readLogins, writeLogins, User } from "../util";

async function checkTokenForValid() {
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

export { checkTokenForValid }
