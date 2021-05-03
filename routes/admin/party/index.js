var express = require('express');
var router = express.Router();

router.use('/', require('./party'));
router.use('/episode', require('./episode'));
router.use('/time', require('./time'));
router.use('/mission', require('./mission'));
router.use('/member', require('./member'));
router.use('/payment', require('./payment'));
router.use('/payment_one', require('./payment_one'));
router.use('/end', require('./end'));
router.use('/update', require('./update'));

module.exports = router;