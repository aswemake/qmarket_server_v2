var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

let Question = require('../../../../schemas/question');
let Product = require('../../../../schemas/product');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let question = await Question.aggregate([
                { '$group': { '_id': '$product_idx', 'count': { '$sum': 1 } } }]);
            console.log(question);
            let not_finished_arr = [];
            let finished_arr = [];
            for (let i = 0; i < question.length; i++) {
                let product = await Product.find({ _id: question[i]._id }).select('_id detail_name img').sort({ created_at: -1 });
                if (!product) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_PRODUCT));
                } else {
                    // 답변이 완료된 질문 개수
                    let find_count = await Question.countDocuments({ product_idx: question[i]._id, is_answered: true });
                    product_data = {
                        product_id: product[0]._id,
                        img: product[0].img[0],
                        detail_name: product[0].detail_name,
                        total_count: question[i].count,
                        unread_count: find_count
                    }
                    // 답변이 미완료된 경우
                    if (question[i].count == find_count) {
                        finished_arr.push(product_data);
                        // 답변이 모두 완료된 경우
                    } else {
                        not_finished_arr.push(product_data);
                    }
                }
            }
            // 미완료 배열 + 완료 배열
            let data = not_finished_arr.concat(finished_arr);
            res.render('QnA', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})
module.exports = router;