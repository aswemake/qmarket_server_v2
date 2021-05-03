var express = require('express');
var router = express.Router();

router.use('/coupon', require('./coupon'));
router.use('/users', require('./users'));
router.use('/party', require('./party'));
router.use('/order', require('./order'));
router.use('/qmoney', require('./qmoney'));
router.use('/QnA', require('./QnA'));
router.use('/review', require('./review'));

module.exports = router;