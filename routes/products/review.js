var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');
const upload = require('../../config/multer');

const Review = require('../../schemas/review');
const Like = require('../../schemas/like');

// 상품 리뷰 리스트 조회 API
router.get('/', async (req, res) => {
    const { product_idx } = req.params;
    const { sort } = req.query;
    if (!product_idx || !sort) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();    
            let data = [];
            let get_user_name_query = 'SELECT name, nickname FROM users WHERE user_idx = ?'
            
            // 해당 상품의 리뷰 리스트 출력
            let reviews = await Review.find({ idx: product_idx }).sort({ created_at: -1 });
            for (var i = 0; i < reviews.length; i++) {
                // 리뷰 작성자 구하기
                let users = await connection.query(get_user_name_query, [reviews[i].user_idx]);
                let user_name = (users[0].name) ? users[0].name : users[0].nickname;
                let review = {
                    review_idx: reviews[i]._id,
                    name: user_name,
                    content: reviews[i].content,
                    score: reviews[i].score,
                    like: reviews[i].like_count,
                    created_at: reviews[i].created_at,
                    img: reviews[i].img
                }
                data.push(review);
            }
            if (data.length > 0) {
                switch (sort) {
                    case '최신순':
                        break;
                    case '베스트순':
                        // 좋아요 갯수를 기준으로 내림차순 정렬
                        data.sort(function(a, b) {
                            return b.like - a.like;
                        })
                        break;
                }
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 상품 리뷰 등록 API
router.post('/', jwt.isLoggedIn, upload.array('imgs'), async (req, res) => {
    const { user_idx } = req.decoded;
    const { product_idx } = req.params;
    const { content, score } = req.body;
    if (!product_idx || !content || !score) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let img_urls = [];
            if (req.files) {
                for (let i = 0; i < req.files.length; i++) {
                    img_urls.push(req.files[i].location);
                }
            }

            const review = new Review({
                idx: product_idx,
                user_idx: user_idx,
                content: content,
                score: score,
                created_at: Date.now() + (3600000 * 9),
                like_count: 0,
                img: img_urls
            })
            const review_save_result = await review.save();
            if (!review_save_result) {
                console.log("삽입 실패");
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
            } else {
                console.log("삽입 성공");
                res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;
