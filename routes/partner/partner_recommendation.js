var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');

// 마트 추천 API
router.post('/', async (req, res) => {
    const { phone, mart_name, address} = req.body;
    if (!phone || !mart_name || !address) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();

            let insert_mart_recommendation_query = "INSERT INTO mart_recommendation (phone, mart_name, address) VALUES (?, ?, ?)";
            let insert_mart_recommendation_result = await connection.query(insert_mart_recommendation_query, [phone, mart_name, address]);
            if (insert_mart_recommendation_result.affectedRows !== 1) throw new Error("insert mart_recommendation table error");

            res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        } catch (err) {
            console.log(err.message);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;