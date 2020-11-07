import {cacheInterface, filePathsInterface, IntroSkipInterface, LoginInterface, SettingsInterface, StatusInterface} from "../interfaces"
import * as fs from "fs"
import * as path from "path"

function readCache(paths:filePathsInterface):cacheInterface {
    const startCache:cacheInterface = {
        "introSkips": <IntroSkipInterface> (paths.introSkips.hasOwnProperty("backup") ? readFile(paths.introSkips.backup) : readFile(paths.introSkips.path)),
        "logins": <LoginInterface> (paths.logins.hasOwnProperty("backup") ? readFile(paths.logins.backup) : readFile(paths.logins.path)),
        "settings": <SettingsInterface> (paths.settings.hasOwnProperty("backup") ? readFile(paths.settings.backup) : readFile(paths.settings.path)),
        "status": <StatusInterface> (paths.status.hasOwnProperty("backup") ? readFile(paths.status.backup) : readFile(paths.status.path))
    }
    return startCache;
}

function saveCache(cache:cacheInterface, paths: filePathsInterface):void {
    saveFile(paths.introSkips.path, cache.introSkips)
    saveFile(paths.logins.path, cache.logins)
    saveFile(paths.settings.path, cache.settings)
    saveFile(paths.status.path, cache.status)
}

function saveFile(path:fs.PathLike, data:object) {
    fs.writeFileSync(path, JSON.stringify(data, null, 4))
}

function getBackupPath(filePath: string) : string {
    let pathArr = filePath.split(path.sep).reverse()[0].split(".")
    pathArr.splice(1, 0, "backup")
    return path.resolve(filePath, "..", pathArr.join("."))
}

function readFile(path:fs.PathLike):object {
    let ret:object

    try {
        ret = JSON.parse(fs.readFileSync(path).toString())
    } catch {
        ret = {}
    }

    return ret;
}

function backupCache(cache:cacheInterface, paths: filePathsInterface):void {
    for (let key in paths) {
        saveFile(getBackupPath(paths[key]["path"].toString()), cache[key]);
    }
}

export {readCache, saveCache, backupCache, getBackupPath}