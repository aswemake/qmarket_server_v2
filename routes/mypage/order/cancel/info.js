var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const jwt = require('../../../../module/jwt');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { refund_id, order_id } = req.query;
        if (!user_idx || !refund_id || !order_id) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                let query = 'SELECT * FROM refunds WHERE refund_id = ?';
                let query2 = 'SELECT receiver, pay_method, payment, delivery_price, coupon_price, qmoney, created_at FROM orders WHERE order_id = ?';
                let query3 = 'SELECT * FROM refunds_products WHERE refund_id = ? AND order_id = ?';

                let refund = await connection.query(query, [refund_id]);
                let order_info = await connection.query(query2, [order_id]);
                if (!refund[0] || !order_info[0]) {
                    res.status(200).json(utils.successFalse(statusCode.NOT_FOUND, resMessage.READ_FAIL));
                } else {
                    let refund_data = new Object();
                    let product_arr = [];

                    // 환불 상품 찾기
                    let find_product = await connection.query(query3, [refund_id, order_id]);
                    for (let i = 0; i < find_product.length; i++) {
                        let product_data = new Object();
                        let product = await Product.find({ _id: find_product[i].product_id });
                        product_data = {
                            product_idx: product[0]._id,
                            main_img: product[0].img[0],
                            name: product[0].name,
                            detail_name: product[0].detail_name,
                            price: find_product[i].price,
                            count: find_product[i].count
                        }
                        product_arr.push(product_data);
                    }

                    // 환불 상태에 따른 데이터 처리
                    switch(refund[0].is_refund){
                        case 2:
                            refund_data = {
                                price: refund[0].price,
                                delivery_price: refund[0].delivery_price,
                                coupon: refund[0].coupon_price,
                                qmoney: refund[0].qmoney
                            }
                            break;
                        case 3:
                            refund_data = {
                                reject_reason: refund[0].reject_reason
                            }
                            break;
                        default:
                            break;
                    }

                    let data = {
                        product: product_arr,
                        receiver: order_info[0].receiver,
                        pay_method: order_info[0].pay_method,
                        coupon_price: order_info[0].coupon_price,
                        delivery_price: order_info[0].delivery_price,
                        qmoney: order_info[0].qmoney,
                        content: refund[0].content,
                        file: refund[0].file,
                        is_refund: refund[0].is_refund,
                        refund: refund_data,
                        is_all:refund[0].is_all
                    };
                    console.log(data);
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
                }
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;