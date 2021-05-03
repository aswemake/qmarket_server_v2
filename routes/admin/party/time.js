var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');

var moment = require('moment');

let Party = require('../../../schemas/party');
let Ticket = require('../../../schemas/ticket');

router.put('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../start');
    } else {
        try {
            let { party_id } = req.query;
            let { start_time } = req.body;
            if (!party_id || !start_time) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let momentDate = moment(start_time);
                let korea_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
                let limit_date = moment(korea_time).format("YYYY-MM-DD 8:59:59");
                console.log(limit_date);
                let change_time = await Party.updateOne({ _id: party_id }, { $set: { start_time: korea_time } });
                if (change_time.nModified === 1) {
                    // 반상회 시작시간에 맞춰 티켓 유효기간 늘리기
                    let change_limit_date = await Ticket.updateOne({ party_idx: party_id, type: 1 }, { $set: { limit_date: limit_date } });
                    if (change_limit_date.nModified === 1) {
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                    } else {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    }
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})
module.exports = router;