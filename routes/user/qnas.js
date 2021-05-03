var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

const QnA = require('../../schemas/qna');
const Product = require('../../schemas/product_v2');
const Partner = require('../../schemas/partner');

// 유저가 작성한 qna 리스트 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let data = [];
            let get_user_query = `SELECT IFNULL(name, nickname) AS name, IFNULL(profile_img, 'none') FROM users WHERE user_idx = ?`

            let qnas = await QnA.find({ user_idx: user_idx }).sort({ created_at: -1 });
            for (let i = 0; i < qnas.length; i++) {
                let product = await Product.find({ _id: qnas[i].product_idx }).select({ img: 1, detail_name: 1, partner_idx: 1 });
                if (product.length < 1) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_PRODUCT));
                } else {
                    let answer = [];
                    if (qnas[i].answer) {
                        let partner = await Partner.find({ _id: product[0].partner_idx }).select({ name: 1, img: 1 });
                        let answer_object = {
                            name: partner[0].name,
                            profile_img: partner[0].img,
                            created_at: qnas[i].updated_at,
                            content: qnas[i].answer
                        }
                        answer.push(answer_object);
                    }

                    let qna = {
                        main_img: product[0].img[0],
                        detail_name: product[0].detail_name,
                        created_at: qnas[i].created_at,
                        content: qnas[i].question,
                        is_answerd: (qnas[i].answer) ? true : false,
                        answer: answer
                    }
                    data.push(qna);
                }
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

module.exports = router;