import { sep } from "path"
import { db } from "../.."
import { getUserFromToken } from "../UserMangement"
import { BasicAnswer, checkPath, User } from "../util"


function setStars(token: string, ip:string, path:string, stars:number) : BasicAnswer {

    let user = getUserFromToken(token, ip)

    if (!user.status) return user

    if (stars < 0 || stars > 5 || !Number.isInteger(stars))
        return { status: false, reason: 'The stars has to be an integer between 0 and 5' }

    const checkedPath = checkPath(path);

    if (!checkedPath.status)
        return checkedPath;

    path = checkedPath.data;

    const request = db.prepare("SELECT * FROM stars WHERE path=? AND UUID=?").get(path, user.data.uuid);

    if (request === undefined) {
        db.prepare("INSERT INTO stars VALUES (?, ?, ?)").run(user.data.uuid, path, stars)
        return {
            status: true,
            data: stars
        }
    } else {
        db.prepare("UPDATE stars SET stars=? WHERE path=? AND UUID=?").run(stars, path, user.data.uuid)
        return {
            status: true,
            data: db.prepare("SELECT * FROM stars WHERE path=? AND UUID=?").get(path, user.data.uuid)["stars"]
        }
    }

}

function getStars(token:string, ip:string, path:string) : BasicAnswer {
    let user = getUserFromToken(token ,ip)

    if (!user.status) return user

    const checkedPath = checkPath(path);

    if (!checkedPath.status)
        return checkedPath;

    path = checkedPath.data;

    const request = db.prepare("SELECT * FROM stars WHERE path=? AND UUID=?").get(path, user.data.uuid);
    
    return {
        status: true,
        data: request === undefined ? 0 : request["stars"]
    }
}

export { getStars, setStars }