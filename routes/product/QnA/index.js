var express = require('express');
var router = express.Router();

router.use('/', require('./QnA'));
router.use('/own', require('./own'));

module.exports = router;