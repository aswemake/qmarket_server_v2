var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const pool = require('../../../config/dbConfig');

const Party = require('../../../schemas/party');
const enroll_Party = require('../../../schemas/enroll_party');
const { max } = require('moment');

router.get('/:party_id', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { party_id } = req.params;
            if (!party_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                console.log(party_id);
                let member_arr = [];
                var connection = await pool.getConnection();
                let query = 'SELECT name, email FROM users WHERE user_idx = ?';
                // 반상회 정보
                let party_info = await Party.find({ _id: party_id }).select({ max: 1, is_finished: 1, name: 1, episode: 1 });

                // 등록된 멤버 조회
                let find_user = await enroll_Party.find({ party_idx: party_id });
                for (let i = 0; i < find_user.length; i++) {
                    if (find_user[i].enroll[party_info[0].episode] == 1) {
                        let get_user = await connection.query(query, [find_user[i].user_idx]);
                        if (get_user[0].name == null) {
                            name = get_user[0].nickname;
                        } else {
                            name = get_user[0].name;
                        }
                        let member = {
                            name: name,
                            email: get_user[0].email
                        }
                        member_arr.push(member);
                    }
                }

                let data = {
                    member: member_arr,
                    name: party_info[0].name,
                    max: party_info[0].max,
                    is_finished: party_info[0].is_finished
                }
                res.render('member', { data });
            }

        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;