var express = require('express');
var router = express.Router();

const pool = require('../../config/dbConfig');

router.post('/', async (req, res) => {
    let { token, user_idx } = req.body;
    console.log(`token: ${token}`);
    console.log(`user_idx: ${user_idx}`);
    try {
        var connection = await pool.getConnection();
        let query = 'SELECT token FROM market_token WHERE is_admin = 1 AND user_idx = ?';
        let server_token = await connection.query(query, [user_idx]);
        console.log(server_token[0]);
        if (!server_token[0]) {
            let save_token_query = 'INSERT INTO market_token (token, user_idx) VALUES (?, ?)';
            let save_token = await connection.query(save_token_query, [token, user_idx]);
            console.log("토큰이 저장되었습니다");
        } else if (server_token[0].token !== token) {
            let update_token_query = 'UPDATE market_token SET token = ? WHERE user_idx = ?';
            let update_token = await connection.query(update_token_query, [token, user_idx]);
            console.log("토큰이 업데이트 되었습니다");
        } else {
            console.log("토큰을 업데이트 할 필요가 없습니다");
        }
    } catch (err) {
        console.log(err);
    } finally {
        connection.release();
    }
})

module.exports = router;