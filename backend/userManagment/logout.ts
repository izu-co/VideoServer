import { BasicAnswer, readLogins, writeLogins } from "../util";
import { getUserFromToken } from "../UserMangement";

async function logout(tokenToLogout:string, ip:string): Promise<BasicAnswer> {
    let data = readLogins()
    let user = await getUserFromToken(tokenToLogout, ip)
    if (!user["status"])
        return <BasicAnswer> user;
    let tokens = user.data.token
    let found = false
    for (let a = 0; a < tokens.length; a++) {
        let token = tokens[a];
        if (token.token === tokenToLogout) {
            tokens.splice(a, 1);
            found = true;
        }
    }
    user["token"] = tokens;
    writeLogins(data)
    if (found)
        return {
            status: true
        }
    else
        return {
            status: false,
            reason: "Token not found"
        }
}

export { logout }