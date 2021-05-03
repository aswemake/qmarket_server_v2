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
            let qmoney_arr = [];
            let query = 'SELECT qmoney FROM users WHERE user_idx = ?'
            let get_money = await connection.query(query, [user_idx]);
            let query2 = 'SELECT * FROM qmoney WHERE user_idx = ? AND created_at >= DATE_ADD(NOW(), INTERVAL -3 MONTH) '
                + 'ORDER BY created_at DESC';
            let result = await connection.query(query2, [user_idx]);

            for (let i = 0; i < result.length; i++) {
                console.log(result[i]);
                let qmoney_object = new Object();
                qmoney_object = {
                    price: result[i].money,
                    content: result[i].content,
                    created_at: result[i].created_at
                }
                qmoney_arr.push(qmoney_object);
            }
            let data = {
                qmoney: get_money[0].qmoney,
                history: qmoney_arr
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