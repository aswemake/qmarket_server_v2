const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema_v2 = new Schema({
    // 상품 이미지
    img: {
        type: [String],
        required: true
    },
    // 상품 상세 이미지
    detail_img: {
        type: [String],
        required: true
    },
    // 상품명
    name: {
        type: String, 
        required: true, 
    },
    // 상품에 대한 부가 설명
    detail_name: {
        type: String,
        required: true
    },
    // 바코드
    barcode: {
        type: String,
        required:true
    },
    // 규격
    standard: {
        type: String,
        required:true
    },
    // 실제 가격
    original_price: {
        type: Number,
        required:true
    },
    // 해시태그
    hashtag: {
        type: [String],
        required: true
    },
    // 협력업체 고유번호
    partner_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'partners',
        required: true
    },
    // 상품 카테고리
    category_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true
    },
    // 상품 수량
    count: {
        type: Number,
        required: true
    },
    // 좋아요 횟수
    like_count: {
        type: Number,
        required: true
    },
    // 공유 횟수
    shared_count: {
        type: Number,
        required: true
    },
    // 판매된 횟수
    saled_count: {
        type: Number,
        required: true
    },
    // 100원 딜 이벤트 여부
    one_hundred_deal_event: {
        type: Boolean,
        required: true
    },
    // 세일 이벤트
    events: {
        type: [Object],
        required: true
    },
    // 성인 인증 여부
    is_adult: {
        type: Boolean,
        required: true
    },
    // 상품 활성화 여부
    enabled: {
        type: Boolean,
        required: true
    },
    // 상품 등록 시간
    created_at: {
        type: Date,
        required: true
    },

    // // 지우기
    // price: {
    //     type: Number,
    //     required: true
    // },
    // default_sale_ratio: {
    //     type: Number,
    //     required: true
    // }
})

module.exports = mongoose.model('Product_v2', productSchema_v2)