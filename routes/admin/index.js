var express = require('express');
var router = express.Router();

// 로그인 로그아웃 및 메인화면
router.use('/start', require('./start'));
router.use('/login', require('./login'));
router.use('/', require('./main'));
router.use('/logout', require('./logout'));

// 반상회 화면
router.use('/party', require('./party'));

// 상품 화면
router.use('/product', require('./product'));

// 토큰 저장 및 갱신
router.use('/token', require('./token'));

module.exports = router;