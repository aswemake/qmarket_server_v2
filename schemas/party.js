const mongoose = require('mongoose');

const { Schema } = mongoose;

const partySchema = new Schema({
    // 반상회 기수
    no: {
        type: String
    },
    // 모임 대표이미지
    main_img: {
        type: String,
        required: true
    },
    // 모임 이미지
    img: {
        type: [String],
        required: true
    },
    // 모임 이름
    name: {
        type: String,
        required: true
    },
    // 모임 소개
    content: {
        type: String,
        required: true
    },
    // 반상회장
    leader: {
        type: String,
        required: true
    },
    // 모임 날짜
    start_date: {
        type: String,
        required: true
    },
    // 모임 시작 시간
    start_time: {
        type: [Date],
        required: true
    },
    // 해시태그(검색용)
    hashtag: {
        type: [String]
    },
    // 모임 장소 정보
    location_idx: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'locations',
    },
    // 모임 참여 최대 인원
    max: {
        type: Number,
        required: true
    },
    // 반상회 1회 참석 가격
    price: {
        type: Number,
        required: true
    },
    // 반상회 4회 참석 할인율
    sale_ratio: {
        type: Number,
        required: true
    },
    // 반상회 진행 횟수
    episode: {
        type: Number,
        default: 0
    },
    // 반상회 완료 여부(4회차까지 전부 진행)
    is_finished: {
        type: Boolean,
        required: true,
        default: false
    },
    // 반상회 공유 횟수
    shared_count: {
        type: Number,
        required: true,
        default: 0
    },
    // 반상회 입장권
    ticket: {
        one: {
            type: String
        },
        all: {
            type: String
        }
    },
    // 반상회 혜택 이미지
    benefit: {
        type: String,
        required: true
    },
    // 혜택 만료기간
    benefit_date: {
        type: [Date],
        required: true
    },
    // 반상회 패턴(ex> [1,2,0,1] -> [1, (2,3), 4])
    pattern: {
        type: [Number],
        required: true
    },
    // 반상회 노출여부
    is_show: {
        type: Boolean,
        required: true,
        default: true
    },
    // 모임 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Party', partySchema)