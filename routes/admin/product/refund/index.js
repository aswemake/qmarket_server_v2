var express = require('express');
var router = express.Router();

router.use('/', require('./refund'));

module.exports = router;