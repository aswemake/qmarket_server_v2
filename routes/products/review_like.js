var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Review = require('../../schemas/review');
const Like = require('../../schemas/like');

// 상품 리뷰 좋아요 설정 API
router.put('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        const { product_idx, review_idx } = req.params;
        if (!user_idx || !product_idx || !review_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let data = {
                count: null,
                is_check: null
            }
            let check_like = await Like.find({ review_idx: review_idx, user_idx: user_idx });
            if (!check_like[0]) {
                const push_like = new Like({
                    review_idx: review_idx,
                    user_idx: user_idx
                })
                const push_like_result = await push_like.save();
                if (!push_like_result) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                } else {
                    let increase_like_count = await Review.updateOne({ _id: review_idx }, { $inc: { like_count: 1 } });
                    if (increase_like_count.nModified !== 1) {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    } else {
                        let review = await Review.find({ _id: review_idx }).select({ like_count: 1 });
                        data.count = review[0].like_count;
                        data.is_check = true;
                        res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_LIKES, data));
                    }
                }
            } else {
                let delete_like = await Like.deleteOne({ review_idx: review_idx, user_idx: user_idx });
                if (delete_like.deletedCount !== 1) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                } else {
                    let decrease_like_count = await Review.updateOne({ _id: review_idx }, { $inc: { like_count: -1 } });
                    if (decrease_like_count.nModified !== 1) {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    } else {
                        let review = await Review.find({ _id: review_idx }).select({ like_count: 1 });
                        data.count = review[0].like_count;
                        data.is_check = false;
                        res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.DELETE_LIKES, data));
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;