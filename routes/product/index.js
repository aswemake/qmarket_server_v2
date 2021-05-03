var express = require('express');
var router = express.Router();

router.use('/info', require('./info'));
router.use('/review', require('./review'));
router.use('/QnA', require('./QnA'));
router.use('/like', require('./like'));
router.use('/share', require('./share'));
router.use('/main', require('./main'));
router.use('/category', require('./category'));
router.use('/event', require('./event'));

module.exports = router;