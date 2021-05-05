var express = require('express');
var router = express.Router({ mergeParams: true });
const mongoose = require('mongoose');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Address = require('../../schemas/address_matching');
const Partner = require('../../schemas/partner');

// 마트 별 배송정보 조회 API
router.get('/', async (req, res) => {
    const { partner_idx } = req.params;
    try {
        let data = "";
        let partner = await Partner.find({ _id: partner_idx }).select({ delivery: 1 });
        if (partner.length < 1) {
            console.log(partner.length);
            return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        let delivery_info = partner[0].delivery.info;
        data = delivery_info;
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
    } catch (err) {
        console.log(err.message);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;
