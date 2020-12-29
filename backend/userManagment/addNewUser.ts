import { BasicAnswer, uuidv4, } from "../util";
import { db } from "../../index";

const PermissionLevel = ["User", "Admin"];

function addNewUser(username:string, password:string, perm:"Admin"|"User") : BasicAnswer {

    let userWithName = db.prepare("SELECT * FROM users WHERE username=?").get(username)
    if (userWithName !== undefined)
            return { "status" : false, "reason" : "Der Username exestiert bereits!" }
    let uuid = uuidv4();
    while (db.prepare("SELECT * FROM users WHERE UUID=?").get(uuid) !== undefined) {
        uuid = uuidv4();
    }

    if (!PermissionLevel.includes(perm))
        return { "status" : false, "reason" : "Die Permission gibt es nicht!" }
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)").run(uuid, username, password, perm, "true")
    
    return {"status": true};
}

export { addNewUser }