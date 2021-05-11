var express = require('express');
var router = express.Router({ mergeParams: true });
const mongoose = require('mongoose');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Address = require('../../schemas/address_matching');
const Partner = require('../../schemas/partner');

// 마트 별 배송비 조회 및 가격 별 배송비 조회 API
router.get('/', async (req, res) => {
    const { partner_idx } = req.params;
    let { b_code, h_code, total_price } = req.query;
    if ((!b_code && !h_code) || (b_code && h_code)) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = new Object();
            let delivery_charge = -1;

            // b_code(법정동코드)가 입력된 경우에 h_code(행정동코드)로 변환
            if (b_code) {
                let address = await Address.find({ b_code: b_code });
                if (address.length <= 0) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
                } else {
                    h_code = address[0].h_code;
                }
            }

            // 마트, h_code 별 배송비 정보 출력
            let partner = await Partner.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(partner_idx) } },
                { $unwind: '$delivery.charge' },
                { $project: { _id: 1, delivery: 1 } },
                { $match: { 'delivery.charge.h_code': { $in: [h_code] } } }
            ]);
            if (partner.length <= 0) throw new Error("incorrect partner_idx or h_code");
            
            // 정보 저장
            const minimum_order_price = partner[0].delivery.charge.minimum_order_price;
            const free_delivery_price = partner[0].delivery.charge.free_delivery_price;
            const delivery_charge_when_under_minimum_order_price = partner[0].delivery.charge.delivery_charge;
            
            // 상품 상세 정보 배송비 안내
            let delivery_charge_text = `최소 주문금액: ${minimum_order_price}원\n배송비: ${free_delivery_price}원\n무료 배송: ${delivery_charge_when_under_minimum_order_price}원 이상\n(*배송지역마다 배송비가 상이합니다.)`;
            
            // total_price 입력되었을 경우 data.delivery_charge에 배송비 결과 출력
            if (total_price) {
                // 1. total_price가 minimum_order_price 보다 작으면 배송불가 (data.delivery_charge = -1 유지)

                // 2. total_price가 minimum_order_price 보다 크거나 같고 free_delivery_price 보다 작으면 devliery_charge로 update
                if (total_price >= minimum_order_price && total_price < free_delivery_price)
                    delivery_charge = delivery_charge_when_under_minimum_order_price;

                // 3. total_price가 free_delivery_price보다 크면 무료 배송
                if (total_price >= free_delivery_price) 
                    delivery_charge = 0;
            }
            
            data = {
                minimum_order_price: minimum_order_price,
                free_delivery_price: free_delivery_price,
                delivery_charge_text: delivery_charge_text, // text 내용 디자인에 맞춰서 수정해야됨
                delivery_charge: delivery_charge
            };
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err.message);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;
