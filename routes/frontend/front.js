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
    res.redirect("/player/videoShow.html?path=")
}


module.exports = router;