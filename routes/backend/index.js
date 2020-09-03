var express = require('express');
var router = express.Router();
var path = require("path")
var loginBackend = require("../../backend/UserMangement")

let dirname = __dirname.split(path.sep)[__dirname.split(path.sep).length - 1]

router.use(requireAguments, 
    (req, res, next) => {
        if (req.method === "POST")
            loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
                if (user["status"]) {
                    res.locals.user = user["user"];
                    next();
                } else
                    res.send(user)
            })
        else 
            next()
    })

/**Post Routes Start */
router.use('/' + dirname, 
require('./clearLogs'),
require("./log"),
require("./getLogs"),
require("./deleteToken"),
require("./changeActive"),
require("./FileData"),
require("./setTime"),
require("./reload"),
require("./getTime"),
require("./getFiles"),
require("./checkToken"),
require("./login"),
require("./setUserData"),
require("./getUserData"),
require("./changePass"),
require("./getUsers"),
require("./addUser"));
/** Post Routes End */

let args = ["token"];

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function requireAguments(req, res, next) {
    if (req.method !== "POST")
        next()
    let goOn = true;
    for(let i = 0; i<args.length; i++) {
        if (req.body[args[i]] === undefined) {
            res.status(400).send({"status" : false, "reason": "Missing Body argument '" + args[i] + "'"})
            goOn = false;
            break
        }
    }
    if (goOn)
        next();
}

module.exports = router;