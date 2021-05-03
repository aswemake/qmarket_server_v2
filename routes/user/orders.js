var express = require('express');
var router = express.Router();
var axios = require('axios');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

const Product = require('../../schemas/product_v2');

// 유저 주문 리스트 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
	res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST,
		resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let data = [];
            
            let get_order_info_query = `SELECT o.order_id, o.created_at, o.payment, o.status, g.product_id, g.count
                                        FROM orders AS o
                                        JOIN (SELECT order_id, product_id, COUNT(order_id) AS count
                                              FROM orders_products
                                              WHERE user_idx = ?
                                              GROUP BY order_id) AS g ON o.order_id = g.order_id
                                        ORDER BY o.created_at DESC`
            let orders = await connection.query(get_order_info_query, [user_idx]);
            if (!orders) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.NULL_ORDER, data));
            } else {
                for (let i = 0; i < orders.length; i++) {
                    let product = await Product.find({ _id: orders[i].product_id }).select({ img: 1, detail_name: 1 });
                    let order = {
                        order_id: orders[i].order_id,
                        order_date: orders[i].created_at,
                        main_img: product[0].img[0],
                        name: (orders[i].count > 1) ? `${product[0].detail_name} 외 ${orders[i].count - 1}개` : product[0].detail_name,
                        price: orders[i].payment,
                        status: orders[i].status
                    }
		    console.log(orders[i].created_at);
                    data.push(order);
                }
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 유저 주문 상세 조회 API
router.get('/:order_id', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { order_id } = req.params;
    if (!user_idx || !order_id) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let query = 'SELECT * FROM orders WHERE order_id = ? AND user_idx = ?';
            let query2 = 'SELECT product_id, count, price FROM orders_products WHERE order_id = ? AND user_idx = ?';
            let result = await connection.query(query, [order_id, user_idx]);
            let result2 = await connection.query(query2, [order_id, user_idx]);
            if (!result[0] || !result2[0]) {
                console.log("잘못된 정보");
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else {
                let product_arr = [];
                let price = 0;
                for (let i = 0; i < result2.length; i++) {
                    let product_data = new Object();
                    let product = await Product.find({ _id: result2[i].product_id });
                    product_data = {
                        product_idx: result2[i].product_id,
                        main_img: product[0].img[0],
                        name: product[0].name,
                        detail_name: product[0].detail_name,
                        price: result2[i].price,
                        count: result2[i].count
                    }
                    price = price + result2[i].price;
                    product_arr.push(product_data);
                }
                // 액세스 토큰(access token) 발급 받기
                const getToken = await axios({
                    url: "https://api.iamport.kr/users/getToken",
                    method: "post", // POST method
                    headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
                    data: {
                        imp_key: process.env.IMP_KEY, // REST API키
                        imp_secret: process.env.IMP_SECRET // REST API Secret
                    }
                });
                const { access_token } = getToken.data.response; // 인증 토큰
                console.log("access_token : " + access_token);

                // merchant_uid로 아임포트 서버에서 결제 정보 조회
                const getPaymentData = await axios({
                    url: `https://api.iamport.kr/payments/find/${order_id}`, // imp_uid 전달
                    method: "get", // GET method
                    headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
                });
                const paymentData = getPaymentData.data.response; // 조회한 결제 정보

                let data = {
                    order_id: order_id,
                    buyer_name: paymentData.buyer_name,
                    order_date: result[0].created_at,
                    order_product: product_arr,
                    status: result[0].status,
                    price: price,
                    delivery_price: result[0].delivery_price,
                    coupon_price: result[0].coupon_price,
                    qmoney: result[0].qmoney,
                    amount: paymentData.amount,
                    pay_method: result[0].pay_method,
                    buyer_info: {
                        receiver: result[0].receiver,
                        phone: result[0].phone,
                        mail_number: result[0].mail_number,
                        address: result[0].address,
                        detail_address: result[0].detail_address,
                        delivery_memo: result[0].delivery_memo
                    }
                }
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 유저 구매 확정 API
router.put('/:order_id/purchase-confirmation', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { order_id } = req.params;
    if (!user_idx || !order_id) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            const purchase_confirmation_status_code = 500;
            var connection = await pool.getConnection();
            
            let update_is_delivery_query = `UPDATE orders SET status = ? WHERE order_id = ? and user_idx = ?`;
            let update_is_delivery_result = await connection.query(update_is_delivery_query, [purchase_confirmation_status_code, order_id, user_idx]);
            if (update_is_delivery_result.affectedRows !== 1) throw new Error("update orders table status error");
            
            res.status(200).json(utils.successFalse(statusCode.OK, resMessage.UPDATE_SUCCESS));
        } catch (err) {
            console.log(`app - /user/:order_id/purchase-confirmation API error message: ${err.message}`);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})



module.exports = router;
