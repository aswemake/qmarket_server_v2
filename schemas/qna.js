const mongoose = require('mongoose');

const { Schema } = mongoose;

const qnaSchema = new Schema({
    // 상품 고유번호
    product_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product_idx',
        required: true
    },
    // 유저 고유번호
    user_idx: {
        type: Number,
        required: true
    },
    // 질문
    question: {
        type: String,
        required: true
    },
    // 답변
    answer: {
        type: String
    },
    // 질문 생성 날짜
    created_at: {
        type: Date,
        required: true
    },
    // 답변 생성 날짜
    updated_at: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('QnA', qnaSchema)