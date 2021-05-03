var express = require('express');
var router = express.Router({ mergeParams: true });
var mongoose = require('mongoose');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

//스키마 참고해서 필요한거 더 추가
let Product = require('../../../../schemas/product_v2');

// 상품 가격변경, 수량변경, 삭제 API
router.put('/price', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { product_id , price } = req.body;
        console.log("product_id : " + product_id)
        console.log("price : " + price)
        if (!product_id || !price) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let default_sale_ratio = 0;
                if (0<=price && price<=999) default_sale_ratio = 0.083;
                else if (1000<=price && price<=2999) default_sale_ratio = 0.183;
                else if (3000<=price && price<=4999) default_sale_ratio = 0.158;
                else if (5000<=price && price<=9999) default_sale_ratio = 0.166;
                else if (10000<=price && price<=19999) default_sale_ratio = 0.166;
                else if (20000<=price && price<=49999) default_sale_ratio = 0.176;
                else if (50000<=price && price<=99999) default_sale_ratio = 0.166;
                else if (100000<=price && price<=299999) default_sale_ratio = 0.183;
                else if (300000<=price && price<=499999) default_sale_ratio = 0.233;
                else if (500000<=price) default_sale_ratio = 0.333
                // 가라 가격 설정
                let modifed_price = Math.floor(price / (1 - default_sale_ratio));
                modifed_price = (modifed_price - (modifed_price % 10)); // 1의 자리 제거
                let update_price = 
                    await Product.updateOne({ _id: product_id }, 
                        {$set:{original_price:price, price:modifed_price, default_sale_ratio:default_sale_ratio}});

                console.log(update_price);
                if (update_price.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }

            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})
router.put('/count', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { product_id , count } = req.body;
        console.log("product_id : " + product_id)
        console.log("count : " + count)
        if (!product_id || !count)  {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let update_count = 
                    await Product.updateOne({ _id: product_id }, { $set: { count: count } });
                console.log(update_count);
                if (update_count.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }

            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})
router.put('/enabled', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { product_id } = req.body;
        console.log("product_id : " + product_id)
        if (!product_id) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let update_enabled = 
                    await Product.updateOne({ _id: product_id }, { $set: { enabled: false } });
                console.log(update_enabled);
                if (update_enabled.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }

            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})
module.exports = router;