const mongoose = require('mongoose');

const { Schema } = mongoose;

const bannerSchema = new Schema({
    // 배너 이미지
    main_img: {
        type: String,
        required: true,
    },
    // 배너 타입(1:반상회, 2:장터, 3:공통)
    type: {
        type: Number,
        required: true
    },
    // 배너 링크(link_type : url, party, product)
    link: {
        link_type: { type: String },
        link_address: { type: String }
    },
    // 메인 화면 노출 여부
    show_main:{
        type: Boolean,
        required: true
    },
    // 배너 등록 시간
    created_at: {
        type: Date,
    }
});

module.exports = mongoose.model('Banner', bannerSchema)