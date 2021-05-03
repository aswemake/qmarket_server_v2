const mongoose = require('mongoose');

const { Schema } = mongoose;

const hashtagSchema = new Schema({
    // 해시태그 이름
    name: {
        type: String,
        required: true
    },
    // 반상회에 포함된 해시태그 수
    count: {
        type: Number,
        required: true,
        default: 1
    }
});

module.exports = mongoose.model('Hashtag', hashtagSchema)