var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Product = require('../../schemas/product');
const Like = require('../../schemas/like');

router.get('/', async (req, res) => {
    try {
        let { product_idx } = req.query;
        if (!product_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var product = await Product.find({ _id: product_idx });
                if (!product[0]) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_PRODUCT));
                } else {
                    // 좋아요 개수 구하기
                    var like = await Like.find({ product_idx: product_idx }).countDocuments();
                    let count = 0;
                    let is_event = true;
                    var sale_ratio;
                    if(!product[0].is_event){
                        is_event = false;
                        count = product[0].count;
                        sale_ratio = product[0].sale_ratio
                    } else {
                        sale_ratio = product[0].event_sale_ratio
                    }
                    let product_data = {
                        img: product[0].img,
                        name: product[0].name,
                        detail_name: product[0].detail_name,
                        price: product[0].price,
                        sale_ratio: Math.floor(sale_ratio * 100),
                        saled_price: product[0].saled_price,
                        reward_money: Math.floor((product[0].price * 0.01)),
                        detail_img: product[0].detail_img,
                        shared_count: product[0].shared_count,
                        count: count,
                        is_adult: product[0].is_adult,
                        like: like,
                        is_event: is_event
                    }
                    console.log(product_data);
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, product_data));
                }
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.NULL_PRODUCT));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})


module.exports = router;