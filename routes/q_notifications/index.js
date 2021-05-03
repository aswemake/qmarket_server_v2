var express = require('express');
var router = express.Router();

router.use('/', require('./q_notifications')); // 큐알림 전체 삭제 API, 큐알림 리스트 조회 API, 큐알림 읽기 API, 큐알림 한 개 삭제 API

module.exports = router;