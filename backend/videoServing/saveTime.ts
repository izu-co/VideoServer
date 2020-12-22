import { checkPath, getData, saveData } from "../util";
import * as loginBackend from "../UserMangement"

async function saveTime (path:string, token:string, percent:number, ip:string) : Promise<boolean> {
    let pathCeck = checkPath(path)
    if (!pathCeck.status)
        return false
    path = pathCeck.data
    return loginBackend.getUserFromToken(token, ip).then(answer => {
        if (!answer["status"])
            return false;
        let user = answer["data"]
        let data = getData();
        if (!data.hasOwnProperty(user["username"])) 
            data[user["username"]] = {};
        data[user["username"]][path] = percent
        saveData(data)
        return true;
    })
}

export {saveTime}