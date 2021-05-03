var express = require('express');
var router = express.Router();

router.use('/', require('./review'));
router.use('/delete', require('./delete'));

module.exports = router;