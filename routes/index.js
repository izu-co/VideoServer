var express = require('express');
var router = express.Router();

router.use('/', require('./backend/index'));

module.exports = router;