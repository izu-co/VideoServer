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
            break
        case SortTypes.WatchList:
            searchType = SortTypes.WatchList
            break
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
        if (!fs.existsSync(path + ".jpg"))
            return;        
        let name = path.substring(path.lastIndexOf(Path.sep))
        let push = {
            "name" : name,
            "Path" : path.replace(index.argv["Video Directory"], ""),
            "type" : fs.lstatSync(path).isDirectory() ? "folder" : "video",
            "image" : (path + ".jpg").replace(index.argv["Video Directory"], ""),
            "watchList": true
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
    index.fileIndex.prepare("SELECT * FROM files").all().filter(a => {
        return new RegExp(escapeRegExp(path + Path.sep) + "[^" + escapeRegExp(Path.sep) + "]*(" + escapeRegExp(Path.sep) + "|(webm|mp4))$").test(a["isDir"] ? a["path"] + Path.sep : a["path"])
    }).forEach(file => { 
        let name:string = file["path"].split(Path.sep)[file["path"].split(Path.sep).length - 1];
        if (!file["isDir"])
            name = name.substring(0, name.lastIndexOf("."))
        var push = {
            "name" : name,
            "Path" : file["path"].replace(index.argv["Video Directory"], ""),
            "type" : file["isDir"] ? "folder" : "video",
            "image" : (file["path"] + ".jpg").replace(index.argv["Video Directory"], ""),
            "watchList": IsOnWatchList(Users.data, file["path"].replace(index.argv["Video Directory"], ""))  
        }
        if (push["type"] === "video") 
            push["timeStemp"] = loadTime(file["path"], token, ip, Users)          
        retarr.push(push);
            
    })
    return retarr;
}

function getFileFromCreated(path:string, token:string, ip:string) {
    let Users = getUserFromToken(token, ip);

    if (!Users.status) return []
    var retarr = [];
    let files = index.fileIndex.prepare("SELECT * FROM files").all()
    files = files.filter(a => !a["isDir"])
    files = files.sort((a, b) => b["created"] - a["created"])
    if (files.length > 50)
        files = files.slice(0, 50)
    files.forEach(file => { 
        let name:string = file["path"].split(Path.sep)[file["path"].split(Path.sep).length - 1];
        if (!file["isDir"])
            name = name.substring(0, name.lastIndexOf("."))
        var push = {
            "name" : name,
            "Path" : file["path"].replace(index.argv["Video Directory"], ""),
            "type" : "video",
            "image" : (file["path"] + ".jpg").replace(index.argv["Video Directory"], ""),
            "watchList": IsOnWatchList(Users.data, file["path"].replace(index.argv["Video Directory"], "")),
            "timeStemp": loadTime(path + Path.sep + file, token, ip, Users) 
        }
        retarr.push(push);
            
    })
    
    return retarr;
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

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

export {getFiles}