const mongoose = require('mongoose');

const { Schema } = mongoose;

const couponSchema = new Schema({
    // 쿠폰명
    name: {
        type: String, 
        required: true, 
    },
    // 쿠폰 할인 가격
    sale_price: {
        type: Number,
        required: true
    },
    // 최소 사용 금액
    limit_price: {
        type: Number,
        required: true
    },
    // 쿠폰 사용 기한
    limit_date: {
        type: Date,
        required: true
    },
    // 쿠폰 타입(1:장터 2:반상회 3:전체)
    coupon_type: {
        type: Number,
        required: true
    },
    // 쿠폰 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Coupon', couponSchema)