var express = require('express');
var router = express.Router();

router.use('/', require('./product'));
router.use('/QnA', require('./QnA'));
router.use('/delivery', require('./delivery'));
router.use('/payment', require('./payment'));
router.use('/inventory', require('./inventory'));
router.use('/refund', require('./refund'));


module.exports = router;