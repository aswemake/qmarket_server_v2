const mongoose = require('mongoose');

const { Schema } = mongoose;

const missionSchema = new Schema({
    // 참조하는 미션
    mission_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'mission_admins', 
    },
    // 작성인
    user_idx: {
        type: Number,
        required: true
    },
    // 미션 내용
    content: {
        type: String,
        required: true
    },
    // 첨부 이미지
    imgs: {
        type: [String],
    },
    // 미션 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Mission', missionSchema)