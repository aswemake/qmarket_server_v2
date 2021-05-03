const mongoose = require('mongoose');

const { Schema } = mongoose;

const purchasable_locationSchema = new Schema({
    // 구매가능한 지역(시,도)
    sido: {
        type: String,
        required: true
    },
    // 구매가능한 지역(군,구)
    sigungu: {
        type: [String],
        required: true
    }
});

module.exports = mongoose.model('Purchasable_location', purchasable_locationSchema)