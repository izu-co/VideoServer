import {FileData, checkPath, readdir, SortTypes} from "../util"
import * as index from "../../index"
import * as fs from "fs"
import * as Path from "path"
import { loadTime } from "./loadTime";
import { getUserFromToken } from "../UserMangement";

async function getFiles(path:string, token:string, ip:string, type:string = null): Promise<Array<FileData>> {
    let searchType:SortTypes;
    switch (type) {
        case null:
            searchType = SortTypes.File
            break
        case SortTypes.File:
            searchType = SortTypes.File
            break
        case SortTypes.Created:
            searchType = SortTypes.Created
    }
    if (searchType == null)
        return [];
    let pathCheck = checkPath(path)
    if (!pathCheck.status)
        return []
    path = pathCheck.data
    if(!fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) return []
    
    switch(searchType) {
        case SortTypes.File:
            return getFileFromFolder(path, token, ip);
        case SortTypes.Created:
            return getFileFromCreated(path, token, ip);
    }
}

async function getFileFromFolder(path:string, token:string, ip:string) {
    var retarr = [];

    let Users = await getUserFromToken(token, ip);

    return await readdir(path).then(data => data.forEach(file => { 
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
            push["timeStemp"] = loadTime(path + Path.sep + file, token, ip, Users)          
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

async function getFileFromCreated(path:string, token:string, ip:string) {
    let Users = await getUserFromToken(token, ip);

    if (!Users.status) return []

    var retarr = getFilesRecursively(path).filter(k => index.VideoNameExtensions.includes(k.substring(k.lastIndexOf(".") + 1)));

    retarr = retarr.sort((a, b) => fs.lstatSync(b).mtimeMs - fs.lstatSync(a).mtimeMs)

    retarr = retarr.slice(0, 50)

    return retarr.map(file => {
        var split = file.split(".");
        var name:string = file.substring(0, file.length - (split[split.length - 1].length + 1)).replace(" [1080p]", "");
        var push = <FileData> {
            "name" : name.substring(name.lastIndexOf(Path.sep) + 1),
            "Path" : file.replace(index.argv["Video Directory"], ""),
            "type" : "video",
            "image" : file.replace(index.argv["Video Directory"], "").substr(0, file.replace(index.argv["Video Directory"], "").lastIndexOf(".") + 1) + "jpg",
            "timeStemp":  loadTime(file, token, ip, Users)          
        }
        return push;
    })
}

const isDirectory = (path: string) => fs.statSync(path).isDirectory();
const getDirectories = (path: string) =>
    fs.readdirSync(path).map(name => Path.join(path, name)).filter(isDirectory);

const isFile = (path: string) => fs.statSync(path).isFile();  
const getAllFiles = (path: string) =>
    fs.readdirSync(path).map(name => Path.join(path, name)).filter(isFile);

const getFilesRecursively = (path: string) : Array<string> => {
    let dirs = getDirectories(path);
    let files = dirs
        .map(dir => getFilesRecursively(dir)) // go through each directory
        .reduce((a,b) => a.concat(b), []);    // map returns a 2d array (array of file arrays) so flatten
    return files.concat(getAllFiles(path));
};

export {getFiles}