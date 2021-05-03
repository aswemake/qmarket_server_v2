const mongoose = require('mongoose');

const { Schema } = mongoose;

const locationSchema = new Schema({
    // 장소 이름
    name: {
        type: String,
        required: true
    },
    // 장소 주소
    address: {
        type: String,
        required: true
    },
    // 장소 위치(위도,경도)
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
    }
});
module.exports = mongoose.model('Location', locationSchema)