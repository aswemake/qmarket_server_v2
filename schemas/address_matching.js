const mongoose = require('mongoose');

const { Schema } = mongoose;

const addressMatchingSchema = new Schema({
    // 행정동코드
    h_code: {
        type: String,
        required: true
    },
    // 법정동코드
    b_code: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Address_matching', addressMatchingSchema)