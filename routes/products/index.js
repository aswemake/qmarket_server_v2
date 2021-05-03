var express = require('express');
var router = express.Router();

router.use('/', require('./products')); // 상품 리스트 조회 API, 상품 상세 조회 API
router.use('/:product_idx/reviews', require('./review')); // 상품 리뷰 리스트 조회 API
router.use('/:product_idx/review', require('./review')); // 상품 리뷰 등록 API
router.use('/:product_idx/qnas', require('./qna')); // 상품 qna 리스트 조회 API
router.use('/:product_idx/qna', require('./qna')); // 상품 qna 등록 API
router.use('/:product_idx/like', require('./product_like')); // 상품 좋아요 설정 API
router.use('/:product_idx/share', require('./product_share')); // 상품 공유 횟수 증가 API
router.use('/:product_idx/reviews/:review_idx/like', require('./review_like')); // 상품 리뷰 좋아요 설정 API



module.exports = router;