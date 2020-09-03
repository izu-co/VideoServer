var express = require("express")
var router = express.Router()
const Path = require("path")
const index = require("../../index")

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .get(getRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function getRouteHandler(req, res) {
    res.sendFile(Path.join(index.path, "private", "html", "logs.html"))
}

module.exports = router;