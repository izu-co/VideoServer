import { checkPath } from "../util";
import * as loginBackend from "../UserMangement"
import { db } from "../..";

function saveTime (path:string, token:string, percent:number, ip:string) : boolean {
    let pathCeck = checkPath(path)
    if (!pathCeck.status)
        return false
    path = pathCeck.data
    let answer = loginBackend.getUserFromToken(token, ip);
    if (!answer.status)
        return false;
    let old = db.prepare("SELECT * FROM status WHERE UUID=? AND path=?").get(answer.data.uuid, path)

    if (old === undefined) {
        db.prepare("INSERT INTO status VALUES (?, ?, ?)").run(answer.data.uuid, path, percent)
        return true;
    } else {
        db.prepare("UPDATE status SET data=? WHERE UUID=? AND path=?").run(percent, answer.data.uuid, path)
        return true;
    }   
}

export {saveTime}