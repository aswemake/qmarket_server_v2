var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');

const Coupon = require('../../schemas/coupon');
const Coupon_user = require('../../schemas/coupon_user');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {

        const { user_idx, email } = req.decoded;
        console.log(user_idx);
        console.log(email);
        if (!user_idx || !email) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            let query = "SELECT qmoney FROM users WHERE user_idx = ?";
            let get_money = await connection.query(query, [user_idx]);
            if (!get_money[0]) {
                console.log("err");
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } else {
                // 보유 쿠폰 확인
                let coupon_arr = [];
                let get_coupon = await Coupon_user.find({ user_idx: user_idx });
                if (get_coupon[0]) {
                    for (var i = 0; i < get_coupon[0].coupon.length; i++) {
                        let coupon_data = new Object();
                        let coupon = await Coupon.find({
                            $and: [{ _id: get_coupon[0].coupon[i] }, { coupon_type: { $in: [1, 3] } }]
                        });
                        console.log(coupon);
                        if (coupon[0]) {
                            coupon_data = {
                                coupon_idx: coupon[0]._id,
                                name: coupon[0].name,
                                sale_price: coupon[0].sale_price,
                                limit_price: coupon[0].limit_price,
                                limit_date: coupon[0].limit_date
                            }
                            coupon_arr.push(coupon_data);
                        } else {
                            continue;
                        }
                    }
                }
                console.log(coupon_arr);

                // 네이버페이 테스트 계정
                let is_test;
                if(email == 'sunhan1374@naver.com' || email == 'whs95@daum.net' || email == 'aswemaketest@naver.com'){
                    is_test = true;
                } else {
                    is_test = false;
                }

                let user_info = {
                    name: null,
                    phone: null,
                    email: email,
                    mail_number: null,
                    address: null,
                    detail_address: null,
                    delivery_memo: null,
                    save_money: get_money[0].qmoney,
                    coupon: coupon_arr,
                    is_test: is_test
                };
                let query = "SELECT receiver, phone, email, mail_number, address, detail_address, "
                    + "delivery_memo FROM orders WHERE user_idx = ?  ORDER BY created_at DESC"
                let get_user = await connection.query(query, [user_idx]);
                console.log(get_user[0]);
                if (!get_user[0]) {
                    let query = "SELECT email FROM users WHERE user_idx = ?";
                    let get_email = await connection.query(query, [user_idx]);
                    if (!get_email[0]) {
                        console.log("err");
                        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                    } else {
                        user_info.email = get_email[0].email
                    }
                } else {
                    user_info.name = get_user[0].receiver;
                    user_info.phone = get_user[0].phone;
                    user_info.email = get_user[0].email;
                    user_info.mail_number = get_user[0].mail_number;
                    user_info.address = get_user[0].address;
                    user_info.detail_address = get_user[0].detail_address;
                    user_info.delivery_memo = get_user[0].delivery_memo;
                }
                console.log(user_info);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, user_info));
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