var express = require('express');
var router = express.Router();

router.use('/login', require('./login'));
router.use('/verify', require('./verify'));
router.use('/fcm', require('./fcm'));
router.use('/adult', require('./adult'));

module.exports = router;