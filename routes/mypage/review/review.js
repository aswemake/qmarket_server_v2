var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

let Product = require('../../../schemas/product');
let Review = require('../../../schemas/review');
let Like = require('../../../schemas/like');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let review_arr = [];
            let review = await Review.find({ user_idx: user_idx });
            for (let i = 0; i < review.length; i++) {
                let product = await Product.find({ _id: review[i].idx });
                if (!product[0]) {
                    console.log("반상회 의견입니다.");
                } else {
                    let count_like = await Like.countDocuments({ review_idx: review[i]._id });
                    let data = {
                        review_idx: review[i]._id,
                        main_img: product[0].img[0],
                        name: product[0].detail_name,
                        score: review[i].score,
                        content: review[i].content,
                        created_at: review[i].created_at,
                        like: count_like
                    }
                    review_arr.push(data);
                }
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, review_arr));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;