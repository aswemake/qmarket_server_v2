var express = require('express');
var router = express.Router();

router.use('/home', require('./home'));
router.use('/hashtag', require('./hashtag'));
router.use('/search', require('./search'));
router.use('/notification', require('./notification'));

module.exports = router;