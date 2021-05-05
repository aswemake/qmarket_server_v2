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
                let update_price = 
                    await Product.updateOne({ _id: product_id }, 
                        {$set:{original_price:price}});

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