var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Coupon = require('../../schemas/coupon');
const Coupon_User = require('../../schemas/coupon_user');

// 유저 쿠폰 발급 API
router.post('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    const { coupon_idx } = req.body;
    if (!user_idx || !coupon_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let coupons = await Coupon.find({ _id: coupon_idx }).select({ _id: 1, limit_date: 1 });
            if (coupons.length <= 0) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let coupon = {
                    coupon_idx: coupons[0]._id,
                    limit_date: coupons[0].limit_date
                }
                let check = await Coupon_User.find({ user_idx: user_idx });
                if (!check[0]) {
                    let coupon_arr = [coupon];
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
                    let register = await check[0].coupon.push(coupon);
                    check[0].save();
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;