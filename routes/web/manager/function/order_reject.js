var express = require('express');
var router = express.Router();
var axios = require('axios');

var admin = require('firebase-admin');
var serviceAccount = require('../../../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Notification = require('../../../../schemas/notification');
let Product = require('../../../../schemas/product_v2');
let Coupon = require('../../../../schemas/coupon');
let Coupon_User = require('../../../../schemas/coupon_user');


// 주문 요청 거절 API
router.put('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        const order_request_rejection_status = 201;
        const { order_id } = req.body;
        console.log(order_id)
        if (!order_id) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                await connection.beginTransaction();
                
                for(let i = 0; i < order_id.length; i++){
                    /* DB에 저장될 시간 설정 */
                    // **** 서버에서 시간 확인 꼭 해야됨 ****
                    const current_time = Date.now() + (3600000 * 9); // mongodb insert time
                    const now = new Date(current_time);
                

                    /* 필요한 정보 출력 */

                    let get_order_query = 'SELECT order_id, imp_uid, payment, coupon_price, coupon_idx, qmoney, delivery_price, user_idx FROM orders WHERE order_id = ?';
                    let get_order_product_query = 'SELECT product_id, count FROM orders_products WHERE order_id = ?';
                    let get_fcm_token_query = 'SELECT fcm_token FROM users WHERE user_idx = ?';

                    let get_order_result = await connection.query(get_order_query, [order_id[i]]);
                    if (get_order_result.length < 1) throw new Error('incorrect order_id where get_order_query');
                    const order = get_order_result[0]; // order_id, imp_uid, payment, coupon_price, coupon_idx, qmoney, delivery_price, user_idx
                    const user_idx = get_order_result[0].user_idx; // user_idx

                    let get_order_product_result = await connection.query(get_order_product_query, [order_id[i]]);
                    if (get_order_product_result.length < 1) throw new Error('incorrect order_id where get_order_product_query');
                    const order_product = get_order_product_result; // product_id, count

                    let get_fcm_token_result = await connection.query(get_fcm_token_query, [user_idx]);
                    if (get_fcm_token_result.length < 1) throw new Error('incorrect user_idx');
                    const fcm_token = get_fcm_token_result[0].fcm_token; // fcm_token


                    /* 환불 */
        
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

                    // 아임포트 REST API로 결제환불 요청
                    const getCancelData = await axios({
                        url: "https://api.iamport.kr/payments/cancel",
                        method: "post", // POST method
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
                        },
                        data: {
                            imp_uid: order.imp_uid,
                            merchant_uid: order.order_id,
                            amount: order.payment,
                            checksum: order.payment,
                            reason: "주문요청거절"
                        }
                    });
                    const { response } = getCancelData.data; // 환불 결과
                    const { merchant_uid } = response; // 환불 결과에서 주문정보 추출
                    if (!merchant_uid) throw new Error("refund fail");


                    /* orders table update */

                    let update_orders_query = 'UPDATE orders SET status = ? WHERE order_id = ?';
                    let update_orders_result = await connection.query(update_orders_query, [order_request_rejection_status, order_id[i]]);
                    if (update_orders_result.affectedRows !== 1) throw new Error('update orders table error');


                    /* 쿠폰 동기화 */

                    let coupon_sale_price = 0;
                    // 쿠폰을 사용했을 경우
                    if (order.coupon_idx) {
                        // 쿠폰의 할인금액, 유효기간 출력
                        let coupon = await Coupon.find({ _id: order.coupon_idx }).select({ sale_price: 1, limit_date: 1 });
                        if (coupon.length < 1) throw new Error('incorrect coupon_idx');
                        const coupon_limit_date = coupon[0].limit_date;

                        // 사용된 쿠폰에서 제거
                        let delete_used_coupon_result = await Coupon_User.updateOne({ user_idx: user_idx },
                                                                                    { $pull: { used_coupon: { coupon_idx: order.coupon_idx } } });
                        if (delete_used_coupon_result.nModified != 1) throw new Error('delete used coupon error');
                        
                        // 쿠폰 유효기간이 남았을 경우
                        if (now.getTime() < coupon_limit_date.getTime()) {
                            // 사용 가능한 쿠폰에 추가
                            let available_coupon = { coupon_idx: order.coupon_idx, limit_date: coupon_limit_date };
                            let insert_available_coupon_result = await Coupon_User.updateOne({ user_idx: user_idx },
                                                                                            { $push: { coupon: available_coupon } });
                            if (insert_available_coupon_result.nModified != 1) throw new Error('insert avaiable coupon error');
                        }
                        // 쿠폰 유효기간이 끝났을 경우
                        else {
                            // 쿠폰 할인 금액만큼 큐머니 지급
                            coupon_sale_price = coupon[0].sale_price;
                        }
                    }


                    /* 큐머니 동기화 */

                    // 되돌려줘야 하는 큐머니 (사용큐머니 + 쿠폰할인금액)
                    // 쿠폰할인금액은 쿠폰사용안했거나 쿠폰사용했는데 유효기간 남았으면 0, 쿠폰사용했는데 유효기간 지났으면 쿠폰할인금액
                    let qmoney = -(order.qmoney) + coupon_sale_price;
                    let update_qmoney_query = 'UPDATE users SET qmoney = qmoney + ? WHERE user_idx = ?';
                    let update_qmoney_result = await connection.query(update_qmoney_query, [qmoney, user_idx]);
                    if (update_qmoney_result.affectedRows != 1) throw new Error('update qmoney error');

                    // 큐머니 사용 내역 저장
                    // 적립된 큐머니 환수
                    const refund_qmoney_content = '[큐마켓] 환불로 인한 큐머니 환수';
                    const refund_qmoney_content_when_coupon_expire = '[큐마켓] 환불로 인한 큐머니 보상';
                    let insert_qmoney_content_query = 'INSERT INTO qmoney (user_idx, money, content) VALUES (?, ?, ?)';
                    let insert_qmoney_content_result = await connection.query(insert_qmoney_content_query, [user_idx, -(order.qmoney), refund_qmoney_content]);
                    if (insert_qmoney_content_result.affectedRows != 1) throw new Error('insert refund qmoney content error');
                    // 쿠폰사용했는데 유효기간 지난 경우
                    if (coupon_sale_price > 0) {
                        // 쿠폰할인 금액만큼 큐머니 보상
                        let insert_qmoney_content_when_coupon_expire = await connection.query(insert_qmoney_content_query, [user_idx, coupon_sale_price, refund_qmoney_content_when_coupon_expire]);
                        if (insert_qmoney_content_when_coupon_expire.affectedRows != 1) throw new Error('insert refund qmoney content when coupon expire error');
                    }


                    /* 상품 수량 및 판매 횟수 동기화  */

                    // 상품 수량(count), 판매 횟수(saled_count) 동기화
                    for (let k = 0; k < order_product.length; k++) {
                        let update_product_count = await Product.updateOne({ _id: order_product[k].product_id }, 
                                                                        { $inc: { count: order_product[k].count, saled_count: -(order_product[k].count) } });
                    }


                    /* 유저에게 큐알림 보내기 */

                    // 대표상품 detail_name 출력
                    let product = await Product.find({ _id: order_product[0].product_id }).select({ detail_name: 1 });
                    if (product.length < 1) throw new Error('incorrect product_id');

                    // 변수로 저장
                    const q_notification_content = (order_product.length > 1) ? `${product[0].detail_name} 외 ${order_product.length - 1}개` : product[0].detail_name;
                    
                    // 큐알림 내용 설정
                    let user_message = { title: '안녕하세요 큐마켓입니다.', body: '고객님의 주문이 취소 되었습니다.' };
                    let q_notification = new Notification({
                        user_idx: user_idx, type: '큐마켓', name: '주문이 취소 되었습니다.', content: q_notification_content, created_at: current_time
                    });

                    // 유저에게 큐알림 보내기
                    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                    let message = { notification: user_message, token: fcm_token }
                    admin.messaging().send(message)
                    .then(response => { q_notification.save(); })
                    .catch(error => { throw new Error("FCM error"); })
                }

                /* 모든 작업 완료 */
                await connection.commit();
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));                    
            } catch (err) {
                await connection.rollback();
                console.log(err);
                if (err.message == "refund fail") return res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.REFUND_FAIL));
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
});

module.exports = router;
