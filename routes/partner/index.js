var express = require('express');
var router = express.Router();

router.use('/:partner_idx/delivery_charge', require('./partner_delivery_charge')); // 마트 별 배송비 조회 및 가격 별 배송비 조회 API
router.use('/:partner_idx/delivery_info', require('./partner_delivery_info')); // 마트 별 배송정보 조회 API
router.use('/recommendation', require('./partner_recommendation')); // 마트 추천 API
router.use('/', require('./partner')); // 매칭 마트 정보 조회 API

module.exports = router;