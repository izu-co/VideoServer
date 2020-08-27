var express = require("express")
var router = express.Router()
let index = require("../../index")
var Path = require("path")

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    res.send({"status" : true, "data" : index.logs})
}

module.exports = router;