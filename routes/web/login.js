var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const cryptoPassword = require('../../module/cryptoPassword');
const admin_pool = require('../../config/admin_dbConfig');

router.post('/', async (req, res) => {
    let { id, password, type, fcm_token } = req.body;
    let permission = 100;
    try {
        if (!id || !password || !type) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await admin_pool.getConnection();
            let query = "";
            let query_manager = "";
            let result;
            // users의 user_id, name 정보 불러오기
            if (type == "admin") {
                query = 'SELECT user_idx, name, id, password, salt FROM users WHERE id = ?';
                result = await connection.query(query, [id]);
            } else if (type == "manager") {
                query_manager = 'SELECT user_idx, name, id, password, salt, market_idx FROM managers WHERE id = ? and permission = ?';
                permission = 200;
                result = await connection.query(query_manager, [id, permission]);
            } else if (type == "rider") {
                query_manager = 'SELECT user_idx, name, id, password, salt, market_idx FROM managers WHERE id = ? and permission = ?';
                result = await connection.query(query_manager, [id, permission]);
            }

            // 존재하지 않는 아이디의 경우
            if (!result[0]) {
                res.status(401).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_USER));
            } else {
                salt = result[0].salt;
                const db_password = result[0].password;
                password = await cryptoPassword.hashedPassword(password, salt);
                // 패스워드가 일치하지 않는 경우
                if (password !== db_password) res.status(401).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.INVALID_PASSWORD));
                // 패스워드가 일치하는 경우 -> 로그인 성공
                else {
                    let market_idx = "";
                    if (type == "manager") {
                        market_idx = result[0].market_idx;
                        let update_manager_fcm_token_query = 'UPDATE managers SET fcm_token = ? WHERE id = ?';
                        update_manager_fcm_token_query = await connection.query(update_manager_fcm_token_query, [fcm_token, id]);
                    } else if(type == "rider") {
                        market_idx = result[0].market_idx;
                    }
                    res.cookie("user", [result[0].user_idx, result[0].name, type, market_idx], {
                        expires: new Date(Date.now() + (3600000 * 72)),
                        httpOnly: true,
                        signed: true,
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