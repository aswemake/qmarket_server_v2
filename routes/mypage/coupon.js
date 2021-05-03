var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Coupon = require('../../schemas/coupon');
const Coupon_User = require('../../schemas/coupon_user');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let coupon_arr = [];
            let get_coupon = await Coupon.find({}).sort({ limit_date: 'asc' });
            var count = 0;
            for (var i = 0; i < get_coupon.length; i++) {
                let coupon_data = new Object();
                coupon_data = {
                    coupon_idx: get_coupon[i]._id,
                    name: get_coupon[i].name,
                    sale_price: get_coupon[i].sale_price,
                    limit_price: get_coupon[i].limit_price,
                    limit_date: get_coupon[i].limit_date,
                    coupon_type: get_coupon[i].coupon_type,
                    is_used: null
                }
                let coupon_user = await Coupon_User.find({ user_idx: user_idx, coupon: { $in: get_coupon[i]._id } });
                if (!coupon_user[0]) {
                    let used_coupon = await Coupon_User.find({ user_idx: user_idx, used_coupon: { $in: get_coupon[i]._id } });
                    if (!used_coupon[0]) {
                        coupon_data.is_used = false;
                        coupon_arr.push(coupon_data);
                    } else {
                        console.log("사용한 쿠폰입니다.");
                    }
                } else {
                    count = count + 1;
                    coupon_data.is_used = true;
                    coupon_arr.push(coupon_data);
                }
            }
            let data = {
                count: count,
                coupon: coupon_arr
            }
            console.log(data);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        const { coupon_idx } = req.body;
        if (!user_idx || !coupon_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let check = await Coupon_User.find({ user_idx: user_idx });
            if (!check[0]) {
                let coupon_arr = [coupon_idx];
                let insert_user = new Coupon_User({
                    user_idx: user_idx,
                    coupon: coupon_arr
                })
                let insert_user_result = await insert_user.save();
                if (!insert_user_result) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                } else {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                }
            } else {
                let register = await check[0].coupon.push(coupon_idx);
                check[0].save();
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;