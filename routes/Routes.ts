
import { Request, Response, NextFunction } from "express";
import * as loginBackend from "../backend/UserMangement"
import slowDown from "express-slow-down";

export function getUserPOST (req:Request, res:Response, next:NextFunction) {
    if (req.method === "POST") {
        let user = loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress)
        if (user["status"]) {
            res.locals.user = user["data"];
            next();
        } else
            res.send(user)
    } else 
        next()
}

export function GetUserGET (req:Request, res:Response, next:NextFunction) {
    req.cookies["token"] = req.cookies["token"] || req.headers["token"] || req.query["token"]
    if (req.method === "GET")
        if (req["cookies"]["token"]) {
            let user = loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
            if (user["status"]) {
                res.locals.user = user["data"]
                next()
            } else
                res.redirect("/")
        } else
            res.redirect("/")
    else
        next()
}

export function requireArgumentsPost (Arguments:Array<string>) {
    return function (req:Request, res:Response, next:NextFunction) {
        if (req.method !== "POST") 
            next()
        else {
            let goOn = true;
            for(let i = 0; i<Arguments.length; i++) {
                if (req.body[Arguments[i]] === undefined) {
                    res.status(400).send({"status" : false, "reason": "Missing Body argument '" + Arguments[i] + "'"})
                    goOn = false;
                    break
                }
            }
            if (goOn)
                next();
        }
    }
}

const limiter = slowDown({
    delayAfter: 5000,
    maxDelayMs: 60 * 1000,
    delayMs: 1000
})

export {limiter}