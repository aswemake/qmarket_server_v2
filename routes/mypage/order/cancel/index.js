var express = require('express');
var router = express.Router();

router.use('/', require('./cancel'));
router.use('/info', require('./info'));

module.exports = router;