const mongoose = require('mongoose');

const { Schema } = mongoose;

const feedSchema = new Schema({
    // 참조하는 모임
    party_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'parties',
    },
    // 피드 제목
    name: {
        type: String,
        required: true
    },
    // 피드 내용
    content: {
        type: String,
        required: true
    },
    // 피드 이미지
    img: {
        type: [String],
        required: true
    },
    // 피드 게시 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Feed', feedSchema)