var express = require("express")
var router = express.Router()
const Path = require("path")
const index = require("../../index")
const {GetUserGET} = require("../Routes")

router.route('/admin/')
    .get(GetUserGET, getRouteHandler)
/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function getRouteHandler(req, res, next) {
    if (res.locals.user["perm"] === "Admin")
        res.sendFile(Path.join(index.argv["Working Directory"], "private", "html", "admin.html"))
    else 
        next()
}
module.exports = router;