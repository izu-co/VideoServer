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
    }, 1000 * 5);
}

import router from "./routes/index"
import { init } from "./routes/ExpressUses";
import * as fileStuff from "./backend/fileStuff";
import * as loginBackend from "./backend/UserMangement";

init()

app.use("/", router)


app.listen(3000, "0.0.0.0", function() {
    console.log('[INFO] App listening at http://%s:%s', "localhost", "3000");
})


async function checkCookies() {
    await loginBackend.checkTokenForValid();
    setTimeout(() => { checkCookies() }, (1000 * 60));
}

checkCookies();

if (!argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, 5, 3, argv.debug);