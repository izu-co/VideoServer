
import { Request, Response, NextFunction } from "express";
import * as loginBackend from "../backend/UserMangement"
import slowDown from "express-slow-down";

/**
 * @param force If true, the function will enforce its rules upon api requests
 */
export function getUser(force = false) {
    return function (req:Request, res:Response, next:NextFunction) {
        let apiRequest = req.originalUrl.startsWith('/api/')
        if (apiRequest && !force)
            return next()
        let token = req.body.token || req.cookies["token"] || req.headers["token"] || req.query["token"]
        if (!token)
            if (apiRequest)
                return res.redirect("/")
            else
                return res.status(400).send({"status": false, "reason": "Missing token"})
        let user = loginBackend.checkToken(token, req.header('x-forwarded-for') || req.socket.remoteAddress)
        if (user["status"]) {
            res.locals.user = user["data"];
            next();
        } else
            if (apiRequest)
                return res.redirect("/")
            else
                return res.send(user)
    }
}

export function requireArguments (Arguments:Array<string>) {
    return function (req:Request, res:Response, next:NextFunction) {
        let arg = (req.method === "GET" || req.method === "HEAD") ? req.query : req.body
        if (!arg && Arguments.length > 0)
            return res.status(400).send({"status": false, "reason": "Missing Body arguments '" + Arguments.join(', ')  + "'"})
        let goOn = true;
        for(let i = 0; i < Arguments.length; i++) {
            if (arg[Arguments[i]] === undefined) {
                res.status(400).send({"status" : false, "reason": "Missing Body argument '" + Arguments[i] + "'"})
                goOn = false;
                break
            }
        }
        if (goOn)
            next();
    }
}

const limiter = slowDown({
    delayAfter: 5000,
    maxDelayMs: 60 * 1000,
    delayMs: 1000
})

export {limiter}