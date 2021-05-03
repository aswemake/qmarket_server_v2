var express = require('express');
var router = express.Router();

router.use('/', require('./notification'));
router.use('/delete', require('./delete'));
router.use('/read', require('./read'));

module.exports = router;