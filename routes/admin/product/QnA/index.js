var express = require('express');
var router = express.Router();

router.use('/main', require('./main'));
router.use('/answer', require('./answer'));

module.exports = router;