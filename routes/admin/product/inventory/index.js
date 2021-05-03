var express = require('express');
var router = express.Router();

router.use('/', require('./inventory'));
router.use('/change', require('./change'));
router.use('/enroll', require('./enroll'));
router.use('/enroll_main', require('./enroll_main'));
router.use('/enroll_excel', require('./enroll_excel'));

module.exports = router;