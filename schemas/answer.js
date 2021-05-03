const mongoose = require('mongoose');

const { Schema } = mongoose;

const answerSchema = new Schema({
    // 질문 고유 아이디
    question_idx: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Question'
    },
    // 답변자 고유 아이디
    user_idx: {
        type: Number,
        required: true
    },
    // 답변 내용
    content: {
        type: String,
        required: true
    },
    // 답변 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Answer', answerSchema)