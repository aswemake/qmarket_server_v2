var express = require('express');
var router = express.Router();

router.use('/', require('./review'));
router.use('/own', require('./own'));
router.use('/like', require('./like'));

module.exports = router;