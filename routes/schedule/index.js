var express = require('express');
var router = express.Router();

router.use('/', require('./schedule'));

module.exports = router;