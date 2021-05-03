var express = require('express');
var router = express.Router({ mergeParams: true });
var mongoose = require('mongoose');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let QnA = require('../../../../schemas/qna');

// QnA 답변 저장 및 수정 API
router.post('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { _id , answer } = req.body;
        if (!_id || !answer) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let update_answer = 
                    await QnA.updateOne({ _id: _id }, { $set: { answer: answer } });
                console.log(update_answer);
                if (update_answer.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }

            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})
module.exports = router;