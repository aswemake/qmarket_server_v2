var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const pool = require('../../../config/dbConfig');
const jwt = require('../../../module/jwt');

const Review = require('../../../schemas/review');
const Like = require('../../../schemas/like');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { product_idx } = req.query;
    if (!user_idx || !product_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let review_data = [];
            let query = 'SELECT name, nickname FROM users WHERE user_idx = ?'

            // 리뷰 구하기
            var review = await Review.find({ idx: product_idx, user_idx: user_idx }).sort({ created_at: 'desc' });
            console.log(review);
            for (var i = 0; i < review.length; i++) {
                // 리뷰 작성자 구하기
                let getName = await connection.query(query, [review[i].user_idx]);
                console.log(getName[0]);
                if (getName[0].name == null) {
                    var name = getName[0].nickname;
                } else {
                    var name = getName[0].name;
                }
                // 좋아요 개수 구하기
                var like = await Like.find({ review_idx: review[i]._id }).countDocuments();
                console.log(like);

                review_data[i] = {
                    review_idx: review[i]._id,
                    name: name,
                    content: review[i].content,
                    created_at: review[i].created_at,
                    like: like,
                    score: review[i].score
                }
            }
            console.log(review_data);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, review_data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;