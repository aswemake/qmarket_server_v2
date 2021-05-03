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

router.post('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        let { refund_id, order_id } = req.body;
        if (!refund_id || !order_id) {
            res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                console.log(`refund_id = ${refund_id}`);
                console.log(`order_id = ${order_id}`);
                var connection = await pool.getConnection();
                // 결제 테이블
                let order_query = 'SELECT payment, qmoney, coupon_idx, coupon_price, delivery_price, user_idx FROM orders WHERE order_id = ?';
                let order_info = await connection.query(order_query, [order_id]);

                // 환불 테이블
                let get_refund_query = 'SELECT * FROM refunds WHERE refund_id = ? AND order_id = ? AND (status = 900 OR status = 910)';
                let get_refund = await connection.query(get_refund_query, [refund_id, order_id]);

                if (!order_info[0] || !get_refund[0]) {
                    res.status(204).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.NULL_ORDER));
                } else {
                    let total_price = order_info[0].payment;    // 주문 시 사용자가 실제 결제한 금액
                    console.log(`total_price :${total_price}`);
                    let refund_price = get_refund[0].amount;    // 사용자 환불요청금액
                    console.log(`refund_price: ${refund_price}`);
                    let user_idx = order_info[0].user_idx;  // 사용자 고유id
                    console.log(`user_idx: ${user_idx}`);
                    let qmoney = -(order_info[0].qmoney);   // 주문 시 사용한 큐머니
                    console.log(`qmoney:${qmoney}`);
                    let coupon_check = true;    // 쿠폰 환급 여부
                    let current_time = new Date(Date.now() + (3600000 * 9));    // 현재 시간

                    // 상품 수량 파악 쿼리
                    let get_product_query = 'SELECT product_id, count FROM refunds_products WHERE refund_id = ? AND order_id = ?';
                    let get_product = await connection.query(get_product_query, [refund_id, order_id]);
                    console.log(`get_product : ${get_product}`);

                    let product_arr = [];   // 환불 상품 고유 id 및 수량 담을 배열

                    for (let i = 0; i < get_product.length; i++) {
                        let product_data = new Object();
                        product_data = {
                            id: get_product[i].product_id,  // 환불 상품 고유 번호
                            count: get_product[i].count // 환불 상품 수량
                        }
                        product_arr.push(product_data);
                    }
                    console.log("product_arr",product_arr);
                    // 상품 수량 복구 함수
                    let plus_product_count = async () => {
                        for (let i = 0; i < product_arr.length; i++) {
                            let plus_count = await Product.updateOne({ _id: product_arr[i].id }, { $inc: { count: product_arr[i].count } })
                            if (plus_count.nModified == 1) {
                                console.log(`상품 수량이 `+ product_arr[i].count + `만큼 증가했습니다`);
                            }
                        }
                    }
                    // 큐머니 환불 쿼리
                    let insert_qmoney_query = 'INSERT INTO qmoney (user_idx, money, content) VALUES (?, ?, ?)'
                    let update_qmoney_query = 'UPDATE users SET qmoney = qmoney + ? WHERE user_idx = ?'
                    let plus_qmoney = '[큐마켓] 환불로 인한 큐머니 보상'
                    
                    // 큐머니 환수 쿼리
                    let minus_qmoney = '[큐마켓] 환불로 인한 큐머니 환수'

                    // 환불테이블 업데이트 쿼리
                    let refund_coupon_query = 'UPDATE refunds SET coupon_price = ?, coupon_idx = ?, status = ? WHERE refund_id = ?'
                    let refund_qmoney_query = 'UPDATE refunds SET qmoney = ?, status = ? WHERE refund_id = ?'
                    let refund_price_query = 'UPDATE refunds SET price = ?, qmoney = ?, delivery_price = ?, status = ? WHERE refund_id = ?'

                    // 환불여부 검사
                    let check_refund_query = 'SELECT price, qmoney, coupon_idx FROM refunds WHERE order_id = ? AND (status = 902 OR status = 912)';
                    let check_refund = await connection.query(check_refund_query, [order_id]);
                    console.log(`check_refund:${check_refund}`);

                    // 같은 주문에 환불한 적이 있을 경우
                    if (check_refund[0]) {
                        // 환불했었던 실 결제금액 및 큐머니 차감
                        for (let i = 0; i < check_refund.length; i++) {
                            total_price = total_price - check_refund[i].price;
                            qmoney = qmoney - check_refund[i].qmoney;
                        }
                        console.log(`환불한 적이 있음`);
                        console.log(`total_price:${total_price}`);
                        console.log(`qmoney:${qmoney}`);
                    // 주문 건에 대해 첫 환불신청인 경우
                    } else {
                        // 쿠폰을 사용했을 경우
                        if (order_info[0].coupon_idx) {
                            console.log(`쿠폰 사용했을 경우`);
                            // 유효기간 체크
                            var coupon = await Coupon_user.find({ user_idx: user_idx, used_coupon: { $elemMatch: { coupon_idx: order_info[0].coupon_idx, limit_date: { $gte: current_time } } } });
                            console.log(coupon);
                            // 유효기간이 남았을 경우
                            if (coupon[0]._id) {
                                // 쿠폰 재발급을 위한 데이터 꺼내기
                                let find_coupon = await Coupon_user.aggregate([{ $unwind: "$used_coupon" },
                                { $match: { user_idx: user_idx, 'used_coupon.coupon_idx': { $in: [mongoose.Types.ObjectId(order_info[0].coupon_idx)] } } }]);
                                // 사용된 쿠폰에서 제외하기
                                let pull_coupon = await Coupon_user.updateOne({ user_idx: user_idx },
                                    { $pull: { used_coupon: find_coupon[0].used_coupon } });
                                // 쿠폰 재발급
                                let push_coupon = await Coupon_user.updateOne({ user_idx: user_idx },
                                    { $push: { coupon: find_coupon[0].used_coupon } });

                                // 유효기간이 지났을 경우
                            } else {
                                coupon_check = false;
                            }
                            // 환불 요청 금액이 쿠폰 할인금액보다 적은 경우
                            await connection.beginTransaction();
                            if (refund_price <= order_info[0].coupon_price) {
                                if (coupon_check == true) {
                                    // 환불 테이블 업데이트
                                    if(get_refund[0].status == 900) {//부분환불
                                        let update_refund = await connection.query(refund_coupon_query, [refund_price, order_info[0].coupon_idx, 902, refund_id]);
                                        console.log(update_refund);
                                    }
                                    else {//전체환불
                                        let update_refund = await connection.query(refund_coupon_query, [refund_price, order_info[0].coupon_idx, 912, refund_id]);
                                        console.log(update_refund);
                                    }
                                } else {
                                    // 유효기간이 지난 쿠폰 대신 큐머니 지급
                                    let insert_qmoney = await connection.query(insert_qmoney_query, [user_idx, refund_price, plus_qmoney]);
                                    console.log(insert_qmoney);
                                    // 보유 큐머니 업데이트
                                    let update_qmoney = await connection.query(update_qmoney_query, [refund_price, user_idx]);
                                    console.log(update_qmoney);
                                    // 환불 테이블 업데이트
                                    if(get_refund[0].status == 900) {//부분환불
                                        let update_refund = await connection.query(refund_coupon_query, [refund_price, null, 902, refund_id]);
                                        console.log(update_refund);
                                    }
                                    else {//전체환불
                                        let update_refund = await connection.query(refund_coupon_query, [refund_price, null, 912, refund_id]);
                                        console.log(update_refund);
                                    }
                                }
                                await connection.commit();
                                plus_product_count();
                                console.log("환불 성공-complete");
                                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_SUCCESS));
                            } else {
                                if (coupon_check == false) {
                                    // 유효기간이 지난 쿠폰 대신 큐머니 지급
                                    let insert_qmoney = await connection.query(insert_qmoney_query, [user_idx, order_info[0].coupon_price, plus_qmoney]);
                                    console.log(insert_qmoney);
                                    // 보유 큐머니 업데이트
                                    let update_qmoney = await connection.query(update_qmoney_query, [order_info[0].coupon_price, user_idx]);
                                    console.log(update_qmoney);
                                    // 환불 테이블 업데이트
                                    if(get_refund[0].status == 900){//부분환불
                                        let update_refund = await connection.query(refund_coupon_query, [order_info[0].coupon_price, null, 900, refund_id]);
                                        console.log(update_refund);
                                    } else {//전체환불
                                        let update_refund = await connection.query(refund_coupon_query, [order_info[0].coupon_price, null, 910, refund_id]);
                                        console.log(update_refund);
                                    }
                                } else {
                                    if(get_refund[0].status == 900) {//부분환불
                                        let update_refund = await connection.query(refund_coupon_query, [order_info[0].coupon_price, order_info[0].coupon_idx, 900, refund_id]);
                                        console.log(update_refund);
                                    } else {//전체환불
                                        let update_refund = await connection.query(refund_coupon_query, [order_info[0].coupon_price, order_info[0].coupon_idx, 910, refund_id]);
                                        console.log(update_refund);
                                    }
                                }
                                refund_price = refund_price - order_info[0].coupon_price;   // 환불 요청금액에서 쿠폰 할인 금액 제외
                                await connection.commit();
                            }
                        }
                    }

                    // 환불 요청금액이 큐머니 사용금액보다 같거나 적은 경우
                    await connection.beginTransaction();
                    if (refund_price <= qmoney) {
                        let refund_qmoney = await connection.query(insert_qmoney_query, [user_idx, refund_price, plus_qmoney]);
                        console.log(`refund_qmoney:${refund_qmoney}`);
                        let update_qmoney = await connection.query(update_qmoney_query, [refund_price, user_idx]);
                        console.log(`update_qmoney:${update_qmoney}`);
                        // 환불 테이블 업데이트
                        if(get_refund[0].status == 900) {//부분환불
                            let update_refund = await connection.query(refund_qmoney_query, [refund_price, 902, refund_id]);
                            console.log(`update_refund:${update_refund}`);
                        } else {//전체환불
                            let update_refund = await connection.query(refund_qmoney_query, [refund_price, 912, refund_id]);
                            console.log(`update_refund:${update_refund}`);
                        }
                        await connection.commit();
                        plus_product_count();
                        console.log("환불 성공-complete");
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_SUCCESS));
                    } else {
                        refund_price = refund_price - qmoney
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

                        // 아임포트 REST API로 결제환불 요청
                        const getCancelData = await axios({
                            url: "https://api.iamport.kr/payments/cancel",
                            method: "post", // POST method
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
                            },
                            data: {
                                reason: get_refund[0].content,
                                merchant_uid: order_id,
                                amount: refund_price,
                                checksum: total_price,
                                extra:{
                                    requester : "customer"
                                }
                            }
                        });
                        const { response } = getCancelData.data; // 환불 결과
                        console.log(getCancelData.data);
                        const { merchant_uid } = response; // 환불 결과에서 주문정보 추출
                        if (!merchant_uid) {
                            res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.REFUND_FAIL));
                        } else {
                            //사용한 큐머니 되돌려주기
                            if (qmoney != 0) {
                                let refund_qmoney = await connection.query(insert_qmoney_query, [user_idx, qmoney, plus_qmoney]);
                                console.log(`refund_qmoney:${refund_qmoney[0]}`);
                                let update_qmoney = await connection.query(update_qmoney_query, [qmoney, user_idx]);
                                console.log(`update_qmoney:${update_qmoney[0]}`);
                            }
                            //지급받은 큐머니 환수하기
                            if(refund_price != 0) {
                                let reward_qmoney = Math.floor(refund_price * 0.01);
                                let return_qmoney = await connection.query(insert_qmoney_query, [user_idx, -reward_qmoney, minus_qmoney]);
                                console.log(`return_qmoney:${return_qmoney[0]}`);
                                let return_update_qmoney = await connection.query(update_qmoney_query, [-reward_qmoney, user_idx]);
                                console.log(`return_update_qmoney:${return_update_qmoney[0]}`);
                            }
                            // 환불 테이블 업데이트
                            if (get_refund[0].is_all == 0) {
                                if(get_refund[0].status == 900) {//부분환불
                                    let update_refund = await connection.query(refund_price_query, [refund_price, qmoney, 0, 902, refund_id]);
                                    console.log(`update_refund:${update_refund[0]}`);
                                } else {//전체환불
                                    let update_refund = await connection.query(refund_price_query, [refund_price, qmoney, 0, 912, refund_id]);
                                    console.log(`update_refund:${update_refund[0]}`);
                                }
                            } else if (get_refund[0].is_all == 1) {
                                if(get_refund[0].status == 900) {//부분환불
                                    let update_refund = await connection.query(refund_price_query, [(refund_price - order_info[0].delivery_price), qmoney, order_info[0].delivery_price, 902, refund_id]);
                                    console.log(`update_refund:${update_refund[0]}`);
                                } else {//전체환불
                                    let update_refund = await connection.query(refund_price_query, [(refund_price - order_info[0].delivery_price), qmoney, order_info[0].delivery_price, 912, refund_id]);
                                    console.log(`update_refund:${update_refund[0]}`);
                                }
                            }

                            // 배송 테이블 업데이트
                            let update_order_query = "UPDATE orders SET status = ? WHERE order_id = ?"
                            if(get_refund[0].status == 900) {//부분환불
                                let update_order = await connection.query(update_order_query, [902, order_id]);
                                console.log(`update_order:${update_order[0]}`);
                            } else {//전체환불
                                let update_order = await connection.query(update_order_query, [912, order_id]);
                                console.log(`update_order:${update_order[0]}`);
                            }

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
                                        body: '요청하신 환불이 승인되었습니다.'
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
                                            name: '요청하신 환불이 승인되었습니다.',
                                            content: '',
                                            created_at: Date.now() + (3600000 * 9)
                                        })
                                        notification.save();
                                    })
                                    .catch(error => {
                                        console.log("오류")
                                        console.log(error)
                                    })
                            }
                            await connection.commit();
                            plus_product_count();
                            console.log("환불 성공-complete");
                            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_SUCCESS));
                        }
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