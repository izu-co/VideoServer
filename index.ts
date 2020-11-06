import { Updater } from "./backend/updater";

const updater = new Updater("anappleforlife", "videoplayer")

updater.checkForUpdates()

import { argv, filePaths } from "./yargs";

import express from "express"
import * as fs from "fs";
const app = express();

if (!fs.existsSync(argv["Video Directory"])) {
    console.log("[ERROR] Please provide a valid video directory path.")
    process.exit(1)
}

let VideoNameExtensions = ["mp4"]

import { readCache, saveCache } from "./backend/cache"

const startCache = readCache(filePaths)

export {argv, app, VideoNameExtensions, startCache as cache}

saveCacheRegular()
function saveCacheRegular() {
    saveCache(startCache, filePaths)
    setTimeout(() => {
        saveCacheRegular()
    }, 1000 * 10);
}

import router from "./routes/index"
import { init } from "./routes/ExpressUses";
import * as fileStuff from "./backend/fileStuff";
import * as loginBackend from "./backend/UserMangement";

init()

app.use("/", router)

app.listen(3000, () => {
    console.log("[INFO] Listening on http://%s:%d/", "localhost", 3000)
})

async function checkCookies() {
    await loginBackend.checkTokenForValid();
    setTimeout(() => { checkCookies() }, (1000 * 60));
}

checkCookies();

if (!argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, false);

function exit() {
    saveCache(startCache, filePaths)
    process.exit(0)
}

process.on('SIGINT', exit)
process.on('exit', exit)
process.on('SIGTERM', exit)
process.on('SIGHUP', () => exit)
process.on('SIGBREAK', () => exit)