var express = require('express');
var router = express.Router();

var admin = require('firebase-admin');
var serviceAccount = require('../../../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Notification = require('../../../../schemas/notification');
let Product = require('../../../../schemas/product_v2');

// 주문 요청 승인 API
router.put('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        const order_request_approval_status = 200;
        const { order_id } = req.body;
        if (!order_id) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                console.log(order_id);
                for(let i = 0; i < order_id.length; i++){
                    /* DB에 저장될 시간 설정 */
                    // **** 서버에서 시간 확인 꼭 해야됨 ****
                    const current_time = Date.now() + (3600000 * 9); // mongodb insert time
                    

                    /* orders table update */

                    let update_orders_query = 'UPDATE orders SET status = ? WHERE order_id = ?';
                    let update_orders_result = await connection.query(update_orders_query, [order_request_approval_status, order_id]);
                    if (update_orders_result.affectedRows !== 1) throw new Error('update orders table error');

            
                    /* 유저에게 큐알림 보내기 */

                    // user_idx, 주문한 대표상품번호, 주문한 상품종류 갯수, fcm_token 출력
                    let get_info_query = `SELECT u.user_idx, o.product_id, o.count, u.fcm_token
                                        FROM users AS u
                                        JOIN (SELECT o.user_idx, o.order_id, g.product_id, g.count
                                                FROM orders AS o
                                                JOIN (SELECT order_id, product_id, COUNT(order_id) AS count
                                                    FROM orders_products
                                                    WHERE order_id = ?
                                                    GROUP BY order_id) AS g ON o.order_id = g.order_id) AS o ON u.user_idx = o.user_idx`
                    let get_info_result = await connection.query(get_info_query, [order_id]);
                    if (get_info_result.length < 1) throw new Error('get user_idx, order_info, fcm_token error');

                    // 대표상품 detail_name 출력
                    let product = await Product.find({ _id: get_info_result[0].product_id }).select({ detail_name: 1 });
                    if (product.length < 1) throw new Error('incorrect product_id');

                    // 변수로 저장
                    const user_idx = get_info_result[0].user_idx;
                    const q_notification_content = (get_info_result[0].count > 1) ? `${product[0].detail_name} 외 ${get_info_result[0].count - 1}개` : product[0].detail_name;
                    const fcm_token = get_info_result[0].fcm_token;
                    
                    // 큐알림 내용 설정
                    let user_message = { title: '안녕하세요 큐마켓입니다.', body: '마트로 주문 접수 되었습니다.' };
                    let q_notification = new Notification({
                        user_idx: user_idx, type: '큐마켓', name: '주문 및 포장이 시작되었습니다.', content: q_notification_content, created_at: current_time
                    });

                    // 유저에게 큐알림 보내기
                    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                    let message = { notification: user_message, token: fcm_token }
                    admin.messaging().send(message)
                    .then(response => { q_notification.save(); })
                    .catch(error => { throw new Error("FCM error"); })
                }
                
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));                    
            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
});

module.exports = router;