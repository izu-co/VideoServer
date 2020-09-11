var express = require("express")
var router = express.Router()
const Path = require("path")
const index = require("../../index")

router.route('/login')
    .get(getRouteHandler)
/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function getRouteHandler(req, res) {
    res.sendFile(Path.join(index.argv["Working Directory"], "public", "html", "login.html"))
}


module.exports = router;