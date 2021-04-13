import {
    argv
} from "./yargs";
import {
    FileSettings,
    Updater
} from "./backend/updater";

const updater = new Updater("anappleforlife", "videoplayer", new Map < string, FileSettings > ()
    .set("data", FileSettings.DontOverride), argv.beta
)

updater.checkForUpdates()


import express from "express"
import * as fs from "fs";
const app = express();

if (!fs.existsSync(argv["Video Directory"])) {
    console.log("[ERROR] Please provide a valid video directory path.")
    process.exit(1)
}

const VideoNameExtensions = ["mp4", "webm"]

export {
    argv,
    app,
    VideoNameExtensions
}

import {
    db,
    backup,
    fileIndex
} from "./backend/database"

export {
    db,
    fileIndex
}

backupCacheRegular()

function backupCacheRegular() {
    backup()
    setTimeout(() => {
        backupCacheRegular();
    }, 1000 * 60 * 10);
}

import router from "./routes/index"
import {
    init
} from "./routes/ExpressUses";
import * as fileStuff from "./backend/fileStuff";
import * as loginBackend from "./backend/UserMangement";

init()

app.use("/", router)

app.listen(3000, () => {
    console.log("[INFO] Listening on http://%s:%d/", "localhost", 3000)
})

function checkCookies() {
    loginBackend.checkTokenForValid();
    setTimeout(() => {
        checkCookies()
    }, (1000 * 60));
}

checkCookies();

if (!argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, false);