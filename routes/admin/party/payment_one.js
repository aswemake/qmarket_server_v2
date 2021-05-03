var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const pool = require('../../../config/dbConfig');

let Party = require('../../../schemas/party');

router.get('/:party_id', async (req, res) => {
    console.log("confirm");
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { party_id } = req.params;
            if (!party_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                console.log(party_id);
                let data = [];
                var connection = await pool.getConnection();
                let query = 'SELECT party_id, user_idx, count, payment, created_at FROM orders_parties WHERE party_id = ?';
                let query2 = 'SELECT name FROM users WHERE user_idx = ?';
                let payment_info = await connection.query(query, [party_id]);
                for (let i = 0; i < payment_info.length; i++) {
                    let payment_data = new Object();
                    let get_party = await Party.find({ _id: payment_info[i].party_id }).select({ name: 1, no: 1 });
                    let get_name = await connection.query(query2, [payment_info[i].user_idx]);
                    console.log(get_party);
                    payment_data = {
                        party_no: get_party[0].no,
                        party_name: get_party[0].name,
                        user_name: get_name[0].name,
                        count: payment_info[i].count,
                        payment: payment_info[i].payment,
                        created_at: payment_info[i].created_at
                    }
                    data.push(payment_data);
                }
                console.log(data);
                res.render('party_payment', { data });
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;