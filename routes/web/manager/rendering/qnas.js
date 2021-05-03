var express = require('express');
var router = express.Router({ mergeParams: true });
var mongoose = require('mongoose');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product_v2');
let QnA = require('../../../../schemas/qna');

// QnA 리스트 조회 API
router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const default_count = 15;
        const { partner_idx } = req.params;
        const { page } = req.query;
        if (!partner_idx || !page) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();
                // 서버에 올라가면 page datatype이 아마도 integer로 바뀔듯
                let data = { current_page_num: parseInt(page), last_page_num: 0, partner_idx: partner_idx, qnas: [] }
                let get_user_name_query = `SELECT IFNULL(name, nickname) AS name FROM users WHERE user_idx = ?`;

                // qna-product_v2 join query
                // 출력: qna_id, product_idx, user_idx, question, answer, created_at, update_at, product_v2.partner_idx.[]
                let qnas = await QnA.aggregate([
                    {
                        $lookup: {
                            from: "product_v2",
                            localField: "product_idx",
                            foreignField: "_id",
                            as: "product"
                        }
                    },
                    { $match: { "product.partner_idx": mongoose.Types.ObjectId(partner_idx) } }
                ]).sort({ created_at: -1 });

                // offset, count 설정
                let offset = (page - 1) * default_count;
                let count = (qnas.length < offset + default_count) ? qnas.length - offset : default_count;
                for (let i = offset; i < offset + count; i++) {
                    let get_user_name_result = await connection.query(get_user_name_query, qnas[i].user_idx);
                    if (get_user_name_result.length < 1) throw new Error('incorrect user_idx');
                    let user_name = get_user_name_result[0].name;
                    let qna = {
                        qna_idx: qnas[i]._id,
                        main_img: qnas[i].product[0].img[0],
                        product_detail_name: qnas[i].product[0].detail_name,
                        writer: user_name,
                        question: qnas[i].question,
                        answer: qnas[i].answer,
                        state: (qnas[i].answer) ? "답변완료" : "답변대기"
                    }
                    data.qnas.push(qna);
                }
                data.last_page_num = (qnas.length % default_count == 0) ? Math.floor(qnas.length / default_count) : Math.floor(qnas.length / default_count) + 1;
                res.render('manager/QnA', { data });
            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})
module.exports = router;