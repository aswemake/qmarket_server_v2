var express = require('express');
var router = express.Router();

router.use('/', require('./refund'));
router.use('/approve', require('./refund_approve'));
router.use('/reject', require('./refund_reject'));

module.exports = router;