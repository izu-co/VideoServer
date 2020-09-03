var express = require('express');
var router = express.Router();
const index = require("../index")
const path = require("path")

router.use('/', 
require('./backend/index'),
require("./frontend/index"))
router.use(notFound)

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function notFound(req, res) {
    console.log(req.method, path.join(index.path, "public", "html", "notFound.html"))
    switch (req.method) {
        case "POST":
            res.status(404).json({"status": false, "reason": "Not found"})
            break;
        case "GET":
            res.sendFile(path.join(index.path, "public", "html", "notFound.html"))
            break;
        default:
            res.status(404).json({"status": false, "reason": "Not found"})
    }
}

module.exports = router;