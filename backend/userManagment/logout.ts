import { BasicAnswer } from "../util";
import { getUserFromToken } from "../UserMangement";
import { db } from "../..";

async function logout(tokenToLogout:string, ip:string): Promise<BasicAnswer> {
    db.prepare("DELETE FROM tokens WHERE token=?").run(tokenToLogout);
    return {
        status: true
    }
}

export { logout }