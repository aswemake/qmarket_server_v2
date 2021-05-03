var express = require('express');
var router = express.Router();

router.use('/', require('./insert_data'));

module.exports = router;