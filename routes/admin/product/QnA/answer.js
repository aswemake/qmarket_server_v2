var express = require('express');
var router = express.Router();

var admin = require('firebase-admin');
var serviceAccount = require('../../../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Question = require('../../../../schemas/question');
let Answer = require('../../../../schemas/answer');
let Notification = require('../../../../schemas/notification');

router.get('/:product_id', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        let { product_id } = req.params;
        if (!product_id) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                let data = [];
                let query = 'SELECT name, nickname FROM users WHERE user_idx = ?'

                let question = await Question.find({ product_idx: product_id }).sort({ created_at: -1 });
                if (!question) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_PRODUCT));
                } else {
                    for (let i = 0; i < question.length; i++) {
                        let answer = await Answer.findOne({ question_idx: question[i]._id }).select({ content: 1 }).sort({ created_at: -1 });
                        if (!answer) {
                            var answer_data = null;
                        } else {
                            var answer_data = answer.content;
                        }
                        console.log(answer);
                        let question_data = new Object();
                        // 질문 작성자 구하기
                        let getName = await connection.query(query, [question[i].user_idx]);
                        if (getName[0].name == null) {
                            var name = getName[0].nickname;
                        } else {
                            var name = getName[0].name;
                        }
                        question_data = {
                            question_id: question[i]._id,
                            name: name,
                            category: question[i].category,
                            content: question[i].content,
                            is_answered: question[i].is_answered,
                            answer: answer_data
                        }
                        data.push(question_data);
                    }
                    console.log(data);
                    res.render('answer', { data });
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

router.post('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        console.log(req);
        let { question_id } = req.query;
        let { content } = req.body;
        if (!question_id || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                var created_at = Date.now() + (3600000 * 9);
                let answer = new Answer({
                    question_idx: question_id,
                    user_idx: 1,
                    content: content,
                    created_at: created_at
                })
                const question_answer_save_result = await answer.save();
                if (!question_answer_save_result) {
                    console.log("삽입 실패");
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                } else {
                    console.log("삽입 성공");
                    await Question.updateOne({ _id: question_id }, { $set: { is_answered: true } });

                    let question = await Question.find({ _id: question_id });
                    // 알림 보낼 토큰 찾기
                    if (!admin.apps.length) {
                        admin.initializeApp({
                            credential: admin.credential.cert(serviceAccount),
                        });
                    }
                    let find_token = 'SELECT fcm_token FROM users WHERE user_idx = ?'
                    let get_Token = await connection.query(find_token, [question[0].user_idx]);
                    if (get_Token[0]) {
                        let message = {
                            notification: {
                                title: '안녕하세요 큐마켓입니다.',
                                body: '고객님께서 문의주신 상품에 답변이 달렸습니다.'
                            },
                            token: get_Token[0].fcm_token
                        }
                        // 해당 구문 실행시 디바이스로 메세지 전송
                        admin.messaging().send(message)
                            .then(response => {
                                console.log("응답")
                                console.log(response)
                                let notification = new Notification({
                                    user_idx: question[0].user_idx,
                                    type: '큐마켓',
                                    name: '답변이 완료되었습니다.',
                                    content: question[0].content,
                                    link: {
                                        link_type: 'product_idx',
                                        link_address: question[0].product_idx
                                    },
                                    created_at: Date.now() + (3600000 * 9)
                                })
                                notification.save();
                            })
                            .catch(error => {
                                console.log("오류")
                                console.log(error)
                            })
                    }
                    res.status(200).json(utils.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
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