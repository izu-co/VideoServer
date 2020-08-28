var express = require("express")
var router = express.Router()
const Path = require("path")

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireAguments, postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    if (res.locals.user["perm"] === "Admin") {
        console.log(req.body.message)
        res.send({"status" : true})
    } else 
        res.send({"status" : false})
}

let args = ["message"];

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function requireAguments(req, res, next) {
    let goOn = true;
    for(let i = 0; i<args.length; i++) {
        if (!req.body[args[i]] === undefined) {
            res.status(400).send({"status" : false, "reason": "Missing Body argument '" + args[i] + "'"})
            goOn = false;
        }
    }
    if (goOn)
        next();
}

module.exports = router;