const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
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
    // 상품 가격
    price: {
        type: Number,
        required: true
    },
    // 상품 할인비율
    sale_ratio: {
        type: Number,
        required: true,
    },
    // 상품 할인된 가격
    saled_price:{
        type: Number,
        required: true
    },
    // 성인 인증 여부
    is_adult: {
        type: Boolean,
        required: true
    },
    // 상품 수량
    count: {
        type: Number,
        required: true
    },
    // 상품 공유 횟수
    shared_count: {
        type: Number,
        required: true,
        default: 0
    },
    // 상품 연관검색어
    hashtag:{
        type: [String]
    },
    // 이벤트 상품여부
    is_event:{
        type: Boolean
    },
    // 이벤트 할인율
    event_sale_ratio:{
        type: Number
    },
    // 상품 카테고리
    category_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
    },
    // 협력업체 고유번호
    partner_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'partners',
    },
    //상품 활성화,비활성화 여부
    enabled : {
        type : Boolean,
        required : true,
        default : true
    },
    // 상품 등록 시간
    created_at: {
        type: Date,
    },
    // 상품 수정 시간
    updated_at: {
        type: Date
    },
    // 상품 삭제 시간
    deleted_at: {
        type: Date
    }
});

module.exports = mongoose.model('Product', productSchema)