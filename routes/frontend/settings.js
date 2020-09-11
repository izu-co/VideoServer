var express = require("express")
var router = express.Router()
const Path = require("path")
const index = require("../../index")
const {GetUserGET} = require("../Routes")

router.route('/')
    .get(GetUserGET, getRouteHandler)
/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function getRouteHandler(req, res) {
    res.sendFile(path.join(__dirname, "private", "html", "settings.html"))
}


module.exports = router;