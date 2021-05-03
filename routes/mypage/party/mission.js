var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');
const pool = require('../../../config/dbConfig');
const upload = require('../../../config/multer');

const Mission_admin = require('../../../schemas/mission_admin');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { party_idx } = req.query;
        console.log(party_idx);
        if (!user_idx || !party_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            let mission = await Mission_admin.find({ party_idx: party_idx });
            let query = 'SELECT name, nickname, email, profile_img FROM users WHERE user_idx = ?';
            let get_user = await connection.query(query, [mission[0].user_idx]);
            if (get_user[0].name == null) {
                name = get_user[0].nickname;
            } else {
                name = get_user[0].name;
            }
            if (get_user[0].profile_img == null) {
                profile_img = null;
            } else {
                profile_img = get_user[0].profile_img;
            }
            let data = {
                mission_idx: mission[0]._id,
                name: name,
                profile_img: profile_img,
                content: mission[0].content
            }
            console.log(data);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
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
            const imgs = req.files;
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
                imgs: img_arr
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