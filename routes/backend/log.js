var express = require("express")
var router = express.Router()
const Path = require("path")

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(postRouteHandler);

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

module.exports = router;