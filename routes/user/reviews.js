var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

let Product = require('../../schemas/product_v2');
let Review = require('../../schemas/review');
let Like = require('../../schemas/like');

// 유저가 작성한 review 리스트 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = [];
            let reviews = await Review.find({ user_idx: user_idx }).sort({ created_at: -1 });
            for (let i = 0; i < reviews.length; i++) {
                let product = await Product.find({ _id: reviews[i].idx });
                if (!product[0]) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_PRODUCT));
                } else {
                    let review = {
                        review_idx: reviews[i]._id,
                        main_img: product[0].img[0],
                        name: product[0].detail_name,
                        content: reviews[i].content,
                        score: reviews[i].score,
                        like: reviews[i].like_count,
                        created_at: reviews[i].created_at,
                        imgs: reviews[i].imgs
                    }
                    data.push(review);
                }
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 유저가 작성한 review 삭제 API
router.delete('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { review_idx } = req.body;
    if (!user_idx || !review_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let delete_review = await Review.deleteOne({ _id: review_idx, user_idx: user_idx });
            if (delete_review.deletedCount === 1) {
                let delete_like = await Like.deleteMany({ review_idx: review_idx });
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
            } else {
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_DELETE));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;