import { BasicAnswer } from "../util";
import { getUserFromToken } from "../UserMangement";
import { db } from "../..";

function logout(tokenToLogout:string, ip:string): BasicAnswer {
    db.prepare("DELETE FROM tokens WHERE token=?").run(tokenToLogout);
    return {
        status: true
    }
}

export { logout }