var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product_v2');
let Partner = require('../../../../schemas/partner');

// 주문 요청 목록 리스트 조회 API
router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const order_request_status = 100;
        const order_request_approval_status = 200;
        const { partner_idx } = req.params;
        if (!partner_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                let data = new Object();
                data = { today_order_count: 0, orders: [] }
                let get_orders_query = `SELECT order_id, created_at AS order_date, payment, qmoney, delivery_price, receiver, phone, CONCAT(address, ' ', detail_address) AS address, delivery_memo, home_pwd, status
                                        FROM orders 
                                        WHERE partner_idx = ? AND status in (?, ?)
                                        ORDER BY created_at DESC`;
                let get_order_products_query = `SELECT product_id, price, count FROM orders_products WHERE order_id = ?`;
                let get_today_order_count_query = `SELECT COUNT(*) AS count 
                                                   FROM orders 
                                                   WHERE partner_idx = ? AND created_at >= ? AND created_at <= ?`

                let partner_info = await Partner.find({ _id: partner_idx }).select({ name: 1, address: 1, business_registration_number: 1 });
                if (partner_info.length < 1) throw new Error('incorrect partner_idx');

                // 해당 마트의 오늘 주문 갯수 구하기
                let now = new Date(Date.now() + (3600000 * 9));
                let year = now.getFullYear();
                let month = ("0" + (1 + now.getMonth())).slice(-2);
                let day = ("0" + now.getDate()).slice(-2);
                let start = `${year}-${month}-${day} 00:00:00`;
                let end = `${year}-${month}-${day} 23:59:59`;
                let get_today_order_count_result = await connection.query(get_today_order_count_query, [partner_idx, start, end]);
                data.today_order_count = get_today_order_count_result[0].count;

                // 해당 마트의 주문 요청, 승인 상태 주문들 구하기
                let orders = await connection.query(get_orders_query, [partner_idx, order_request_status, order_request_approval_status]);
                for (let i = 0; i < orders.length; i++) {
                    let order_products = await connection.query(get_order_products_query, [orders[i].order_id]);
                    let products = [];
                    let total_original_price = 0;
                    let total_saled_price = 0;
                    for (let j = 0; j < order_products.length; j++) {
                        let product_info = await Product.find({ _id: order_products[j].product_id }).select({ detail_name: 1, original_price: 1, events:1 });
                        if (product_info.length < 1) throw new Error('incorrect product_idx');
                        let product = {
                            name: product_info[0].detail_name,
                            original_price: (product_info[0].events.length == 0 ? product_info[0].original_price : product_info[0].events[product_info.events.length - 1].saled_price) * order_products[j].count, // 상품 실제 가격 (원래가격 * 수량)
                            saled_price: order_products[j].price, // 상품 결제 가격
                            count: order_products[j].count // 주문 수량
                        };
                        products.push(product);
                        total_original_price += (product_info[0].events.length == 0 ? product_info[0].original_price : product_info[0].events[product_info.events.length - 1].saled_price) * order_products[j].count;
                        total_saled_price += order_products[j].price;
                    }
                    let order = {
                        order_id: orders[i].order_id,
                        products: products,
                        qmoney: -(orders[i].qmoney), // 사용한 큐머니
                        delivery_price: orders[i].delivery_price, // 배송비
                        total_original_price: total_original_price, // 주문 상품 기존 가격의 합
                        total_saled_price: total_saled_price, // 주문 상품 할인 가격의 합
                        payment: orders[i].payment, // 실제 결제 금액
                        receiver: orders[i].receiver,
                        phone: orders[i].phone,
                        address: orders[i].address,
                        delivery_memo: orders[i].delivery_memo,
                        home_pwd: orders[i].home_pwd,
                        status: orders[i].status,
                        order_date: orders[i].order_date,
                        partner_idx: partner_idx,
                        partner_name: partner_info[0].name,
                        partner_address: partner_info[0].address,
                        partner_business_registration_number: partner_info[0].business_registration_number
                    };
                    data.orders.push(order);
                }
                res.render('manager/order_request', { data });
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
