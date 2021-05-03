var express = require('express');
var router = express.Router();

router.use('/product_orders', require('./product_orders'));
router.use('/party', require('./party'));
router.use('/party_orders', require('./party_orders'));
router.use('/users', require('./users'));
router.use('/success', require('./payment_success'));

module.exports = router;