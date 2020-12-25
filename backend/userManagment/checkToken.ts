import { SecretUser } from "../util";
import { getUserFromToken } from "../UserMangement";

function checkToken (token:string, ip:string): SecretUser {
    var user = getUserFromToken(token, ip);
    if (user["status"] === true) {
        delete user["data"]["password"];
        delete user["data"]["token"];
    } 
    return user;
}

export { checkToken }