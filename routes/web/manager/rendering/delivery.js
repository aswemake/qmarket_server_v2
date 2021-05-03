var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product_v2');

// 배송 목록 리스트 조회 API
router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const default_count = 15;
        const order_request_approval_status = 200;
        const delivery_start_status = 300;
        const delivery_finish_status = 400;
        const { partner_idx } = req.params;
        const { page } = req.query;
        if (!partner_idx || !page) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else {
            try {
                var connection = await pool.getConnection();
                // 서버에 올라가면 page datatype이 아마도 integer로 바뀔듯
                let data = { current_page_num: parseInt(page), last_page_num: 0, partner_idx: partner_idx, order_requests: [] };
                let get_orders_query = `SELECT order_id, created_at AS order_date, receiver, phone, CONCAT(address, ' ', detail_address) AS address, delivery_memo, home_pwd, status
                                        FROM orders
                                        WHERE partner_idx = ? and status in (?, ?, ?)
                                        ORDER BY created_at DESC`;
                let get_order_products_query = `SELECT product_id, count FROM orders_products WHERE order_id = ?`;
                
                let orders = await connection.query(get_orders_query, [partner_idx, order_request_approval_status, delivery_start_status, delivery_finish_status]);
                
                // offset, count 설정
                let offset = (page - 1) * default_count;
                let count = (orders.length < offset + default_count) ? orders.length - offset : default_count;
                for (let i = offset; i < offset + count; i++) {
                    let order_products = await connection.query(get_order_products_query, [orders[i].order_id]);
                    let products = [];
                    for (let j = 0; j < order_products.length; j++) {
                        let product_info = await Product.find({ _id: order_products[j].product_id }).select({ detail_name: 1 });
                        if (product_info.length < 1) throw new Error('incorrect product_idx');
                        let product = {
                            name: product_info[0].detail_name,
                            count: order_products[j].count
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
                        product: products
                    }
                    data.order_requests.push(order);
                }
                console.log(data.order_requests.length)
                data.last_page_num = (orders.length % default_count == 0) ? Math.floor(orders.length / default_count) : Math.floor(orders.length / default_count) + 1;
                res.render('manager/delivery', { data });
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})
module.exports = router;