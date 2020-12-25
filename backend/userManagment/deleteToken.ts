import { BasicAnswer } from "../util";
import { getUserFromToken } from "../UserMangement";
import { db } from "../..";

async function deleteToken (uuid: string, token:string, ip:string) : Promise<BasicAnswer>{
    let AuthoriseUser = await getUserFromToken(token, ip);
    if (AuthoriseUser["status"] && AuthoriseUser["data"]["perm"] === "Admin") {


        db.prepare("DELETE FROM tokens WHERE UUID=?").run(uuid)
        return {"status": false, "reason": "User not Found!"}
    } else {
        return {"status": false, "reason": "Permission denied!"}
    }
}

export {deleteToken}