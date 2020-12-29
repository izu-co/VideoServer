import { BasicAnswer } from "../util";
import { getUserFromToken } from "../UserMangement";
import { db } from "../..";

function deleteToken (uuid: string, token:string, ip:string) : BasicAnswer{
    let AuthoriseUser = getUserFromToken(token, ip);
    if (AuthoriseUser["status"] && AuthoriseUser["data"]["perm"] === "Admin") {
        db.prepare("DELETE FROM tokens WHERE UUID=?").run(uuid)
        return {"status": true}
    } else {
        return {"status": false, "reason": "Permission denied!"}
    }
}

export {deleteToken}