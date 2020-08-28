var express = require('express');
var router = express.Router();
var path = require("path")
var loginBackend = require("../../backend/UserMangement")

let dirname = __dirname.split(path.sep)[__dirname.split(path.sep).length - 1]

router.use(requireAguments)

/**Post Routes Start */
router.use('/' + dirname);
/** Post Routes End */

let args = ["token"];

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function requireAguments(req, res, next) {
    let goOn = true;
    for(let i = 0; i<args.length; i++) {
        if (!req["cookies"][args[i]] === undefined) {
            res.status(400).send({"status" : false, "reason": "Missing Body argument '" + args[i] + "'"})
            goOn = false;
            break
        }
    }
    if (goOn)
        next();
}

module.exports = router;