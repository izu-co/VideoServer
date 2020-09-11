var express = require("express")
var router = express.Router()
const fileStuff = require("../../backend/fileStuff")
const Path = require("path")
const index = require("../../index")
const { getUserPOST } = require("../Routes")

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(getUserPOST, postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    if (res.locals.user["perm"] === "Admin")
        res.send(fileStuff.createImages(index.argv["Video Directory"], false, 5, 3, false))
    else 
        res.send({"status" : false, "reason" : "Permission denied!"})
}

module.exports = router;