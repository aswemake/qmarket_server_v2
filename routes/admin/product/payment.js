var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');

const pool = require('../../../config/dbConfig');

let Product = require('../../../schemas/product');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../start');
    } else {
        try {
            var connection = await pool.getConnection();
            let query = "SELECT order_id, receiver, delivery_price, coupon_price, qmoney, payment, created_at FROM orders ORDER BY created_at DESC";
            let query2 = "SELECT * FROM orders_products WHERE order_id = ?";
            let data = [];
            let get_user = await connection.query(query);
            for (let i = 0; i < get_user.length; i++) {
                let product_arr = new Array();
                let get_order = await connection.query(query2, [get_user[i].order_id]);
                let order_data = {
                    order_id: get_user[i].order_id,
                    receiver: get_user[i].receiver,
                    coupon_price: get_user[i].coupon_price,
                    qmoney: get_user[i].qmoney,
                    delivery_price: get_user[i].delivery_price,
                    price: get_user[i].payment,
                    created_at: get_user[i].created_at,
                    product: product_arr
                }
                for (let j = 0; j < get_order.length; j++) {
                    let product = await Product.find({ _id: get_order[j].product_id }).select({ detail_name: 1 });
                    let product_data = {
                        product_name: product[0].detail_name,
                        count: get_order[j].count,
                        price: get_order[j].price
                    }
                    product_arr.push(product_data);
                }
                data.push(order_data);
                console.log(data);
            }
            res.render('product_payment', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;
