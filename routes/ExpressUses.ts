import { app, argv, VideoNameExtensions } from "../index";
import * as express from "express";
import * as path from "path";
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { GetUserGET } from "./Routes";

export function init() {
    app.use(express.json())
    app.use(cookieParser())
    app.use(json())
    app.locals.streams = {};
    app.use("/favicon.ico", express.static(path.join(argv["Working Directory"], "favicon.ico")))

    /**
     * Public Uses
     */
    app.use('/public/js', express.static(path.join(argv["Working Directory"], "public", "javascript")))
    app.use('/public/style', express.static(path.join(argv["Working Directory"], "public", "style")))

    /**
     * Private Uses
     */
    app.use('/private/js', GetUserGET, express.static(path.join(argv["Working Directory"], "private", "javascript")))
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

        next();
    }, express.static(argv["Video Directory"]))
    app.use("/icon.png", express.static(path.join(argv["Working Directory"], "Icon.png")))
    app.use('/private/style', GetUserGET, express.static(path.join(argv["Working Directory"], "private", "style")))
    app.use('/private/html', GetUserGET, express.static(path.join(argv["Working Directory"], "private", "html")))
    app.use("/private/font", GetUserGET, express.static(path.join(argv["Working Directory"], "private", "font")))
    app.use("/player/player.html", GetUserGET, express.static(path.join(argv["Working Directory"], "private", "html", "player.html")))
    app.use("/player/videoShow.html", GetUserGET, express.static(path.join(argv["Working Directory"], "private", "html", "videoShow.html")))
}