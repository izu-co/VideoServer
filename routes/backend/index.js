var express = require('express');
var router = express.Router();
var path = require("path")
var loginBackend = require("../../backend/UserMangement")

let dirname = __dirname.split(path.sep)[__dirname.split(path.sep).length - 1]

router.use((req, res, next) => {
    loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (user["status"]) {
            res.locals.user = user["user"];
            next();
        } else
            res.send(user)
    })})

router.use('/' + dirname, require('./clearLogs'), require("./log"), require("./getLogs"), require("./deleteToken"),
    );

module.exports = router;