var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Coupon = require('../../schemas/coupon');
const Coupon_User = require('../../schemas/coupon_user');

// 유저가 발급받을 수 있는 쿠폰 리스트 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = new Object();
            Object.assign(data, { count: 0, coupons: []});
            let except_coupons_idx = [];

            let user_coupons = await Coupon_User.find({ user_idx: user_idx });
            // 유저가 사용할 수 있거나 사용한 쿠폰 정보가 있을 경우 제외해야할 쿠폰idx들을 저장
            if (user_coupons.length > 0) {
                // 유저가 사용할 수 있는 쿠폰idx들을 전체 쿠폰 목록 중 제외해야할 쿠폰idx 배열에 저장
                for (let i = 0; i < user_coupons[0].coupon.length; i++) {
                    let available_coupon_idx = user_coupons[0].coupon[i].coupon_idx;
                    except_coupons_idx.push(available_coupon_idx);
                }
                // 유저가 사용한 쿠폰idx들을 전체 쿠폰 목록 중 제외해야할 쿠폰idx 배열에 저장
                for (let i = 0; i < user_coupons[0].used_coupon.length; i++) {
                    let used_coupon_idx = user_coupons[0].used_coupon[i].coupon_idx;
                    except_coupons_idx.push(used_coupon_idx);
                }
            }

            // 전체 쿠폰 목록 중 제외해야할 쿠폰들(유저가 사용할 수 있거나 사용한 쿠폰들)을 제외한 쿠폰 목록을 출력
            let coupons = await Coupon.find({ _id: { $nin: except_coupons_idx }, is_all: 1 }).sort({ limit_date: 1 });
            for (let i = 0; i < coupons.length; i++) {
                let coupon = {
                    coupon_idx: coupons[i]._id,
                    name: coupons[i].name,
                    sale_price: coupons[i].sale_price,
                    limit_price: coupons[i].limit_price,
                    limit_date: coupons[i].limit_date,
                    coupon_type: coupons[i].coupon_type,
                    is_used: false
                }
                data.coupons.push(coupon);
            }

            data.count = coupons.length;
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;