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
                { $unwind: '$delivery_charge' },
                { $project: { _id: 1, delivery_charge: 1 } },
                { $match: { 'delivery_charge.h_code': { $in: [h_code] } } },
            ]);
            if (partner.length <= 0) throw new Error("incorrect partner_idx or h_code");
            
            // 정보 저장
            const minimum_order_price = partner[0].delivery_charge.minimum_order_price;
            const free_delivery_price = partner[0].delivery_charge.free_delivery_price
            // let delivery_charge_range = [];
            // for (let i = 0; i < partner[0].delivery_charge.range.length - 1; i++) {
            //     let delivery_charge_range_info = {
            //         start_price: partner[0].delivery_charge.range[i].start_price,
            //         end_price: partner[0].delivery_charge.range[i].end_price + 1,
            //         delivery_price: (partner[0].delivery_charge.range[i].delivery_price) ? partner[0].delivery_charge.range[i].delivery_price : '무료'
            //     }
            //     delivery_charge_range.push(delivery_charge_range_info);
            // }

            let delivery_charge_text = "";
            for (let i = 0; i < partner[0].delivery_charge.range.length; i++) {
                let start_price_text = `${partner[0].delivery_charge.range[i].start_price}원 이상`;
                let end_price_plue_one_text = (partner[0].delivery_charge.range[i].end_price) ? `${partner[0].delivery_charge.range[i].end_price + 1}원 미만` : '';
                let delivery_price = (partner[0].delivery_charge.range[i].delivery_price) ? partner[0].delivery_charge.range[i].delivery_price : '무료';
                let text = `${start_price_text} ${end_price_plue_one_text} -- [${delivery_price}]\n`;
                delivery_charge_text += text;
            }

            
            // total_price 입력되었을 경우 data.delivery_charge에 배송비 결과 출력
            if (total_price) {
                for (let i = 0; i < partner[0].delivery_charge.range.length; i++) {
                    let start_price = partner[0].delivery_charge.range[i].start_price;
                    let end_price_plue_one = (partner[0].delivery_charge.range[i].end_price) ? partner[0].delivery_charge.range[i].end_price + 1 : 999999999;
                    let delivery_price = partner[0].delivery_charge.range[i].delivery_price;
                    if (start_price <= total_price && total_price < end_price_plue_one) {
                        delivery_charge = delivery_price;
                        break;
                    }
                }
            }
            
            data = {
                minimum_order_price: minimum_order_price,
                free_delivery_price: free_delivery_price,
                // delivery_charge_range: delivery_charge_range,
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
