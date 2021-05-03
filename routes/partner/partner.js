var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Address = require('../../schemas/address_matching');
const Partner = require('../../schemas/partner');

// 매칭 마트 정보 조회 API
router.get('/', async (req, res) => {
    let { b_code, h_code } = req.query;
    if ((!b_code && !h_code) || (b_code && h_code)) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = new Object();

            // b_code(법정동코드)가 입력된 경우에 h_code(행정동코드)로 변환
            if (b_code) {
                let address = await Address.find({ b_code: b_code });
                if (address.length <= 0) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
                } else {
                    h_code = address[0].h_code;
                }
            }

            // 협력업체 정보 출력
            let partner = await Partner.find({ salesable_area: { $in: [h_code] } });
            if (partner.length <= 0) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else {
                data = {
                    partner_idx: partner[0]._id,
                    img: partner[0].img,
                    name: partner[0].name,
                    address: partner[0].address,
                    tel_number: partner[0].tel_number,
                    operation_time: partner[0].operation_time,
                    closed: partner[0].closed,
                    representative: partner[0].representative,
                    business_name: partner[0].business_name,
                    introduction: partner[0].introduction
                };
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;