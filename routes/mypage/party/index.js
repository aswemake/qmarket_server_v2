var express = require('express');
var router = express.Router();

router.use('/', require('./party'));
router.use('/mission', require('./mission'));
router.use('/benefit', require('./benefit'));

module.exports = router;