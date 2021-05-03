var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Review = require('../../schemas/review');

// 반상회 리뷰작성
router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { party_idx } = req.query;
        let { content } = req.body;
        if (!user_idx || !party_idx || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            const review = new Review({
                idx: party_idx,
                user_idx: user_idx,
                content: content,
                score: 0,
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