const mongoose = require('mongoose');

const { Schema } = mongoose;

const likeSchema = new Schema({
    // 리뷰글 고유 아이디
    review_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reviews' 
    },
    // 상품 고유 아이디
    product_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
    },
    // 반상회 고유 아이디
    party_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'parties'
    },
    // 좋아요 누른 사람 고유 아이디
    user_idx: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Like', likeSchema)