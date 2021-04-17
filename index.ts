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
import path from "path"

if (!fs.existsSync("temp"))
    fs.mkdirSync("temp")

//TODO Clear temp

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
import {
    Server
} from "socket.io";
import http from "http"
import https from "https"

let options;

if (fs.existsSync(path.join(__dirname, "SSL", "server.key")) && fs.existsSync(path.join(__dirname, "SSL", "server.crt"))) {
    options = {
        key: fs.readFileSync(path.join(__dirname, "SSL", "server.key"), "utf-8").toString(),
        cert: fs.readFileSync(path.join(__dirname, "SSL", "server.crt"), "utf8").toString(),
    }
}

const httpsEnabled: boolean = options;
let httpsServer: https.Server | undefined;
let httpServer = http.createServer(app)

if (httpsEnabled) {
    app.use((req, res, next) => {
        if (!req.secure) {
            return res.redirect('https://' + req.headers.host + req.url);
        }
        next();
    })
    httpsServer = options ? https.createServer(options, app) : https.createServer(app)
}

const socketIO = httpsEnabled ? new Server(httpsServer, {}) : new Server(httpServer, {})

export {
    socketIO
}

init()
app.use("/", router)


httpServer.listen(80, () => {
    console.log("[INFO] Listening on http://localhost/")
})

httpsServer.listen(443, () => {
    console.log("[INFO] Listening on https://localhost/")
})

export {
    httpsEnabled, httpServer, httpsServer
}

function checkCookies() {
    loginBackend.checkTokenForValid();
    setTimeout(() => {
        checkCookies()
    }, (1000 * 60));
}

checkCookies();

if (!argv.shutup)
    console.log("[INFO] If you like the programm, please star the github repo :)")

if (!argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, false);