var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

const pool = require('../../../../config/dbConfig');

const Product = require('../../../../schemas/product');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            var connection = await pool.getConnection();
            // 배달대기, 배달중 정렬
            let wait_query = 'SELECT * FROM orders WHERE is_paid = 1 AND is_delivery IN(1,2) ORDER BY created_at ASC';
            // 배달완료, 구매확정 정렬
            let finish_query = 'SELECT * FROM orders WHERE is_paid = 1 AND is_delivery IN(3,4,5) ORDER BY created_at DESC';
            let query = 'SELECT product_id, count FROM orders_products WHERE order_id = ? AND user_idx = ?';

            // 환불여부 검사 쿼리
            let refund_query = 'SELECT refund_id FROM refunds WHERE order_id = ? AND is_refund = 2';
            let refund_product_query = 'SELECT * FROM refunds_products WHERE order_id = ? AND product_id = ?';

            let get_wait_order = await connection.query(wait_query);
            let get_finish_order = await connection.query(finish_query);
            let order_arr = get_wait_order.concat(get_finish_order);
            let data = [];
            for (let i = 0; i < order_arr.length; i++) {
                let is_refund = false;
                // 환불여부 검사
                let refund = await connection.query(refund_query,[order_arr[i].order_id]);
                // 주문 건에 대해 환불한 상품이 있을 경우
                if(refund[0]){
                    is_refund = true;
                }
                let product_arr = [];
                let order_info = new Object();
                let get_product = await connection.query(query, [order_arr[i].order_id, order_arr[i].user_idx]);
                for (let j = 0; j < get_product.length; j++) {
                    var product_info = new Object();
                    let get_name = await Product.find({ _id: get_product[j].product_id }).select({ detail_name: 1 });
                    product_info = {
                        name: get_name[0].detail_name,
                        count: get_product[j].count,
                        is_refund: false
                    }
                    if(is_refund == true){
                        let check = await connection.query(refund_product_query, [order_arr[i].order_id, get_product[j].product_id]);
                        if(check[0]){
                            product_info.is_refund = true;
                        }
                    }
                    product_arr.push(product_info);
                }
                order_info = {
                    order_id: order_arr[i].order_id,
                    order_date: order_arr[i].created_at,
                    receiver: order_arr[i].receiver,
                    phone: order_arr[i].phone,
                    address: (order_arr[i].address + ' ' + order_arr[i].detail_address),
                    delivery_memo: order_arr[i].delivery_memo,
                    home_pwd: order_arr[i].home_pwd,
                    is_delivery: order_arr[i].is_delivery,
                    product: product_arr
                }
                data.push(order_info);
            }
            res.render('delivery', { data })
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;