import { BasicAnswer } from "../util";
import { getUserFromToken } from "../UserMangement";
import { db } from "../..";

async function changePassword (token:string, ip:string, oldPass:string, newPass:string): Promise<BasicAnswer> {
    var user = await getUserFromToken(token, ip);
    if (!user["status"])
        return user;
    
    if (user["data"]["password"] === oldPass) {
        db.prepare("UPDATE users SET password=? WHERE UUID=?").run(newPass, user.data.uuid)
        return {"status": true};
    } else {
        return {"status" : false, "reason": "The old password is wrong!"}
    }
}

export { changePassword }