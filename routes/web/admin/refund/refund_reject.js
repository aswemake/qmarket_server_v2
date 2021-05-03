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

// 환불 거절 함수
router.post('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        let { refund_id, order_id, content } = req.body;
        if (!refund_id || !order_id || !content) {
            res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                let user_query = 'SELECT user_idx FROM orders WHERE order_id = ?';
                let user_info = await connection.query(user_query, [order_id]);
                let user_idx = user_info[0].user_idx;

                //환불 완료 푸시 알림 전송
                // 알림 보낼 토큰 찾기
                let find_token = 'SELECT fcm_token FROM users WHERE user_idx = ?';
                let token = await connection.query(find_token, [user_idx]);
                
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                }
                if (token) {
                    let message = {
                        notification: {
                            title: '안녕하세요 큐마켓입니다.',
                            body: '요청하신 환불이 반려되었습니다.\n' + content
                        },
                        token: token[0].fcm_token
                    }
                    //해당 구문 실행시 디바이스로 메세지 전송
                    admin.messaging().send(message)
                        .then(response => {
                            console.log("응답")
                            console.log(response)
                            let notification = new Notification({
                                user_idx: user_idx,
                                type: '큐마켓',
                                name: '요청하신 환불이 반려되었습니다.\n' + content,
                                content: content,
                                created_at: Date.now() + (3600000 * 9)
                            })
                            notification.save();
                        })
                        .catch(error => {
                            console.log("오류")
                            console.log(error)
                        })
                }
                let query = 'SELECT is_all FROM refunds WHERE refund_id = ? AND order_id = ?';
                let check_is_all = await connection.query(query, [refund_id, order_id]);
                if(check_is_all[0].is_all == 0){//부분환불
                    let query1 = 'UPDATE refunds SET reject_reason = ?, status = 901 WHERE refund_id = ? AND order_id = ?';
                    let update_refund1 = await connection.query(query1, [content, refund_id, order_id]);
                    if (update_refund1.affectedRows === 1) {
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_REJECT));
                    } else {
                        res.status(400).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                    }
                } else {//전체환불
                    let query1 = 'UPDATE refunds SET reject_reason = ?, status = 911 WHERE refund_id = ? AND order_id = ?';
                    let update_refund1 = await connection.query(query1, [content, refund_id, order_id]);
                    if (update_refund1.affectedRows === 1) {
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_REJECT));
                    } else {
                        res.status(400).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                    }
                }
            } catch (err) {
                console.log(err);
                res.status(400).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})

module.exports = router;