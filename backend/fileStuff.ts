var child_process = require("child_process")
import * as fs from "fs"
import * as Path from "path"
import * as index from "../index"
import { IntroSkipInterface, SettingsDataInterface, SettingsInterface, StatusInterface } from "../interfaces"
import * as loginBackend from "./UserMangement"

export interface Status {
    "status": true|false
}

export interface FileData {
    "name": string,
    "Path": string,
    "type": "video"|"folder",
    "image": string,
    "timeStemp"?: number|Promise<number>
}

export interface SkipData {
    "startTime": number,
    "stopTime": number,
    "next"?: string
}


export interface UserDataAnswer {
    "status": true|false,
    "data"?: {
        "volume"?: string
    } | object
}

export function createImages(path:string, override:boolean, writeOutput:boolean): Status {
    console.log("[INFO][ImageCreation] Startet creating of Images!")
       
    var proc = child_process.spawn("java", ["-jar", "./java/ThumbnailGenerator-1.0.jar",  path, override])

    proc.stdout.on('data', (data: string | string[]) => {
        if (writeOutput && (data.toString().trim().length !== 0))
            console.log("[INFO][ImageCreation] " + data.toString().replace("\n", ""))
    });
          
    proc.stderr.on('data', (data: string | string[]) => {
        if (writeOutput && (data.toString().trim().length !== 0))
            console.log("[INFO][ImageCreation] " + data.toString().replace("\n", ""))
    });
          
    proc.on('close', (code: any) => {
        console.log(`[INFO][ImageCreation] Image Creation done with code ${code}`);
    });
    return {"status" : true}
}

export async function getFiles(path:string, token:string, ip:string): Promise<Array<FileData>> {
    var retarr = [];
    let pathCheck = checkPath(path)
    if (!pathCheck.status)
        return retarr
    path = pathCheck.data
    if(!fs.existsSync(path)) return []
    return await readdir(path).then(data => data.forEach(async file => { 
        if (fs.lstatSync(path + Path.sep + file).isFile())
            if (!index.VideoNameExtensions.includes(file.split(".")[file.split(".").length - 1]))
                return;
            
        if (fs.lstatSync(path + Path.sep + file).isDirectory())
            if (!fs.existsSync(path + Path.sep + file + ".jpg"))
                return;
        var split = file.split(".");
        var name = index.VideoNameExtensions.includes(split[split.length - 1]) ? name = file.substring(0, file.length - (split[split.length - 1].length + 1)).replace(" [1080p]", "") : file;
        var push = {
            "name" : name,
            "Path" : Path.join(path.replace(index.argv["Video Directory"], ""), file),
            "type" : fs.lstatSync(path + Path.sep + file).isDirectory() ? "folder" : "video",
            "image" : fs.lstatSync(path + Path.sep + file).isDirectory() ? Path.join(path.replace(index.argv["Video Directory"], ""), file + ".jpg") : Path.join(path.replace(index.argv["Video Directory"], ""), file.replace(split[split.length - 1], "jpg"))
        }
        if (push["type"] === "video") 
            push["timeStemp"] = loadTime(path + Path.sep + file, token, ip)          
        retarr.push(push);
            
    })).then(() => {
        let promisses = []
        for(let i = 0; i < retarr.length; i++) 
            promisses.push(retarr[i]["timeStemp"])
        return Promise.all(promisses).then((data) => {
            for(let i = 0; i<data.length; i++)
                retarr[i]["timeStemp"] = data[i]
            return retarr
        })
    })
}

export async function loadTime(path:string, token:string, ip:string) : Promise<number> {
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
    
export async function saveTime (path:string, token:string, percent:number, ip:string) : Promise<boolean> {
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

export async function getFileData (path:string) : Promise<SkipData|{"status":true|false, "reason"?:string}> {
    let pathCeck = checkPath(path)
    if (!pathCeck.status)
        return pathCeck
    path = pathCeck.data
    if (!fs.existsSync(path))
        return {"status": false, "reason": "The given path does not exist"}
    var ret = {}

    var skips = loadSkips()
    if (skips.hasOwnProperty(path))
        ret["skip"] = skips[path]
    else 
        ret["skip"] = {
            "startTime" : -1,
            "stopTime" : -1
        }

    var split = path.split("\\");
    var string = split[split.length - 1].substring((split[split.length - 1].indexOf("-") + 2));
    var number = -1
    if (string.substring(0, 3).match("^[0-9]+$"))
        number = parseInt(string.substring(0, 3), 10)
    if (string.substring(0, 2).match("^[0-9]+$"))
        number = parseInt(string.substring(0, 2), 10)
    let numberString;
    let newNumberString;
    if (number !== -1) {
        let newNumber = number+1;
        numberString = number < 10 ? "0" + number : number
        newNumberString = newNumber < 10 ? "0" + newNumber : newNumber
        split[split.length - 1] = split[split.length - 1].replace(numberString, newNumberString)
        if (fs.existsSync(split.join("\\")))
            ret["next"] = split.join("\\").replace(index.argv["Video Directory"], "")
    }
    if (!isEmptyObject(ret))
        return <SkipData> ret;
    else 
        return null;
}

export async function getUserData (token:string, ip:string): Promise<UserDataAnswer> {
    return await loginBackend.getUserFromToken(token, ip).then(answer => {
        if (!answer["status"])
            return answer;
        let user = answer["data"]
        var settings = loadSettings()
        var ret = {};
    
        if (user !== null && settings.hasOwnProperty(user["username"])) {
            ret["volume"] = settings[user["username"]]["volume"]
        } else {
            ret["volume"] = settings["default"]["volume"];
        }
    
        return {"status" : true, "data" : ret};
    })
}

export async function saveUserData (token:string, ip:string, data:SettingsDataInterface) : Promise<Status>{
    return await loginBackend.getUserFromToken(token, ip).then(user => {
        var settings = loadSettings();
    
        settings[user["data"]["username"]] = data;
    
        saveSettings(settings);
        return {"status" : true}
    })
}

function loadSettings(): SettingsInterface {
    return index.cache.settings
}

function saveSettings(settings:SettingsInterface) {
    index.cache.settings = settings
}

function getData(): StatusInterface {
    return index.cache.status
}

function saveData(data:StatusInterface) {
    index.cache.status = data
}
function loadSkips(): IntroSkipInterface {
    return index.cache.introSkips;
}

async function readdir(path:string) {
    return new Promise<string[]>(function (resolve, reject) {
        fs.readdir(path, 'utf8', function (err, data) {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}

function isEmptyObject(obj:object) {
    return !Object.keys(obj).length;
}

function checkPath(path:string): loginBackend.BasicAnswer {
    if (!path.startsWith(index.argv["Video Directory"]))
        path = Path.join(index.argv["Video Directory"], path)
    if (!Path.resolve(path).startsWith(Path.resolve(index.argv["Video Directory"])))
        return {
            status: false,
            reason: "The path provided is invalid"
        }
    return {
        "status": true,
        "data": path
    }
}