import {cacheInterface, filePathsInterface, IntroSkipInterface, LoginInterface, SettingsInterface, StatusInterface} from "../interfaces"
import * as fs from "fs"

function readCache(paths:filePathsInterface):cacheInterface {
    const startCache:cacheInterface = {
        "introSkipPositions": <IntroSkipInterface> readFile(paths.introSkips.path),
        "logins": <LoginInterface> readFile(paths.logins.path),
        "settings": <SettingsInterface> readFile(paths.settings.path),
        "status": <StatusInterface> readFile(paths.status.path)
    }
    return startCache;
}

function saveCache(cache:cacheInterface, paths: filePathsInterface):void {
    saveFile(paths.introSkips.path, cache.introSkipPositions)
    saveFile(paths.logins.path, cache.logins)
    saveFile(paths.settings.path, cache.settings)
    saveFile(paths.status.path, cache.status)
}

function saveFile(path:fs.PathLike, data:object) {
    fs.writeFileSync(path, JSON.stringify(data, null, 3))
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

export {readCache, saveCache}