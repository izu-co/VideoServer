import { app, argv, VideoNameExtensions, socketIO } from "../index";
import * as express from "express";
import * as path from "path";
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { GetUserGET, limiter } from "./Routes";
import fs from "fs"
import ffmpeg from "fluent-ffmpeg"
import { checkPath } from "../backend/util";

export function init() {
    app.use(express.json())
    app.use(cookieParser())
    app.use(json())
    app.use('/', limiter)
    app.locals.streams = {}
    app.locals.converting = []
    app.use("/favicon.ico", express.static(path.join(argv["Working Directory"], "icons", "favicon.ico")))
    app.use("/icon", express.static(path.join(argv["Working Directory"], "icons", "Icon.png")))
    app.use("/manifest", express.static(path.join(argv["Working Directory"], "pwa.webmanifest")))
    app.use("/icons", express.static(path.join(argv["Working Directory"], "icons")))
    app.use('/fonts', express.static(path.join(argv["Working Directory"], "fonts")))

    app.use('/', express.static(path.join(argv["Working Directory"], "html", "public")))
    app.use('/', GetUserGET, express.static(path.join(argv["Working Directory"], "html", "private")))
    app.use('/video', GetUserGET,  (req, res, next) => {
        if (!VideoNameExtensions.includes(req.url.split("\.").pop())) return next()
        if (app.locals.streams.hasOwnProperty(res.locals.user.username)) {
            app.locals.streams[res.locals.user.username]++;
        } else {
            app.locals.streams[res.locals.user.username] = 1;
        }

        req.on("close", () => {
            app.locals.streams[res.locals.user.username]--;
        })

        let urlPath = req.url.split("\.")
        let pathCheck = checkPath(req.path.replace('/video/', ''))
        if (!pathCheck.status) {
            res.status(400).end()
            return;
        }

        if (app.locals.converting.indexOf(decodeURIComponent(pathCheck.data)) > -1) 
            return res.end()

        if (urlPath.pop() === "mp4" && VideoNameExtensions.includes(urlPath.pop())) {
            
            let streamPath = decodeURIComponent(pathCheck.data.split("\.").reverse().slice(1).reverse().join("\."))

            if (fs.existsSync(decodeURIComponent(pathCheck.data)))
                return next()

            if (fs.existsSync("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())) {
                res.locals.tempVideo = path.resolve("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())
                return next()
            }

            ffmpeg()
                .input(streamPath)
                .outputOptions([ '-preset veryfast', '-vcodec libx264', '-threads 0', '-y'])
                .output("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())
                .on("end", () => {
                    res.locals.tempVideo = path.resolve("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())
                    let index = app.locals.converting.indexOf(decodeURIComponent(pathCheck.data))
                    if (index > -1) {
                        app.locals.converting.splice(index, 1);
                    }
                    return next()
                })
                .on("error", (err) => {
                    let index = app.locals.converting.indexOf(decodeURIComponent(pathCheck.data))
                    if (index > -1) {
                        app.locals.converting.splice(index, 1);
                    }
                    socketIO.emit(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
                        type: "error",
                        data: err.message
                    })
                })
                .on("start", () => {
                    app.locals.converting.push(decodeURIComponent(pathCheck.data))
                })
                .on("progress", (pro) => {
                    socketIO.emit(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
                        type: "progress",
                        data: pro.percent
                    })
                })
                .run()
        } else
            next();
    }, express.static(argv["Video Directory"], {
        dotfiles: "allow"
    }), (req, res, next) => {
        if (!res.locals.tempVideo)
            return next();
        return res.sendFile(res.locals.tempVideo)
    })
}