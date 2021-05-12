var express = require('express');
var router = express.Router({ mergeParams: true });
var mongoose = require('mongoose');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product_v2');
let Category = require('../../../../schemas/category_v2');

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

router.put('/batch_management', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        try {
            const { partner_idx } = req.params;
            let file = JSON.parse(req.body.file);
            if (!file) {
                res.status(201).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let false_row = [];
                let incorrect_rows = [];
                let all_clear = true;
                console.log("수정 예정 상품 수 : " + (file.length-2));
                for (let i = 2; i < file.length; i++) {
                    if(file[i].barcode == undefined || file[i].barcode == ""){
                        all_clear = false;
                        incorrect_rows.push(i+2);
                        continue;
                    }
                    let check_barcode = await Product.find({ barcode : file[i].barcode , partner_idx : partner_idx , one_hundred_deal_event : false });
                    if(check_barcode.length == 0){
                        all_clear = false;
                        false_row.push(i+2)
                    } else {
                        if(file[i].original_price != undefined && file[i].original_price != ""
                            && file[i].count != undefined && file[i].count != ""){

                            let original_price = Number(file[i].original_price);
                            let count = Number(file[i].count);
                            let update_product = 
                                await Product.updateOne({ barcode : file[i].barcode }, { $set: { original_price : original_price , count : count } });
                            console.log(update_product);

                        } else if((file[i].original_price != undefined && file[i].original_price != "")
                            && (file[i].count == undefined || file[i].count == "")){

                            let original_price = Number(file[i].original_price);
                            let update_product = 
                                await Product.updateOne({ barcode : file[i].barcode }, { $set: { original_price : original_price } });
                            console.log(update_product);

                        } else if((file[i].original_price == undefined || file[i].original_price == "")
                            && (file[i].count != undefined && file[i].count != "")){

                            let count = Number(file[i].count);
                            let update_product = 
                                await Product.updateOne({ barcode : file[i].barcode }, { $set: { count : count } });
                            console.log(update_product);

                        } else {
                            all_clear = false;
                            incorrect_rows.push(i+2);
                        }
                        
                    }
                }
                if(all_clear){
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                } else {
                    console.log("상품이 등록되지 않은 바코드 넘버 수 : " + false_row.length)
                    console.log(false_row)
                    console.log("입력이 올바르지 않은 행 수 : " + incorrect_rows.length)
                    console.log(incorrect_rows)
                    res.status(202).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                }
            }

        } catch (err) {
            console.log(err.message);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})
module.exports = router;