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
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            let query = 'SELECT order_id, product_id, created_at, COUNT(*) AS count FROM orders_products '
                + 'WHERE user_idx = ? GROUP BY order_id ORDER BY created_at DESC ';
            let query2 = 'SELECT is_delivery FROM orders WHERE order_id = ?';
            let result = await connection.query(query, [user_idx]);
            let product_arr = [];
            if (!result) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.NULL_ORDER, product_arr));
            } else {
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

                for (let i = 0; i < result.length; i++) {
                    let product_data = new Object();
                    let name;

                    // 배송 여부 조회
                    let is_delivery = await connection.query(query2, [result[i].order_id]);
                    // merchant_uid로 아임포트 서버에서 결제 정보 조회
                    const getPaymentData = await axios({
                        url: `https://api.iamport.kr/payments/find/${result[i].order_id}`, // imp_uid 전달
                        method: "get", // GET method
                        headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
                    });
                    const paymentData = getPaymentData.data.response.amount; // 조회한 결제 정보
                    console.log(paymentData);

                    let product = await Product.find({ _id: result[i].product_id });
                    if (result[i].count > 1) {
                        name = product[0].detail_name + ' 외 ' + (result[i].count - 1) + '개';
                    } else {
                        name = product[0].detail_name
                    }
                    product_data = {
                        order_id: result[i].order_id,
                        order_date: result[i].created_at,
                        main_img: product[0].img[0],
                        name: name,
                        price: paymentData,
                        is_delivery: is_delivery[0].is_delivery
                    }
                    product_arr.push(product_data);
                }
                console.log(product_arr);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, product_arr));
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
