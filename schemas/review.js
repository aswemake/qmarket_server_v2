const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema({
    // 모임/상품 고유 아이디
    idx: {
        type: String,
        required: true
    },
    // 게시자 고유 아이디
    user_idx: {
        type: Number,
        required: true
    },
    // 리뷰 내용
    content: {
        type: String,
        required: true
    },
    // 리뷰 평점
    score: {
        type: Number,
        required: true
    },
    // 리뷰 사진
    img: {
    	type: [String],
    },
    // 리뷰 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Review', reviewSchema)
