var express = require('express');
var router = express.Router();
var axios = require('axios');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');

const Coupon_User = require('../../schemas/coupon_user');
const Party = require('../../schemas/party');
const enroll_Party = require('../../schemas/enroll_party');

router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        const { imp_uid, merchant_uid, party_idx, coupon_idx, coupon_price, qmoney,
            count, price, name, phone, pay_method } = req.body;
        if (!user_idx || !imp_uid || !party_idx
            || !count || !price || !name || !phone || !pay_method) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                await connection.beginTransaction();
                console.log(`imp_uid: ${imp_uid}`);
                console.log(`merchant_uid: ${merchant_uid}`)
                let query = 'INSERT INTO orders_parties '
                    + '(order_id, party_id, user_idx, count, pay_method, payment, coupon_price, qmoney) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                let result = await connection.query(query, [merchant_uid, party_idx, user_idx, count, pay_method, null, coupon_price, qmoney]);
                console.log(result[0]);

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

                if (!paymentData) {
                    console.log("결제 실패!(!paymentData)");
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.APPROVAL_FAIL));
                } else {
                    await connection.commit();
                    // DB에서 결제되어야 하는 금액 조회
                    let amountToBePaid = 0;
                    let query = 'SELECT party_id, count FROM orders_parties WHERE order_id = ?';
                    let party = await connection.query(query, [merchant_uid]);
                    console.log(party[0]);
                    let party_price = await Party.find({ _id: party[0].party_id });
                    console.log(party_price[0]);
                    let sale_price = qmoney + coupon_price;
                    console.log(sale_price);
                    console.log(party[0].count);
                    if (party[0].count == 1) {
                        amountToBePaid = party_price[0].price + sale_price;
                    } else {
                        amountToBePaid = Math.floor((party_price[0].price * party[0].count) * (1 - party_price[0].sale_ratio * (party[0].count / 4)) / 100) * 100 + sale_price;
                    }
                    console.log(amountToBePaid);
                    console.log("-----");
                    // 결제 검증하기
                    const { amount, status } = paymentData;
                    console.log(amount);
                    if (amount === amountToBePaid) { // 결제 금액 일치. 결제 된 금액 === 결제 되어야 하는 금액
                        switch (status) {
                            case "paid": // 결제 완료
                                console.log("결제 성공");
                                let reward_money = Math.floor(amountToBePaid * 0.01);
                                let reward_content = '[큐마켓] 반상회 결제 적립금';
                                let order_content = '[큐마켓] 반상회 결제 사용';
                                await connection.beginTransaction();
                                let query2 = 'UPDATE users SET name = ?, phone = ?, qmoney = qmoney + ? WHERE user_idx = ?';
                                let result2 = await connection.query(query2, [name, phone, (qmoney + reward_money), user_idx]);
                                console.log(result2);
                                let update_query = 'UPDATE orders_parties SET payment = ? WHERE order_id = ?'
                                let update_payment = await connection.query(update_query, [amount, merchant_uid]);
                                let query3 = 'INSERT INTO qmoney (user_idx, money, content) VALUES (?, ?, ?)';
                                let result3 = await connection.query(query3, [user_idx, reward_money, reward_content]);
                                if (qmoney != 0) {
                                    let result4 = await connection.query(query3, [user_idx, qmoney, order_content]);
                                    console.log(result4);
                                }
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
                                // 반상회 회차 길이 구하기
                                let party_info = await Party.find({ _id: party_idx }).select({ start_time: 1, episode: 1 });
                                // 반상회 결제 존재 여부
                                let find_user = await enroll_Party.find({ party_idx: party_idx, user_idx: user_idx });
                                let is_all = false;
                                let enroll_arr = new Array();
                                if ((party_info[0].start_time.length - party_info[0].episode) == count) {
                                    is_all = true;
                                } else {
                                    is_all = false;
                                }
                                console.log(`is_all:${is_all}`);
                                // 반상회 회차길이의 배열 초기화
                                for (let i = 0; i < party_info[0].start_time.length; i++) {
                                    enroll_arr.push(0);
                                }
                                console.log(`enroll배열 초기화: ${enroll_arr}`);
                                if (!find_user[0]) {
                                    for (let j = party_info[0].episode; j < (party_info[0].episode + count); j++) {
                                        enroll_arr[j] = 1;
                                    }
                                    const enroll_party = new enroll_Party({
                                        party_idx: party_idx,
                                        user_idx: user_idx,
                                        enroll: enroll_arr,
                                        is_All: is_all
                                    })
                                    const enroll_party_save_result = await enroll_party.save();
                                } else {
                                    let arr = find_user[0].enroll;
                                    for (let k = party_info[0].episode; k < (party_info[0].episode + count); k++) {
                                        arr[k] = 1;
                                    }
                                    let update_enroll = await enroll_Party.updateOne({ party_idx: party_idx, user_idx: user_idx }, { $set: { enroll: arr, is_All: is_all } });
                                }
                                await connection.commit();
                                console.log("결제 성공-complete");
                                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.APPROVAL_SUCCESS));
                                break;
                        }
                    } else { // 결제 금액 불일치. 위/변조 된 결제
                        console.log("결제 금액 불일치!");
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.APPROVAL_FAIL));
                    }
                }
            }
            catch (err) {
                connection.rollback();
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;