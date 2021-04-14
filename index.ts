import {
    argv
} from "./yargs";
import {
    FileSettings,
    Updater
} from "./backend/updater";

import http from "http"
import https from "https"

const updater = new Updater("anappleforlife", "videoplayer", new Map < string, FileSettings > ()
    .set("data", FileSettings.DontOverride), argv.beta
)

updater.checkForUpdates()


import express from "express"
import * as fs from "fs";
import path from "path"

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

const httpRouter = express();

httpRouter.get('*', (req, res, next) => {
    const hostSplit = req.headers.host.split(":")
    res.redirect('https://' + hostSplit[0] + ":3001" + req.url);
})

let options;

if (fs.existsSync(path.join(__dirname, "SSL", "key.pem")) && fs.existsSync(path.join(__dirname, "SSL", "server.crt"))) {
    options = {
        key: fs.readFileSync(path.join(__dirname, "SSL", "key.pem"), "utf-8").toString(),
        cert: fs.readFileSync(path.join(__dirname, "SSL", "server.crt"), "utf8").toString()
    }
}

const httpsEnabled: boolean = options;

if (httpsEnabled) {
    const httpsServer = options ? https.createServer(options, app) : https.createServer(app)
    const httpServer = http.createServer(httpRouter)
    
    httpServer.listen(3000, () => {
        console.log("[INFO] Http-Routing enabled (Port 3000)")
    })
    
    httpsServer.listen(3001, () => {
        console.log("[INFO] Listening on http://%s:%d/", "localhost", 3001)
    })
} else {
    const httpServer = http.createServer(app);
    
    httpServer.listen(3000, () => {
        console.log("[INFO] Listening on http://%s:%d/", "localhost", 3000)
    })
}

export {
    httpsEnabled
}

function checkCookies() {
    loginBackend.checkTokenForValid();
    setTimeout(() => {
        checkCookies()
    }, (1000 * 60));
}

checkCookies();

if (!argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, false);