var express = require('express');
var router = express.Router();

router.use('/', require('./user')); // 유저 정보 조회 API
router.use('/orders', require('./orders')) // 유저 주문 리스트 조회 API, 유저 주문 상세 조회 API, 유저 구매 확정 API
router.use('/refunds', require('./refunds')) // 유저 환불 리스트 조회 API, 유저 환불 상세 조회 API
router.use('/refund', require('./refunds')) // 유저 상품 환불 요청하기 API
router.use('/issueable-coupons', require('./issueable-coupons')) // 유저가 발급받을 수 있는 쿠폰 리스트 조회 API
router.use('/available-coupons', require('./available-coupons')) // 유저가 사용할 수 있는 쿠폰 리스트 조회 API
router.use('/coupon', require('./coupon')) // 유저 쿠폰 발급 API
router.use('/qmoney', require('./qmoney')) // 유저 보유 큐머니, 큐머니 사용 리스트 조회 API
router.use('/qnas', require('./qnas')) // 유저가 작성한 qna 리스트 조회 API
router.use('/reviews', require('./reviews')) // 유저가 작성한 review 리스트 조회 API
router.use('/review', require('./reviews')) // 유저가 작성한 review 삭제 API
router.use('/one-hundred-deal-event-usage-check', require('./one_hundred_deal_event_usage_check')); // 유저가 100원딜 이벤트 상품을 구매할 수 있는 상태인지 확인 API

module.exports = router;