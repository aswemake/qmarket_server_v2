var express = require('express');
var router = express.Router();

router.use('/feed', require('./feed'));
router.use('/mission', require('./mission'));
router.use('/info', require('./info'));
router.use('/review', require('./review'));
router.use('/share', require('./share'));
router.use('/like', require('./like'));
router.use('/main', require('./main'));
router.use('/all', require('./all'));
router.use('/feed_all', require('./feed_all'));

module.exports = router;