import { BasicAnswer, readLogins } from "../util";
import { getUserFromToken } from "../UserMangement";

async function loadUsers (token:string, ip:string) : Promise<BasicAnswer> {
    let user = await getUserFromToken(token, ip);
    if (user["status"] === true) {
        if (user["data"]["perm"] === "Admin") {
            let users = readLogins();
            let retUsers = [];
            let keys = Object.keys(users);
            for (let i = 0; i < keys.length; i++) {
                let AddUser = Object.assign({}, users[keys[i]]);
                AddUser["uuid"] = keys[i];
                delete AddUser["token"];
                var passText = "";
                for (var a = 0; a < AddUser["password"].length; a++) {
                    passText += "*"
                }
                AddUser["password"] = passText;
                retUsers.push(AddUser);
            }
            return {"status" : true, "data" : retUsers} 
        } else {
            return {"status" : false, "reason" : "You are not permitted to do that!"}
        }
    } else {
        return user;
    }
}

export {loadUsers}