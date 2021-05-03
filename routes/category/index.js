var express = require('express');
var router = express.Router();

router.use('/', require('./category'));

module.exports = router;