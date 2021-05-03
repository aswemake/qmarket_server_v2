var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const cryptoPassword = require('../../module/cryptoPassword');
const admin_pool = require('../../config/admin_dbConfig');

router.post('/', async (req, res) => {
    let { id, password } = req.body;
    try {
        if (!id || !password) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await admin_pool.getConnection();

            // users의 user_id, name 정보 불러오기
            let query = 'SELECT user_idx, name, id, password, salt FROM users WHERE id = ?';
            let result = await connection.query(query, [id]);

            // 존재하지 않는 아이디의 경우
            if (!result[0]) {
                res.status(401).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_USER));
                // 패스워드가 일치하지 않는 경우
            } else {
                salt = result[0].salt;
                const db_password = result[0].password;
                password = await cryptoPassword.hashedPassword(password, salt);
                if (password !== db_password) {
                    res.status(401).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_PASSWORD));
                    // 패스워드가 일치하는 경우 -> 로그인 성공
                } else {
                    res.cookie("user", [result[0].user_idx, result[0].name], {
                        expires: new Date(Date.now() + (3600000 * 72)),
                        httpOnly: true,
                        signed: true
                    });
                    res.redirect("./");
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})
module.exports = router;