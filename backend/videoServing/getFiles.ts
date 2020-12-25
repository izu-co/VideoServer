import {FileData, checkPath, readdir, SortTypes} from "../util"
import * as index from "../../index"
import * as fs from "fs"
import * as Path from "path"
import { loadTime, IsOnWatchList } from "../fileStuff";
import { getUserFromToken } from "../UserMangement";

function getFiles(path:string, token:string, ip:string, type:string = null): Array<FileData> {
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
        case SortTypes.WatchList:
            searchType = SortTypes.WatchList
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
        case SortTypes.WatchList:
            return getFilesFromWatchList(token, ip);
    }
}

function getFilesFromWatchList(token:string, ip:string) {
    let Users = getUserFromToken(token, ip);

    if (!Users.status) return []

    let answers = index.db.prepare("SELECT * FROM watchlist WHERE UUID=?").all(Users.data.uuid)

    let retarr = []

    answers.map(a => a["path"]).forEach(file => {
        let pathCheck = checkPath(file);
        if (!pathCheck.status) return;

        let path = <string> pathCheck.data

        if (!fs.existsSync(path)) return;

        if (fs.lstatSync(path).isFile())
            if (!index.VideoNameExtensions.includes(path.split(".")[path.split(".").length - 1]))
                return;
        if (fs.lstatSync(path).isDirectory())
            if (!fs.existsSync(path + ".jpg"))
                return;        
        var split = path.split(".");
        var name = index.VideoNameExtensions.includes(split[split.length - 1]) ? name = file.substring(0, file.length - (split[split.length - 1].length + 1)).replace(" [1080p]", "") : file;
        var push = {
            "name" : name,
            "Path" : path.replace(index.argv["Video Directory"], ""),
            "type" : fs.lstatSync(path).isDirectory() ? "folder" : "video",
            "image" : fs.lstatSync(path).isDirectory() ? path.replace(index.argv["Video Directory"], "") + ".jpg" : path.replace(index.argv["Video Directory"], "").replace(split[split.length - 1], "jpg"),
            "watchList": IsOnWatchList(Users.data, file.replace(index.argv["Video Directory"], ""))  
        }
        if (push["type"] === "video") 
            push["timeStemp"] = loadTime(path, token, ip, Users)          
        retarr.push(push);        
    })

    return retarr
}

function getFileFromFolder(path:string, token:string, ip:string) {
    var retarr = [];

    let Users = getUserFromToken(token, ip);

    readdir(path).forEach(file => { 
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
            "image" : fs.lstatSync(path + Path.sep + file).isDirectory() ? Path.join(path.replace(index.argv["Video Directory"], ""), file + ".jpg") : Path.join(path.replace(index.argv["Video Directory"], ""), file.replace(split[split.length - 1], "jpg")),
            "watchList": IsOnWatchList(Users.data, file.replace(index.argv["Video Directory"], ""))  
        }
        if (push["type"] === "video") 
            push["timeStemp"] = loadTime(path + Path.sep + file, token, ip, Users)          
        retarr.push(push);
            
    })

    return retarr;
}

function getFileFromCreated(path:string, token:string, ip:string) {
    let Users = getUserFromToken(token, ip);

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
            "timeStemp": loadTime(file, token, ip, Users),
            "watchList": IsOnWatchList(Users.data, file.replace(index.argv["Video Directory"], ""))  
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