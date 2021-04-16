import { app, argv, VideoNameExtensions } from "../index";
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
    app.locals.streams = {};
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
        if (urlPath.pop() === "mp4" && VideoNameExtensions.includes(urlPath.pop())) {
            let pathCheck = checkPath(req.path.replace('/video/', ''))
            if (!pathCheck.status) {
                res.status(400).end()
                return;
            }
            
            let streamPath = pathCheck.data.split("\.").reverse().slice(1).reverse().join("\.")

            var stream = fs.createReadStream(decodeURIComponent(streamPath), {
                autoClose: true,
            })

            if (fs.existsSync(decodeURIComponent(pathCheck.data)))
                return next()

            if (fs.existsSync("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())) {
                res.locals.tempVideo = path.resolve("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())
                return next()
            }

            ffmpeg()
                .input(stream)
                .outputOptions([ '-preset veryfas', '-c:v copy', '-y'])
                .output("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())
                .on("end", () => {
                    res.locals.tempVideo = path.resolve("./temp/" + decodeURIComponent(pathCheck.data).split(path.sep).pop())
                    return next()
                })
                .run()
        } else
            next();
    }, express.static(argv["Video Directory"], {
        dotfiles: "allow"
    }))
    
    app.use("/video", (req, res, next) => {
        if (!res.locals.tempVideo)
            return next();
        const stat = fs.statSync(res.locals.tempVideo);
        const total = stat.size;
        console.log(req.headers.range)
        if (req.headers.range) {
            const range = req.headers.range;
            const parts = range.replace(/bytes=/, "").split("-");
            const partialstart = parts[0];
            const partialend = parts[1];

            const start = parseInt(partialstart, 10);
            const end = partialend ? parseInt(partialend, 10) : total-1;
            const chunksize = (end-start)+1;
            const file = fs.createReadStream(res.locals.tempVideo, {start: start, end: end});
            res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
            file.pipe(res);
            file.on("close", () => {
                console.log("data sent", start ,end)
            })

        } else {
            res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
            fs.createReadStream(res.locals.tempVideo).pipe(res);
        }
    })

}