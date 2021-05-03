var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const pool = require('../../../config/dbConfig');
const jwt = require('../../../module/jwt');

const Question = require('../../../schemas/question');
const Answer = require('../../../schemas/answer');

// QnA 보기
router.get('/', async (req, res) => {
    let { product_idx } = req.query;
    if (!product_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let question_data = [];
            let query = 'SELECT name, nickname FROM users WHERE user_idx = ?'

            // 질문 구하기
            var question = await Question.find({ product_idx: product_idx }).sort({ created_at: 'desc' });
            console.log(question);
            for (var i = 0; i < question.length; i++) {
                var question_Arr = new Array();
                // 질문 작성자 구하기
                let getName = await connection.query(query, [question[i].user_idx]);
                console.log(getName[0]);
                if (getName[0].nickname == null) {
                    var name = getName[0].name;
                } else {
                    var name = getName[0].nickname;
                }
                // 답변 객체 구하기
                var getAnswer = await Answer.find({ question_idx: question[i]._id });
                for (var j = 0; j < getAnswer.length; j++) {
                    let answer_data = new Object();
                    let getName = await connection.query(query, [getAnswer[j].user_idx]);
                    console.log(getName[0]);
                    if (getName[0].name == null) {
                        var answer_name = getName[0].nickname;
                    } else {
                        var answer_name = getName[0].name;
                    }
                    answer_data = {
                        answer_idx: getAnswer[j]._id,
                        name: answer_name,
                        content: getAnswer[j].content,
                        created_at: getAnswer[j].created_at
                    }
                    question_Arr.push(answer_data);
                    if (getAnswer[0]) {
                        await Question.updateOne({ _id: question[i]._id }, { $set: { is_answered: true } });
                    } else {
                        await Question.updateOne({ _id: question[i]._id }, { $set: { is_answered: false } });
                    }
                }
                question_data[i] = {
                    question_idx: question[i]._id,
                    name: name,
                    content: question[i].content,
                    created_at: question[i].created_at,
                    is_answered: question[i].is_answered,
                    answer: question_Arr
                }
            }
            console.log(question_data);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, question_data));

        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 질문 등록
router.post('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { product_idx } = req.query;
        let { category, content } = req.body;
        if (!product_idx || !category || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            const question = new Question({
                product_idx: product_idx,
                user_idx: user_idx,
                category: category,
                content: content,
                is_answered: false,
                created_at: Date.now() + (3600000 * 9)
            })
            const question_save_result = await question.save();
            if (!question_save_result) {
                console.log("삽입 실패");
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
            } else {
                console.log("삽입 성공");
                res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;