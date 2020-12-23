import { BasicAnswer, readLogins, writeLogins } from "../util";
import { getUserFromToken } from "../UserMangement";

async function changeActiveState (state:boolean, uuid:string, token:string, ip:string): Promise<BasicAnswer>{
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

export {changeActiveState}