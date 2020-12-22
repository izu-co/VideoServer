import { BasicAnswer, readLogins, writeLogins } from "../util";
import { getUserFromToken } from "../UserMangement";

async function changePassword (token:string, ip:string, oldPass:string, newPass:string): Promise<BasicAnswer> {
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

export { changePassword }