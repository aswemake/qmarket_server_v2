const mongoose = require('mongoose');

const { Schema } = mongoose;

const partnerSchema = new Schema({
    // 메인 이미지
    img: {
        type: String,
        required: true
    },
    // 타입 (큐메이커 or 파트너마트)
    type: {
        type: String,
        required: true
    },
    // 이름
    name: {
        type: String,
        required: true
    },
    // 주소
    address: {
        type: String,
        required: true
    },
    // 전화 번호
    tel_number: {
        type: String,
        required: true
    },
    // 운영 시간
    operation_time: {
        type: String,
        required: true
    },
    // 휴무일
    closed: {
        type: String,
        required: true
    },
    // 대표자
    representative: {
        type: String,
        required: true
    },
    // 상호명
    business_name: {
        type: String,
        required: true
    },
    // 사업자번호
    business_registration_number: {
        type: String,
        required: true
    },
    // 마트 소개
    introduction: {
        type: String,
        required: true
    },
    // 판매가능 지역
    salesable_area: {
        type: [String],
        required: true
    },
    // 배달비
    delivery_charge: {
        type: [Object],
        required: true
    }
});

module.exports = mongoose.model('Partner', partnerSchema)