var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const upload = require('../../config/multer');
const pool = require('../../config/dbConfig');

// 몽고 DB Schema
const Party = require('../../schemas/party');
const Mission = require('../../schemas/mission');
const Mission_admin = require('../../schemas/mission_admin');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { party_idx } = req.query;
        if (!user_idx || !party_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            let find_episode = await Party.find({ _id: party_idx }).select({ episode: 1 })
            console.log(find_episode[0].episode);
            let mission_admin = await Mission_admin.find({ party_idx: party_idx, episode: find_episode[0].episode });
            if (!mission_admin[0]) {
                console.log("등록된 미션이 없습니다");
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_MISSION));
            } else {
                let find_mission = await Mission.findOne({ mission_idx: mission_admin[0]._id, user_idx: user_idx });
                console.log(find_mission);
                if (!find_mission) {
                    var is_submit = false;
                    var mission = null;
                } else {
                    var is_submit = true;
                    var mission = {
                        files: find_mission.imgs,
                        content: find_mission.content
                    }
                }
                let data = {
                    mission_idx: mission_admin[0]._id,
                    name: mission_admin[0].leader,
                    content: mission_admin[0].content,
                    is_submit: is_submit,
                    mission: mission
                }
                console.log(data);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})

router.post('/', jwt.isLoggedIn, upload.array('imgs'), async (req, res) => {
    try {
        let { user_idx } = req.decoded;
        let { mission_idx } = req.query;
        let { content } = req.body;
        if (!user_idx || !mission_idx || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var created_at = Date.now() + (3600000 * 9);
            const imgs = req.files;
            console.log(imgs);
            let img_arr = [];
            for (let i = 0; i < imgs.length; i++) {
                img_arr[i] = imgs[i].location;
                console.log(imgs[i].location);
            }
            console.log(img_arr);
            const mission = new Mission({
                mission_idx: mission_idx,
                user_idx: user_idx,
                content: content,
                imgs: img_arr,
                created_at: created_at
            })
            const mission_save_result = await mission.save();
            if (!mission_save_result) {
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