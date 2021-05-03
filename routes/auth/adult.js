var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

// 성인인증 여부 확인
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let is_adult;
            let query = 'SELECT imp_uid FROM users WHERE user_idx = ?';
            let result = await connection.query(query, [user_idx]);
            if (!result[0].imp_uid) {
                is_adult = false;
            } else {
                is_adult = true;
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, is_adult));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 성인인증 등록
router.post('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { imp_uid, success } = req.body;
    if (!user_idx || !imp_uid || !success) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        if (success === false) {
            res.status(200).json(utils.successFalse(statusCode.FORBIDDEN, resMessage.SAVE_FAIL));
        } else {
            try {
                var connection = await pool.getConnection();
                let query = 'UPDATE users SET imp_uid = ? WHERE user_idx = ?';
                let result = await connection.query(query, [imp_uid, user_idx]);
                if (result.affectedRows === 1) {
                    res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.FORBIDDEN, resMessage.SAVE_FAIL));
                }
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})

module.exports = router;
