const mongoose = require('mongoose');

const { Schema } = mongoose;

const benefit_userSchema = new Schema({
    // 혜택 고유 아이디
    benefit_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'benefits'
    },
    // 혜택 보유자 고유 아이디
    user_idx: {
        type: Number,
        required: true
    },
    // 혜택 유효기간
    limit_date:{
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Benefit_user', benefit_userSchema)