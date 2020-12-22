import { checkPath, getData } from "../util";
import * as loginBackend from "../UserMangement"

async function loadTime(path:string, token:string, ip:string) : Promise<number> {
    let pathCeck = checkPath(path)
    if (!pathCeck.status)
        return 0
    path = pathCeck.data
    const answer = await loginBackend.getUserFromToken(token, ip)
    var data = getData()
    if (!answer["status"])
        return -1
    let user = answer["data"]
    if (data.hasOwnProperty(user["username"])) {
        if (data[user["username"]].hasOwnProperty(path)) {
            return data[user["username"]][path]
        } else {
            return 0
        }
    } else {
        return 0
    }
}

export {loadTime}