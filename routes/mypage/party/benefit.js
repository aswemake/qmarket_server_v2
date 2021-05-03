var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

const Party = require('../../../schemas/party');
const enroll_Party = require('../../../schemas/enroll_party');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let benefit_arr = [];
            let benefit_user = await enroll_Party.find({ user_idx: user_idx });
            if (!benefit_user[0]) {
                console.log("보유하고 있는 혜택쿠폰이 없습니다.");
            } else {
                // 현재시간 구하기
                let current_time = new Date(Date.now() + (3600000 * 9));
                for (let i = 0; i < benefit_user.length; i++) {
                    let party_info = await Party.find({ _id: benefit_user[i].party_idx });
                    let limit_date;
                    // 참여하는 가장 마지막 반상회 회차의 혜택 기간 구하기
                    for (let j = benefit_user[i].enroll.length - 1; j >= 0; j--) {
                        if (benefit_user[i].enroll[j] == 1) {
                            limit_date = party_info[0].benefit_date[j];
                            console.log(limit_date);
                            break;
                        }
                    }
                    // 혜택 쿠폰 정보
                    if (benefit_user[i].enroll[(party_info[0].episode) - 1] == 1) {
                        let benefit_data = {
                            party_idx: benefit_user[i].party_idx,
                            main_img: party_info[0].benefit,
                            limit_date: limit_date
                        }

                        if (current_time < limit_date)
                            benefit_arr.push(benefit_data);
                        else   
                            console.log("혜택기간이 지났습니다.");
                    } else {
                        console.log("해당 회차의 혜택쿠폰이 존재하지 않습니다");
                    }
                }
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, benefit_arr));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;