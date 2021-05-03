var express = require('express');
var router = express.Router();

// 로그인 로그아웃 및 메인화면
router.use('/start', require('./start'));
router.use('/login', require('./login'));
router.use('/', require('./main'));
router.use('/logout', require('./logout'));

//관리자 전용
router.use('/admin', require('./admin'));

//파트너 전용
router.use('/manager', require('./manager'));

//라이더 전용
router.use('/rider', require('./rider'));

// 토큰 저장 및 갱신
router.use('/token', require('./token'));

// 테스트
//router.use('/test', require('./test'));

module.exports = router;