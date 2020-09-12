var child_process = require("child_process")
import * as fs from "fs"
import * as Path from "path"
import * as index from "../index"
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
    }
}

export function createImages(path:string, override:boolean, maxRamInt:number, minRamInt:number, writeOutput:boolean): Status {
    console.log("Startet creating of Images!")
       
    var proc = child_process.spawn("java", ["-Xmx" + maxRamInt + "G", "-Xms" + minRamInt + "G", "-jar", "./java/images.jar",  path, override])

    proc.stdout.on('data', (data: string | string[]) => {
        if (writeOutput || !data.includes("skiped"))
            console.log(data.toString())
    });
          
    proc.stderr.on('data', (data) => {
        if (writeOutput || !data.includes("skiped"))
            console.log(data.toString())
    });
          
    proc.on('close', (code) => {
        console.log(`Image Creation done with code ${code}`);
    });
    return {"status" : true}
}

export async function getFiles(path:string, token:string, ip:string): Promise<Array<FileData>> {
    var retarr = [];
    if (!path.startsWith(index.argv["Video Directory"]))
        path = Path.join(index.argv["Video Directory"], path);
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
    if (!path.startsWith(index.argv["Video Directory"]))
        path = index.argv["Video Directory"] + path
    const answer = await loginBackend.getUserFromToken(token, ip)
    var data = getData()
    if (!answer["status"])
        return -1
    let user = answer["user"]
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
    
export async function saveTime (path:string, token:string, percent:string, ip:string) : Promise<boolean> {
    if (!path.startsWith(index.argv["Video Directory"]))
        path = index.argv["Video Directory"] + path;
    return loginBackend.getUserFromToken(token, ip).then(answer => {
        if (!answer["status"])
            return false;
        let user = answer["user"]
        let data = getData();
        if (!data.hasOwnProperty(user["username"])) 
            data[user["username"]] = {};
        data[user["username"]][path] = percent
        saveData(data)
        return true;
    })
}

export async function getFileData (path:string) : Promise<SkipData|{"status":true|false, "reason"?:string}> {
    if (!path.startsWith(index.argv["Video Directory"]))
        path = Path.join(index.argv["Video Directory"], path);
    if (!fs.existsSync(path))
        return {"status": false, "reason": "The given path does not exist"}
    var ret = {}

    var skips = loadSkips();
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
        var newNumber = number+1;
        if (number < 10)
        numberString = "0" + number
        if (newNumber < 10)
        newNumberString = "0" + newNumber;
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
        let user = answer["user"]
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

export async function saveUserData (token:string, ip:string, data:string) : Promise<Status>{
    return await loginBackend.getUserFromToken(token, ip).then(user => {
        var settings = loadSettings();
    
        settings[user["user"]["username"]] = data;
    
        saveSettings(settings);
        return {"status" : true}
    })
}

function loadSettings() {
    try {
        return JSON.parse(fs.readFileSync(Path.join(index.argv["Working Directory"], "data", "settings.json")).toString())
    } catch (err) {
        if (index.argv.debug) {
            return {}
        } else 
            throw err;
    }
}

function saveSettings(settings) {
    fs.writeFileSync(Path.join(index.argv["Working Directory"], "data", "settings.json"), JSON.stringify(settings, null, 4))
}

function getData() {
    try {
        return fs.readFileSync(index.argv["Working Directory"] + "/data/status.json").toJSON();
    } catch (err) {
        if (index.argv.debug) {
            return {}
        } else 
            throw err;
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(index.argv["Working Directory"] + "/data/status.json", JSON.stringify(data, null, 4))
    } catch (err) {
        if (index.argv.debug) {
            return {}
        } else 
            throw err;
    }
}
function loadSkips() {
    try {
        return JSON.parse(fs.readFileSync(index.argv["Working Directory"] + "/data/intros.json").toString());
    } catch (err) {
        if (index.argv.debug) {
            return {}
        } else 
            throw err;
    }
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

async function readFile(path) {
    return new Promise<String>(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err)
                reject(err);
            else
                resolve(JSON.parse(data));
        });
    });
}

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}