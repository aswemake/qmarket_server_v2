var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth'));
router.use('/main', require('./main'));
router.use('/party', require('./party'));
router.use('/product', require('./product'));
router.use('/payment', require('./payment'));
router.use('/mypage', require('./mypage'));
router.use('/insert_data', require('./insert_data'));
//router.use('/', require('./web'));
router.use('/', require('./web'));
router.use('/schedule', require('./schedule'));
router.use('/category', require('./category'));
router.use('/products', require('./products'));
router.use('/partner', require('./partner'));
router.use('/home', require('./home'));
router.use('/delivery_charge', require('./delivery_charge'));
router.use('/user', require('./user'));
router.use('/q-notifications', require('./q_notifications'));

module.exports = router;
