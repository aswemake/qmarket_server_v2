var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

const Question = require('../../schemas/question');
const Answer = require('../../schemas/answer');
const Product = require('../../schemas/product');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            var name, profile_img;
            let query = 'SELECT name, nickname, profile_img FROM users WHERE user_idx = ?'
            let get_question = await Question.find({ user_idx: user_idx });
            let question_arr = [];
            for (let i = 0; i < get_question.length; i++) {
                let question_object = new Object();
                let answer_arr = [];
                let get_product = await Product.find({ _id: get_question[i].product_idx }, { img: 1, detail_name: 1 });
                console.log(get_product[0]);
                let get_answer = await Answer.find({ question_idx: get_question[i]._id });
                for (let j = 0; j < get_answer.length; j++) {
                    let answer_object = new Object();
                    let get_user = await connection.query(query, [get_answer[j].user_idx]);
                    if (get_user[0].name == null) {
                        name = get_user[0].nickname;
                    } else {
                        name = get_user[0].name;
                    }
                    if (get_user[0].profile_img == null) {
                        profile_img = null;
                    } else {
                        profile_img = get_user[0].profile_img;
                    }
                    answer_object = {
                        name: name,
                        profile_img: profile_img,
                        created_at: get_answer[j].created_at,
                        content: get_answer[j].content
                    }
                    answer_arr.push(answer_object);
                }
                question_object = {
                    main_img: get_product[0].img[0],
                    created_at: get_question[i].created_at,
                    detail_name: get_product[0].detail_name,
                    content: get_question[i].content,
                    is_answered: get_question[i].is_answered,
                    answer: answer_arr
                }
                question_arr.push(question_object);
            }
            console.log(question_arr)
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, question_arr));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})
module.exports = router;