const mongoose = require('mongoose');

const { Schema } = mongoose;

const coupon_userSchema = new Schema({
    // 쿠폰보유 고객
    user_idx: {
        type: Number, 
        required: true, 
    },
    // 보유 쿠폰
    coupon: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    }],
    // 사용한 쿠폰
    used_coupon: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    }]
});

module.exports = mongoose.model('Coupon_user', coupon_userSchema)