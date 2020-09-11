var express = require('express');
var router = express.Router();

router.use('/',
require("./logs"),
require("./admin"),
require("./front"),
require("./login"),
require("./settings"))

module.exports = router;