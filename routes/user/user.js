var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

// 유저 정보 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            let get_user_query = 'SELECT IFNULL(name, nickname) AS name, email, profile_img, qmoney FROM users WHERE user_idx = ?';
            
            let get_user = await connection.query(get_user_query, [user_idx]);
            let data = {
                user_idx: user_idx,
                name: get_user[0].name,
                email: get_user[0].email,
                profile_img: (get_user[0].profile_img) ? get_user[0].profile_img : 'none',
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