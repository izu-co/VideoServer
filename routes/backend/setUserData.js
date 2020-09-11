var express = require("express")
var router = express.Router()
const fileStuff = require("../../backend/fileStuff")
const Path = require("path");
const { requireArgumentsPost, getUserPOST } = require("../Routes");

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(getUserPOST, requireArgumentsPost(["token, data"]), postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    res.send(fileStuff.saveUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.data))
}


module.exports = router;