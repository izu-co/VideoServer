var express = require("express")
var router = express.Router()
const fileStuff = require("../../backend/fileStuff")
const Path = require("path");
const { getUserPOST, requireArgumentsPost } = require("../Routes");

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(getUserPOST, requireArgumentsPost(["path"]), postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    fileStuff.getFileData(req.body.path, req.header('x-forwarded-for') || req.socket.remoteAddress).then(answer => {
        res.send(answer===null?{"status": false} : {"status": true, "data": answer})
    })
}

module.exports = router;