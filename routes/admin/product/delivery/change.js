var express = require('express');
var router = express.Router();

var admin = require('firebase-admin');
var serviceAccount = require('../../../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

const pool = require('../../../../config/dbConfig');

const Notification = require('../../../../schemas/notification');
const Product = require('../../../../schemas/product');

router.put('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        let { order_id } = req.query;
        let { is_delivery } = req.body;
        console.log(is_delivery);
        if (!order_id || !is_delivery) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                let query = 'UPDATE orders SET is_delivery = ? WHERE order_id = ?'
                let change = await connection.query(query, [is_delivery, order_id]);
                if (change.affectedRows === 1) {
                    let name;
                    // 배송완료 시간 저장하기
                    let query2 = 'UPDATE orders SET updated_at = ? WHERE order_id = ?'
                    // 주문자 고유 아이디 찾기
                    let query3 = 'SELECT user_idx FROM orders WHERE order_id = ?'
                    // 알림 보낼 토큰 찾기
                    let find_token = 'SELECT fcm_token FROM users WHERE user_idx = ?'
                    // 상품 이름 및 수량 파악
                    let query4 = 'SELECT product_id, COUNT(product_id) AS count FROM orders_products WHERE order_id = ?'
                    let result = await connection.query(query4, [order_id]);
                    let product = await Product.find({ _id: result[0].product_id }).select({ detail_name: 1 });
                    if (result[0].count > 1) {
                        name = product[0].detail_name + ' 외 ' + (result[0].count - 1) + '건';
                    } else {
                        name = product[0].detail_name
                    }
                    let delivery_time = await connection.query(query2, [new Date(), order_id]);
                    if (delivery_time.affectedRows === 1) {
                        console.log("배송완료 시간이 정상적으로 등록되었습니다.");
                    } else {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    }
                    if (is_delivery == 2) {
                        if (!admin.apps.length) {
                            admin.initializeApp({
                                credential: admin.credential.cert(serviceAccount),
                            });
                        }
                        let get_user = await connection.query(query3, [order_id]);
                        let get_Token = await connection.query(find_token, [get_user[0].user_idx]);
                        if (get_Token[0]) {
                            let message = {
                                notification: {
                                    title: '안녕하세요 큐마켓입니다.',
                                    body: '고객님께서 주문하신 상품이 배송을 시작했습니다.'
                                },
                                token: get_Token[0].fcm_token
                            }
                            // 해당 구문 실행시 디바이스로 메세지 전송
                            admin.messaging().send(message)
                                .then(response => {
                                    console.log("응답")
                                    console.log(response)
                                    let notification = new Notification({
                                        user_idx: get_user[0].user_idx,
                                        type: '큐마켓',
                                        name: '배송이 시작되었습니다.',
                                        content: name,
                                        created_at: Date.now() + (3600000 * 9)
                                    })
                                    notification.save();
                                })
                                .catch(error => {
                                    console.log("오류")
                                    console.log(error)
                                })
                        }
                    }
                    else if (is_delivery == 3) {
                        if (!admin.apps.length) {
                            admin.initializeApp({
                                credential: admin.credential.cert(serviceAccount),
                            });
                        }
                        let get_user = await connection.query(query3, [order_id]);
                        let get_Token = await connection.query(find_token, [get_user[0].user_idx]);
                        if (get_Token[0]) {
                            let message = {
                                notification: {
                                    title: '안녕하세요 큐마켓입니다.',
                                    body: '고객님께서 주문하신 상품이 정상적으로 배달되었습니다.'
                                },
                                token: get_Token[0].fcm_token
                            }
                            // 해당 구문 실행시 디바이스로 메세지 전송
                            admin.messaging().send(message)
                                .then(response => {
                                    console.log("응답")
                                    console.log(response)
                                    let notification = new Notification({
                                        user_idx: get_user[0].user_idx,
                                        type: '큐마켓',
                                        name: '배송이 완료되었습니다.',
                                        content: name,
                                        created_at: Date.now() + (3600000 * 9)
                                    })
                                    notification.save();
                                })
                                .catch(error => {
                                    console.log("오류")
                                    console.log(error)
                                })
                        }
                    }
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
            catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})
module.exports = router;