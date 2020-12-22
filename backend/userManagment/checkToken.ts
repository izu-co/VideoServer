import { SecretUser } from "../util";
import { getUserFromToken } from "../UserMangement";

async function checkToken (token:string, ip:string): Promise<SecretUser> {
    var user = await getUserFromToken(token, ip);
    if (user["status"] === true) {
        delete user["data"]["password"];
        delete user["data"]["token"];
    } 
    return user;
}

export { checkToken }