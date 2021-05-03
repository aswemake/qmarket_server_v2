var express = require('express');
var router = express.Router();

var admin = require('firebase-admin');
var serviceAccount = require('../../../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

const pool = require('../../../../config/dbConfig');
const axios = require('axios');

const Notification = require('../../../../schemas/notification');
const Product = require('../../../../schemas/product');

router.post('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        let { order_id, content } = req.body;
        if (!order_id || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                await connection.beginTransaction();

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

                // 결제정보 조회
                let query = 'SELECT order_id, payment, user_idx, qmoney FROM orders WHERE order_id = ?'
                let query2 = 'SELECT * FROM orders_products WHERE order_id = ?'

                let order_info = await connection.query(query, [order_id]);
                let product_info = await connection.query(query2, [order_id]);

                // 아임포트 REST API로 결제환불 요청
                const getCancelData = await axios({
                    url: "https://api.iamport.kr/payments/cancel",
                    method: "post", // POST method
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
                    },
                    data: {
                        reason: content,
                        merchant_uid: order_id,
                        amount: order_info[0].payment
                    }
                });

                const { response } = getCancelData.data; // 환불 결과
                const { merchant_uid } = response; // 환불 결과에서 주문정보 추출
                if (!merchant_uid) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.REFUND_FAIL));
                } else {
                    let minus_qmoney = '[큐마켓] 환불로 인한 큐머니 차감'
                    let plus_qmoney = '[큐마켓] 환불로 인한 큐머니 복구'
                    let reward_money = Math.floor(order_info[0].payment * 0.01);

                    try {
                        let delete_order_query = 'DELETE FROM orders WHERE order_id = ?'
                        let delete_product_query = 'DELETE FROM orders_products WHERE order_id = ?'
                        let insert_refund_query = 'INSERT INTO refunds (order_id, user_idx, content, price, is_refund) '
                            + 'VALUES (?, ?, ?, ?, 3) ';
                        let insert_refund_product_query = 'INSERT INTO refunds_products (order_id, product_id, count, price) '
                            + 'VALUES (?, ?, ?, ?) ';
                        let insert_qmoney_query = 'INSERT INTO qmoney (user_idx, money, content) VALUES (?, ?, ?)'
                        let update_qmoney_query = 'UPDATE users SET qmoney = qmoney + ? WHERE user_idx = ?'

                        let delete_product = await connection.query(delete_product_query, [merchant_uid]);
                        let delete_order = await connection.query(delete_order_query, [merchant_uid]);
                        let insert_refund = await connection.query(insert_refund_query, [merchant_uid, order_info[0].user_idx, content, order_info[0].payment]);
                        for (let i = 0; i < product_info.length; i++) {
                            let insert_refund_product = await connection.query(insert_refund_product_query, [merchant_uid, product_info[i].product_id, product_info[i].count, product_info[i].price]);
                            // 상품 수량 복구
                            let plus_count = await Product.updateOne({ _id: product_info[i].product_id }, { $inc: { count: product_info[i].count } })
                            if (plus_count.nModified == 1) {
                                console.log(`상품 수량이 ${product_info[i].count}만큼 증가했습니다`);
                            }
                        }
                        let insert_qmoney = await connection.query(insert_qmoney_query, [order_info[0].user_idx, -(reward_money), minus_qmoney]);
                        if (order_info[0].qmoney !== 0) {
                            let refund_qmoney = await connection.query(insert_qmoney_query, [order_info[0].user_idx, order_info[0].qmoney, plus_qmoney])
                        }
                        let update_qmoney = await connection.query(update_qmoney_query, [-(reward_money) + order_info[0].qmoney, order_info[0].user_idx]);
                        await connection.commit();
                        console.log("환불 성공-complete");

                        // 알림 보낼 토큰 찾기
                        let find_token = 'SELECT fcm_token FROM users WHERE user_idx = ?'
                        let get_Token = await connection.query(find_token, [order_info[0].user_idx]);
                        // 파이어베이스 초기화
                        if (!admin.apps.length) {
                            admin.initializeApp({
                                credential: admin.credential.cert(serviceAccount),
                            });
                        }
                        // 큐알림 발송 및 저장
                        if (get_Token[0]) {
                            let message = {
                                notification: {
                                    title: '안녕하세요 큐마켓입니다.',
                                    body: '환불이 정상적으로 완료되었습니다.'
                                },
                                token: get_Token[0].fcm_token
                            }
                            // 해당 구문 실행시 디바이스로 메세지 전송
                            admin.messaging().send(message)
                                .then(response => {
                                    console.log("응답")
                                    console.log(response)
                                    let notification = new Notification({
                                        user_idx: order_info[0].user_idx,
                                        type: '큐마켓',
                                        name: '환불이 완료되었습니다.',
                                        content: ' ',
                                        created_at: Date.now() + (3600000 * 9)
                                    })
                                    notification.save();
                                })
                                .catch(error => {
                                    console.log("오류")
                                    console.log(error)
                                })
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_SUCCESS));
                    } catch (err) {
                        console.log(err);
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.REFUND_FAIL));
                    }
                }
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