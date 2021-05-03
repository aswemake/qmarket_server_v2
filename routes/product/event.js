var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

const Product = require('../../schemas/product');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { product_idx } = req.query;
        var connection = await pool.getConnection();
        if (!product_idx || !user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let check = true;
                let query = 'SELECT order_id FROM orders_products WHERE product_id = ? AND user_idx = ? AND price <= 100 AND datediff(now(), created_at) < 30'
                let result = await connection.query(query, [product_idx, user_idx]);
                let product = await Product.find({ _id: product_idx }).select({ count: 1, is_event: 1 });

                console.log(product[0].is_event)
                // 이벤트 상품을 구매한 적이 없을 경우
                if(!result[0]){
                    console.log(result[0]);
                    check = false;
                } else if(!product[0].is_event){
                    check = false;
                }

                let data = {
                    purchased: check,
                    count: product[0].count
                }
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));

            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.NULL_PRODUCT));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})

module.exports = router;