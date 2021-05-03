const mongoose = require('mongoose');

const { Schema } = mongoose;

const questionSchema = new Schema({
    // 질문자 고유 아이디
    user_idx: {
        type: Number,
        required: true
    },
    // 모임/상품 구분
    category: {
        type: String,
        required: true
    },
    // 상품 고유 아이디
    product_idx: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'products',
    },
    // 질문 내용
    content: {
        type: String,
        required: true
    },
    // 질문 등록 시간
    created_at: {
        type: Date,
    },
    // 답변 여부
    is_answered: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model('Question', questionSchema)