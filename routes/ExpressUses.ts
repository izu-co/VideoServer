import { app, argv, VideoNameExtensions } from "../index";
import * as express from "express";
import * as path from "path";
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { GetUserGET, limiter } from "./Routes";

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

        next();
    }, express.static(argv["Video Directory"], {
        dotfiles: "allow"
    }))
    
}