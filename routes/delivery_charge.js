var express = require('express');
var router = express.Router();

const utils = require('../module/response/utils');
const resMessage = require('../module/response/responseMessage');
const statusCode = require('../module/response/statusCode');


// 상품 리스트 조회 API
router.get('/', async (req, res) => {
    let { product_price } = req.query;
    if(!product_price) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
    } else {
        try {
            let delivery_charge_text = [
                "0원 이상 3000원 미만----------[3,500원]",
                "3000원 이상 6000원 미만-----[3,000원]",
                "6000원 이상 9900원 미만-----[2,500원]",
                "9900원 이상-------------------------[무료]"
            ]
            let delivery_charge = 0;
            let price = parseInt(product_price);
            if(price >= 9900) delivery_charge = 0;
            else if(price < 9900 && price >= 6000) delivery_charge = 2500;
            else if(price < 6000 && price >= 3000) delivery_charge = 3000;
            else if(price < 3000 && price > 0) delivery_charge = 3500;
            let data = {
                delivery_charge:delivery_charge,
                delivery_charge_text:delivery_charge_text
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (error) {
            console.log(error);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;