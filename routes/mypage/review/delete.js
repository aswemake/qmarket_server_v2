var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

let Review = require('../../../schemas/review');
let Like = require('../../../schemas/like');

router.delete('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { review_idx } = req.body;
        if (!user_idx || !review_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let delete_review = await Review.deleteOne({ _id: review_idx, user_idx: user_idx });
            if (delete_review.deletedCount === 1) {
                let delete_like = await Like.deleteMany({ review_idx: review_idx });
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
            } else {
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_DELETE));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;