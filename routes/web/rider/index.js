var express = require('express');
var router = express.Router();

// rendering API
router.use('/:partner_idx/delivery', require('./delivery')); // 배송 목록 리스트 조회 API
router.use('/order/status', require('./change_order_status')); // 주문 상태 변경 API (배송전->배송중->배송완료)

module.exports = router;