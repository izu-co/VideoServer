import { BasicAnswer, writeLogins, readLogins } from "../util";
import { getUserFromToken } from "../UserMangement";

async function deleteToken (uuid:string, token:string, ip:string) : Promise<BasicAnswer>{
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

export {deleteToken}