var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            var name, profile_img;
            let query = 'SELECT name, nickname, email, profile_img, qmoney FROM users WHERE user_idx = ?';
            let get_user = await connection.query(query, [user_idx]);
            console.log(get_user[0]);
            if (get_user[0].name == null) {
                name = get_user[0].nickname;
            } else {
                name = get_user[0].name;
            }
            console.log(name);
            if (get_user[0].profile_img == null) {
                profile_img = null;
            } else {
                profile_img = get_user[0].profile_img;
            }
            let data = {
                user_idx: user_idx,
                name: name,
                email: get_user[0].email,
                profile_img: profile_img,
                qmoney: get_user[0].qmoney
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

module.exports = router;