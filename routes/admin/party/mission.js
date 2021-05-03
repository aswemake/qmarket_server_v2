var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');

let Party = require('../../../schemas/party');
let Mission_admin = require('../../../schemas/mission_admin');

router.put('/:party_id', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../start');
    } else {
        try {
            let { party_id } = req.params;
            let { content, episode } = req.body;
            if (!party_id || !content || !episode) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                var created_at = Date.now() + (3600000 * 9);
                let find_mission = await Mission_admin.find({ party_idx: party_id, episode: episode });
                if (!find_mission[0]) {
                    let party = await Party.find({ _id: party_id }).select({ leader: 1 });
                    console.log(party[0]);
                    let mission_admin = new Mission_admin({
                        party_idx: party_id,
                        leader: party[0].leader,
                        episode: episode,
                        content: content,
                        created_at: created_at
                    })
                    const mission_admin_save_result = await mission_admin.save();
                    if (!mission_admin_save_result) {
                        console.log("삽입 실패");
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    } else {
                        console.log("삽입 성공");
                        res.status(201).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
                    }
                } else {
                    let update_mission = await Mission_admin.updateOne({ party_idx: party_id, episode: episode }, { $set: { content: content, created_at: created_at } });
                    if (update_mission.nModified === 1) {
                        console.log("수정 성공");
                        res.status(200).json(utils.successFalse(statusCode.OK, resMessage.UPDATE_SUCCESS));
                    } else {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.READ_FAIL));
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;