var express = require('express');
var router = express.Router();

router.use('/', require('./order'));
router.use('/info', require('./info'));
router.use('/cancel', require('./cancel'));

module.exports = router;