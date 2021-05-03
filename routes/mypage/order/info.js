var express = require('express');
var router = express.Router();
var axios = require('axios');

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');
const pool = require('../../../config/dbConfig');

const Product = require('../../../schemas/product');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { order_id } = req.query;
        var connection = await pool.getConnection();
        if (!user_idx || !order_id) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let query = 'SELECT * FROM orders WHERE order_id = ? AND user_idx = ?';
            let query2 = 'SELECT product_id, count, price FROM orders_products WHERE order_id = ? AND user_idx = ?';
            let result = await connection.query(query, [order_id, user_idx]);
            let result2 = await connection.query(query2, [order_id, user_idx]);
            if (!result[0] || !result2[0]) {
                console.log("잘못된 정보");
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
                    is_delivery: result[0].is_delivery,
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
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})
module.exports = router;