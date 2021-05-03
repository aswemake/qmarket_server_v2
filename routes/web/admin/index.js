var express = require('express');
var router = express.Router();

router.use('/bill', require('./bill'));
router.use('/refund', require('./refund'));

module.exports = router;