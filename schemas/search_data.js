const mongoose = require('mongoose');

const { Schema } = mongoose;

const search_dataSchema = new Schema({
    // 검색어
    word: {
        type: String,
        required: true
    },
    // 검색어 저장 수
    count: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('Search_data', search_dataSchema)