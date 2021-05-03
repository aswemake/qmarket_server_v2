const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema({
    // 카테고리 타입
    type: {
        type: String,
        required: true
    },
    // 카테고리명
    name: {
        type: String,
        required: true
    },
    // 카테고리 이미지
    img: {
        type: String,
        required: true
    },
    // 성인인증 필요
    is_adult: {
        type: Boolean,
        required: true
    },
    // 카테고리에 속한 상품들
    product:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'products'
    }
})

module.exports = mongoose.model('Category', categorySchema)