var express = require('express');
var router = express.Router();

// rendering API
router.use('/:partner_idx/qnas', require('./rendering/qnas')); // QnA 리스트 조회 API
router.use('/:partner_idx/order_request', require('./rendering/order_request')); // 주문 요청 목록 리스트 조회 API
router.use('/:partner_idx/delivery', require('./rendering/delivery')); // 배송 목록 리스트 조회 API
router.use('/:partner_idx/payment', require('./rendering/payment')); // 결제 내역 리스트 조회 API
router.use('/:partner_idx/vat', require('./rendering/vat')); // 정산 및 부가세 리스트 조회 API
router.use('/:partner_idx/products', require('./rendering/products')); // 상품 리스트 조회 API
router.use('/:partner_idx/enroll_main', require('./rendering/enroll_main')); // 상품 등록 API
router.use('/:partner_idx/vat', require('./rendering/vat')); // 상품 등록 API

// function API
router.use('/order/approval', require('./function/order_approve')); // 주문 요청 승인 API
router.use('/order/rejection', require('./function/order_reject')); // 주문 요청 거절 API
router.use('/order/status', require('./function/change_order_status')); // 주문 상태 변경 API (배송전->배송중->배송완료)
router.use('/qnas/answer', require('./function/answer')); // QnA 답변 저장 및 수정 API
router.use('/:partner_idx/products/change', require('./function/product_change')); // 상품 가격변경, 수량변경, 삭제 API
router.use('/:partner_idx/enroll', require('./function/enroll')); // 상품 낱개 등록 API
router.use('/:partner_idx/enroll_excel', require('./function/enroll_excel')); // 상품 일괄 등록 API
router.use('/:partner_idx/enroll_event', require('./function/enroll_event')); // 할인 상품 등록 API
router.use('/:partner_idx/vat/download', require('./function/vat_download')); // 부가세 신고자료 다운로드 API

module.exports = router;