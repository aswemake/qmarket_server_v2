const mongoose = require('mongoose');

const { Schema } = mongoose;

const enroll_partySchema = new Schema({
    // 반상회 고유번호
    party_idx: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'parties'
    },
    // 유저 고유번호
    user_idx: {
        type: Number,
        required: true
    },
    // 등록한 반상회 회차
    enroll: {
        type: [Number],
        required: true
    },
    // All구매권 구분
    is_All: {
        type: Boolean,
        required: true
    }
})
module.exports = mongoose.model('Enroll_party', enroll_partySchema)