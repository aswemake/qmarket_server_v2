var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const jwt = require('../../module/jwt');

const QnA = require('../../schemas/qna');

// qna 리스트 조회 API
router.get('/', async (req, res) => {
    const { product_idx } = req.params;
    if (!product_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let data = [];
            let get_user_name_query = 'SELECT name, nickname FROM users WHERE user_idx = ?';

            // qna 출력
            let qnas = await QnA.find({ product_idx: product_idx }).sort({ created_at: -1 });
            for (let i = 0; i < qnas.length; i++) {
                let users = await connection.query(get_user_name_query, [qnas[i].user_idx]);
                let user_name = (users[0].name) ? users[0].name : users[0].nickname;
                let qna = {
                    qna_idx: qnas[i]._id,
                    writer: user_name,
                    question: qnas[i].question,
                    answer: (qnas[i].answer) ? qnas[i].answer : "none",
                    state: (qnas[i].answer) ? "답변완료" : "답변대기",
                    created_at: qnas[i].created_at
                }
                data.push(qna);
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// qna 등록 API
router.post('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    const { product_idx } = req.params;
    const { question } = req.body;
    if (!product_idx || !question) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            const qna = new QnA({
                product_idx: product_idx,
                user_idx: user_idx,
                question: question,
                answer: null,
                created_at: Date.now() + (3600000 * 9),
                updated_at: Date.now() + (3600000 * 9)
            });
            const qna_save_result = await qna.save();
            if (!qna_save_result) {
                console.log("삽입 실패");
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
            } else {
                console.log("삽입 성공");
                res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;