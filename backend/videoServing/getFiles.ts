import {FileData, checkPath, readdir} from "../util"
import * as index from "../../index"
import * as fs from "fs"
import * as Path from "path"
import { loadTime } from "./loadTime";

async function getFiles(path:string, token:string, ip:string): Promise<Array<FileData>> {
    var retarr = [];
    let pathCheck = checkPath(path)
    if (!pathCheck.status)
        return retarr
    path = pathCheck.data
    if(!fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) return []
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

export {getFiles}