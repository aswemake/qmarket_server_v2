var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Coupon = require('../../schemas/coupon');
const Coupon_User = require('../../schemas/coupon_user');

// 유저가 사용할 수 있는 쿠폰 리스트 조회 API (내 쿠폰함)
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = new Object();
            Object.assign(data, { count: 0, coupons: []});
            
            // 마감기한이 짧은 쿠폰 순으로 정렬
            let available_coupons = await Coupon_User.aggregate([ { $match: { user_idx: user_idx } }, { $unwind: '$coupon' }, { $sort: { 'coupon.limit_date': 1 } } ]);
            for (let i = 0; i < available_coupons.length; i++) {
                let coupon = await Coupon.find({ _id: available_coupons[i].coupon.coupon_idx });
                if (coupon.length <= 0) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_COUPON));
                }
                let available_coupon = {
                    coupon_idx: coupon[0]._id,
                    name: coupon[0].name,
                    sale_price: coupon[0].sale_price,
                    limit_price: coupon[0].limit_price,
                    limit_date: coupon[0].limit_date,
                    coupon_type: coupon[0].coupon_type,
                    is_used: false
                }
                data.coupons.push(available_coupon);
            }

            data.count = available_coupons.length;
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;