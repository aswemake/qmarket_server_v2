var express = require('express');
var router = express.Router();

router.use('/change', require('./change'));
router.use('/main', require('./main'));
router.use('/refund', require('./refund'));

module.exports = router;