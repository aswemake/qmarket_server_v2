var express = require('express');
var router = express.Router();
var axios = require('axios');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');

const Product = require('../../schemas/product');
const Coupon_User = require('../../schemas/coupon_user');

router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { imp_uid, merchant_uid, receiver, phone, email, mail_number, address,
            detail_address, delivery_memo, home_pwd, product, price, pay_method, coupon_idx, coupon_price, qmoney, delivery_price} = req.body;
        console.log(req.body);
        console.log(product);
        if (!user_idx || !merchant_uid || !receiver || !phone || !email || !address
            || !detail_address || !product || !price || !pay_method) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            if (!delivery_memo) {
                delivery_memo = "";
            }
            if (!mail_number) {
                mail_number = null;
            }
            if (!home_pwd) {
                home_pwd = null;
            }
            if (!imp_uid) {
                imp_uid = null;
            }
            var connection = await pool.getConnection();
            await connection.beginTransaction();

            // 주문 정보 데이터 삽입
            let query = 'INSERT INTO orders '
                + '(imp_uid, order_id, mail_number, address, detail_address, delivery_memo, home_pwd, '
                + 'receiver, phone, email, pay_method, coupon_price, qmoney, user_idx, delivery_price) '
                + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            let result = await connection.query(query, [imp_uid, merchant_uid, mail_number, address, detail_address,
                delivery_memo, home_pwd, receiver, phone, email, pay_method, coupon_price, qmoney, user_idx, delivery_price]);
            console.log(result);

            for (let i = 0; i < product.length; i++) {
                // 주문 정보에서의 주문한 상품들 데이터 삽입
                let query2 = 'INSERT INTO orders_products (order_id, product_id, user_idx, count) VALUES (?, ?, ?, ?)';
                let result2 = await connection.query(query2, [merchant_uid, product[i].product_idx, user_idx, product[i].count]);
                console.log(result2);
            };

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

            // imp_uid로 아임포트 서버에서 결제 정보 조회
            const getPaymentData = await axios({
                url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
                method: "get", // GET method
                headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
            });
            const paymentData = getPaymentData.data.response; // 조회한 결제 정보

            let delete_query = 'DELETE FROM orders_products WHERE order_id = ?'
            let delete_query2 = 'DELETE FROM orders WHERE imp_uid= ? AND order_id = ?';

            if (!paymentData) {
                console.log("결제 실패!");
                let delete_orders = await connection.query(delete_query, [merchant_uid]);
                let delete_products = await connection.query(delete_query2, [imp_uid, merchant_uid]);
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.APPROVAL_FAIL));
            } else {
                await connection.commit();
                // DB에서 결제되어야 하는 금액 조회
                let amountToBePaid = 0;

                let query = 'SELECT product_id, count FROM orders_products WHERE order_id = ?';
                let query2 = 'UPDATE orders_products SET price = ? WHERE product_id =? AND order_id = ?';
                let product_info = await connection.query(query, [merchant_uid]);
                for (var i = 0; i < product_info.length; i++) {
                    var product_data = await Product.find({ _id: product_info[i].product_id }, { saled_price: 1 });
                    // 상품별 가격 저장하기
                    let save_price = await connection.query(query2, [(product_data[0].saled_price * product_info[i].count), product_info[i].product_id, merchant_uid]);
                    amountToBePaid = amountToBePaid + (product_data[0].saled_price * product_info[i].count); // 결제 되어야 하는 금액
                }
                
                console.log(amountToBePaid);
                let sale_price = (qmoney + coupon_price);
                amountToBePaid = (amountToBePaid + delivery_price + sale_price);
                console.log(amountToBePaid);
                console.log("-----");
                // 결제 검증하기
                const { amount, status } = paymentData;
                console.log(amount);
                if (amount === amountToBePaid) { // 결제 금액 일치. 결제 된 금액 === 결제 되어야 하는 금액
                    switch (status) {
                        case "paid": // 결제 완료
                            let reward_money = Math.floor(amountToBePaid * 0.01);
                            let reward_content = '[큐마켓] 상품 결제 적립금';
                            let order_content = '[큐마켓] 상품 결제 사용';
                            await connection.beginTransaction();

                            // 큐머니 동기화
                            let query = 'UPDATE users SET qmoney = qmoney + ? WHERE user_idx = ?'
                            let update = await connection.query(query, [(qmoney + reward_money), user_idx]);
                            console.log(update);

                            // 결제 금액 저장
                            let query2 = 'UPDATE orders SET is_paid = 1, payment = ? WHERE order_id = ?'
                            let update2 = await connection.query(query2, [amountToBePaid, merchant_uid]);
                            console.log(update2);

                            // 큐머니 사용 내역 저장
                            let query3 = 'INSERT INTO qmoney (user_idx, money, content) VALUES (?, ?, ?)';
                            let result3 = await connection.query(query3, [user_idx, reward_money, reward_content]);
                            console.log(result3);
                            if (qmoney != 0) {
                                let result4 = await connection.query(query3, [user_idx, qmoney, order_content]);
                                console.log(result4);
                            }

                            // 상품 수량 제거
                            for (let k = 0; k < product.length; k++) {
                                let minus_count = await Product.updateOne({ _id: product[k].product_idx }, { $inc: { count: -(product[k].count) } })
                                if (minus_count.nModified == 1) {
                                    console.log(`상품 수량이 ${product[k].count}만큼 감소했습니다`);
                                }
                            }

                            // 쿠폰이 있을 경우 쿠폰 제거
                            if (coupon_idx) {
                                let delete_coupon = await Coupon_User.updateOne({ user_idx: user_idx },
                                    { $pull: { coupon: coupon_idx } });
                                console.log(delete_coupon);
                                let used_coupon = await Coupon_User.updateOne({ user_idx: user_idx },
                                    { $push: { used_coupon: coupon_idx } });
                                if (delete_coupon.nModified == 1 && used_coupon.nModified == 1) {
                                    console.log("쿠폰 삭제 및 삽입에 성공하였습니다.");
                                } else {
                                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                                }
                            }
                            await connection.commit();
                            console.log("결제 성공-complete");

                            let get_token_query = 'SELECT token FROM market_token WHERE is_admin = 1';
                            let get_token = await connection.query(get_token_query);
                            let token_array = [];
                            for(let i = 0; i < get_token.length; i++){
                                token_array.push(get_token[i].token);
                            }
                            const getInfo = await axios({
                                url: `https://fcm.googleapis.com/fcm/send`,
                                method: "POST", // GET method
                                headers: {
                                    "Authorization": `key= ${process.env.FCM_SERVER_KEY}`,
                                    "Content-Type": "application/json"
                                },
                                data: {
                                    "notification": {
                                        "title": "배달 요청",
                                        "body": `${address + ' ' + detail_address}`,
                                        "icon": "Qmarket.png",
                                        "click_action": "http://qmarket.cf/product/delivery/main",
                                    },
                                    "registration_ids": token_array
                                }
                            });
                            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.APPROVAL_SUCCESS));
                            break;
                    }
                } else { // 결제 금액 불일치. 위/변조 된 결제
                    console.log("결제 실패!");
                    let delete_orders = await connection.query(delete_query, [merchant_uid]);
                    let delete_products = await connection.query(delete_query2, [imp_uid, merchant_uid]);
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.APPROVAL_FAIL));
                }
            }
        }
    } catch (err) {
        connection.rollback();
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})

module.exports = router;