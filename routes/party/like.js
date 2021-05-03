var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

const Like = require('../../schemas/like');

router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { party_idx } = req.body;
        if (!user_idx || !party_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let data = {
                count: null,
                is_check: null
            }
            var check_like = await Like.find({ party_idx: party_idx, user_idx: user_idx });
            var check = true;
            console.log(check_like);
            if (!check_like[0]) {
                const push_like = new Like({
                    party_idx: party_idx,
                    user_idx: user_idx
                })
                const push_like_result = await push_like.save();
                let count_like = await Like.countDocuments({ party_idx: party_idx });
                data.count = count_like;
                data.is_check = check;
                if (!push_like_result) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                } else {
                    res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_LIKES, data));
                }
            } else {
                check = false;
                let delete_like = await Like.deleteOne({ party_idx: party_idx, user_idx: user_idx });
                let count_like = await Like.countDocuments({ party_idx: party_idx });
                data.count = count_like;
                data.is_check = check;
                if (delete_like.deletedCount == 1) {
                    res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.DELETE_LIKES, data));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;