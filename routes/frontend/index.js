var express = require('express');
var router = express.Router();
const loginBackend = require("../../backend/UserMangement")
const Path = require("path")
const index = require("../../index")

router.use(requireAguments)
router.use(checkToken)

router.use('/',
require("./logs"),
require("./admin"))

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function checkToken(req, res, next) {
    if (req.method === "GET")
        if (req["cookies"]["token"]) {
            loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
                if (user["status"]) {
                    res.locals.user = user["user"]
                    next();
                } else
                    res.redirect("/login/")
            })
        } else 
            res.redirect("/login/")
    else
        next()
}

let args = ["token"];

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function requireAguments(req, res, next) {
    if (req.method === "GET") {
        let goOn = true;
        for(let i = 0; i<args.length; i++) {
            if (req["cookies"][args[i]] === undefined) {
                res.redirect("/login")
                goOn = false;
                break
            }
        }
        if (goOn)
            next();
    } else 
        next()
}

module.exports = router;