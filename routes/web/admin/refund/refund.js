var express = require('express');
var router = express.Router();

var admin = require('firebase-admin');
var serviceAccount = require('../../../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');
var axios = require('axios');

const Notification = require('../../../../schemas/notification');
const Product = require('../../../../schemas/product_v2');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        try {
            var connection = await pool.getConnection();
            let data = [];
            let refund_query = 'SELECT * FROM refunds ORDER BY created_at DESC';
            let refund_product_query = 'SELECT * FROM refunds_products WHERE refund_id = ?';
            let order_query = 'SELECT receiver FROM orders WHERE order_id = ?';
            let refund = await connection.query(refund_query);

            for (let i = 0; i < refund.length; i++) {
                let product_arr = new Array();
                let refund_product = await connection.query(refund_product_query, [refund[i].refund_id]);
                let get_name = await connection.query(order_query, [refund[i].order_id]);
                let refund_data = {
                    refund_id: refund[i].refund_id,
                    order_id: refund[i].order_id,
                    refunder: get_name[0].receiver,
                    content: refund[i].content,
                    file: refund[i].file,
                    amount: refund[i].amount,
                    is_all: refund[i].is_all,
                    product: product_arr,
                    status: refund[i].status,
                    refund_date: refund[i].created_at
                }
                for (let j = 0; j < refund_product.length; j++) {
                    let product = await Product.find({ _id: refund_product[j].product_id }).select({ detail_name: 1 });
                    let product_data = {
                        product_name: product[0].detail_name,
                        count: refund_product[j].count,
                        price: refund_product[j].price
                    }
                    product_arr.push(product_data);
                }
                data.push(refund_data);
            }
            console.log(data);
            res.render('admin/product_refund', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;