var express = require('express');
var router = express.Router();
var path = require("path")

let dirname = __dirname.split(path.sep)[__dirname.split(path.sep).length - 1]


/**Post Routes Start */
router.use('/' + dirname, 
require('./clearLogs'),
require("./log"),
require("./getLogs"),
require("./deleteToken"),
require("./changeActive"),
require("./FileData"),
require("./setTime"),
require("./reload"),
require("./getTime"),
require("./getFiles"),
require("./checkToken"),
require("./login"),
require("./setUserData"),
require("./getUserData"),
require("./changePass"),
require("./getUsers"),
require("./addUser"));
/** Post Routes End */


module.exports = router;