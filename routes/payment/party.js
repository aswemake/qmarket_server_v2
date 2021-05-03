var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');

const Party = require('../../schemas/party');
const Coupon = require('../../schemas/coupon');
const Coupon_user = require('../../schemas/coupon_user');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx, email } = req.decoded;
        let { party_idx } = req.query;
        if (!user_idx || !party_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            let coupon_arr = [];
            let get_coupon = await Coupon_user.find({ user_idx: user_idx });
            if (get_coupon[0]) {
                for (var i = 0; i < get_coupon[0].coupon.length; i++) {
                    let coupon_data = new Object();
                    let coupon = await Coupon.find({
                        $and: [{ _id: get_coupon[0].coupon[i] }, { coupon_type: { $in: [2, 3] } }]
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
            let get_party = await Party.find({ _id: party_idx });
            let query = 'SELECT qmoney FROM users WHERE user_idx = ?'
            let get_money = await connection.query(query, [user_idx]);

            // 네이버페이 테스트 계정
            let is_test;
            if (email == 'sunhan1374@naver.com' || email == 'whs95@daum.net' || email == 'aswemaketest@naver.com') {
                is_test = true;
            } else {
                is_test = false;
            }

            let data = {
                coupon: coupon_arr,
                qmoney: get_money[0].qmoney,
                price: get_party[0].price,
                sale_ratio: get_party[0].sale_ratio,
                main_img: get_party[0].main_img,
                episode: get_party[0].episode,
                pattern: get_party[0].pattern,
                is_test: is_test
            }
            console.log(data);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})
module.exports = router;