import { BasicAnswer } from "../util";
import { getUserFromToken } from "../UserMangement";
import { db } from "../..";

function loadUsers (token:string, ip:string) : BasicAnswer {
    let user = getUserFromToken(token, ip);
    if (user["status"] === true) {
        if (user["data"]["perm"] === "Admin") {
            let users = db.prepare("SELECT * from users").all()
            let retUsers = [];
            for (let i = 0; i < users.length; i++) {
                let AddUser = users[i]
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