var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const pool = require('../../../config/dbConfig');
const jwt = require('../../../module/jwt');

const Review = require('../../../schemas/review');
const Like = require('../../../schemas/like');

// 리뷰 보기
router.get('/', async (req, res) => {
    let { product_idx, sort } = req.query;
    if (!product_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let review_data = [];
            let query = 'SELECT name, nickname FROM users WHERE user_idx = ?'

            // 리뷰 구하기
            var review = await Review.find({ idx: product_idx }).sort({ created_at: 'desc' });
            console.log(review);
            for (var i = 0; i < review.length; i++) {
                // 리뷰 작성자 구하기
                let getName = await connection.query(query, [review[i].user_idx]);
                console.log(getName[0]);
                if (getName[0].nickname == null) {
                    var name = getName[0].name;
                } else {
                    var name = getName[0].nickname;
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
            // 최신순 정렬
            if (!sort) {
                console.log(review_data);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, review_data));
                // 인기순 정렬    
            } else if (sort === 'best') {
                review_data.sort(function(a, b) {
                    if (a.like == b.like) {
                        return 0;
                    } return a.like > b.like ? -1 : 1;
                });
                console.log(review_data);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, review_data));
            } else {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 리뷰 등록
router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { product_idx } = req.query;
        let { content, score } = req.body;
        if (!product_idx || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            const review = new Review({
                idx: product_idx,
                user_idx: user_idx,
                content: content,
                score: score,
                created_at: Date.now() + (3600000 * 9)
            })
            const review_save_result = await review.save();
            if (!review_save_result) {
                console.log("삽입 실패");
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
            } else {
                console.log("삽입 성공");
                res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;