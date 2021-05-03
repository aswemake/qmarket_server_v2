const mongoose = require('mongoose');

const { Schema } = mongoose;

const benefitSchema = new Schema({
    // 반상회 고유 아이디
    party_idx: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'parties'
    },
    // 혜택 이미지
    img: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Benefit', benefitSchema)