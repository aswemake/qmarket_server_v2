const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema({
    // 유저 고유번호
    user_idx: {
        type: Number,
        required: true
    },
    // 큐알림 타입
    type: {
        type: String,
        required: true
    },
    // 큐알림 링크
    link: {
        link_type: { type: String },
        link_address: { type: String }
    },
    // 큐알림 제목
    name: {
        type: String,
        required: true
    },
    // 큐알림 상세 내용
    content: {
        type: String,
        required: true
    },
    // 큐알림 이미지
    img: {
        type: String
    },
    // 큐알림  읽음여부
    is_read: {
        type: Boolean,
        required: true,
        default: false
    },
    // 큐알림 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Notification', notificationSchema)