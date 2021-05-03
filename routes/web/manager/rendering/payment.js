var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product_v2');

//payment_frame load api
router.get('/form', async (req, res) => {   
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { partner_idx } = req.params;
        if (!partner_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let data = { partner_idx: partner_idx };
                res.render('manager/payment_frame', { data });
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})

// 결제 내역 리스트 조회 API
// 환불 데이터 어떻게 출력할 것인지 생각하셈
router.get('/', async (req, res) => {   
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const default_count = 15;
        const order_status = {
            order_request: 100,
            order_request_approval: 200,
            order_request_rejection: 201,
            delivery_start: 300,
            delivery_finish: 400,
            purchase_confirmation: 500,
            partial_refund_request: 900,
            partial_refund_rejection: 901,
            partial_refund_approval: 902,
            total_refund_request: 910,
            total_refund_rejection: 911,
            total_refund_approval: 912
        }
        const { partner_idx } = req.params;
        const { page, s_status } = req.query;
        var status = parseInt(s_status);
        
        if (!partner_idx || !page) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            if (status) {
                if (status != order_status.order_request && status != order_status.order_request_approval && status != order_status.order_request_rejection && 
                    status != order_status.delivery_start && status != order_status.delivery_finish && status != order_status.purchase_confirmation && 
                    status != order_status.partial_refund_request && status != order_status.partial_refund_rejection && status != order_status.partial_refund_approval &&
                    status != order_status.total_refund_request && status != order_status.total_refund_rejection && status != order_status.total_refund_approval) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
                }
            }
            try {
                let option = { current_status: status };
                var connection = await pool.getConnection();
                // 서버에 올라가면 page datatype이 아마도 integer로 바뀔듯
                let data = { current_page_num: parseInt(page), last_page_num: 0, partner_idx: partner_idx, orders: [], option: option};
                let get_orders_query = `SELECT order_id, created_at AS order_date, receiver, phone, CONCAT(address, ' ', detail_address) AS address, delivery_memo, home_pwd, status, qmoney, coupon_price, delivery_price, payment
                                        FROM orders
                                        WHERE partner_idx = ?`;

                if (status) get_orders_query += ` AND status = ${status}`;
                get_orders_query += ` ORDER BY created_at DESC`;
                let get_order_products_query = `SELECT product_id, count, price FROM orders_products WHERE order_id = ?`;
                
                let orders = await connection.query(get_orders_query, [partner_idx]);
                
                let offset = (page - 1) * default_count;
                let count = (orders.length < offset + default_count) ? orders.length - offset : default_count;
                for (let i = offset; i < offset + count; i++) {
                    let order_products = await connection.query(get_order_products_query, [orders[i].order_id]);
                    let products = [];
                    for (let j = 0; j < order_products.length; j++) {
                        console.log(order_products.length)
                        let product_info = await Product.find({ _id: order_products[j].product_id }).select({ detail_name: 1 });
                        if (product_info.length < 1) throw new Error('incorrect product_idx');
                        let product = {
                            name: product_info[0].detail_name,
                            count: order_products[j].count,
			    price: order_products[j].price,
                        };
                        products.push(product);
                    }
                    let order = {
                        order_id: orders[i].order_id,
                        order_date: orders[i].order_date,
                        receiver: orders[i].receiver,
                        phone: orders[i].phone,
                        address: orders[i].address,
                        delivery_memo: orders[i].delivery_memo,
                        home_pwd: orders[i].home_pwd,
                        status: orders[i].status,
                        product: products,
			qmoney: orders[i].qmoney,
			coupon_price: orders[i].coupon_price,
			delivery_price: orders[i].delivery_price,
			payment: orders[i].payment,
                    }
                    data.orders.push(order);
                }
                data.last_page_num = (orders.length % default_count == 0) ? Math.floor(orders.length / default_count) : Math.floor(orders.length / default_count) + 1;
                console.log("last_page : ", data.last_page_num)
		res.render('manager/payment', { data });
            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})
module.exports = router;
