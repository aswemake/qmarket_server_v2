const mongoose = require('mongoose');

const { Schema } = mongoose;

const ticketSchema = new Schema({
    // 반상회 고유 아이디
    party_idx: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'parties'
    },
    // 티켓 타입(1회권: 1, ALL: 2)
    type: {
        type: Number,
        required: true
    },
    // 티켓 이미지
    img: {
        type: String,
        required: true
    },
    // 티켓 보유자
    user: {
        type: [Number],
    },
    // 티켓 유효기간(1회권에만 존재)
    limit_date: {
        type: Date,
    }
});

module.exports = mongoose.model('Ticket', ticketSchema)