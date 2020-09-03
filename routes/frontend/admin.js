var express = require("express")
var router = express.Router()
const Path = require("path")
const index = require("../../index")

router.route('/admin/')
    .get(getRouteHandler)
/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function getRouteHandler(req, res) {
    if (res.locals.user["perm"] === "Admin")
        res.sendFile(Path.join(index.path, "private", "html", "admin.html"))
    else 
        res.send("You dont have Permission to access that!")
}

module.exports = router;