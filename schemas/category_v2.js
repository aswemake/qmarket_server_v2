const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema_v2 = new Schema({
    // 카테고리 고유번호
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // 카테고리명
    name: {
        type: String,
        required: true,
    },
    // 부모 카테고리(없으면 null)
    parent: {
        type:String,
    },
    // 카테고리 이미지
    img: {
        type: String,
    }
})

module.exports = mongoose.model('Category_v2', categorySchema_v2)