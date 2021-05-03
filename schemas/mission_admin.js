const mongoose = require('mongoose');

const { Schema } = mongoose;

const mission_adminSchema = new Schema({
    // 참조하는 모임
    party_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'parties', 
    },
    // 미션 회차
    episode: {
        type: Number,
        required: true
    },
    // 작성인
    leader: {
        type: String,
        required: true
    },
    // 미션 내용
    content: {
        type: String,
        required: true
    },
    // 미션 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Mission_admin', mission_adminSchema)