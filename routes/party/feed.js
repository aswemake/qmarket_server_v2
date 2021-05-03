var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const upload = require('../../config/multer');

// 몽고 DB Schema
const Feed = require('../../schemas/feed');
const Party = require('../../schemas/party');
const Location = require('../../schemas/location');
const Like = require('../../schemas/like');

// 반상회 피드 상세정보 조회
router.get('/', async (req, res) => {
    try {
        let { feed_idx } = req.query;
        if (!feed_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var feed = await Feed.find({ _id: feed_idx });
            if (!feed[0]) {
                res.status(200).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.NULL_PRODUCT));
            } else {
                let party = await Party.find({_id: feed[0].party_idx}).select({name: 1, leader: 1, start_date: 1, location_idx: 1, shared_count: 1});
                let location = await Location.find({_id: party[0].location_idx});
                let count_like = await Like.countDocuments({ party_idx: feed[0].party_idx });
                let data = {
                    party_name: party[0].name,
                    leader: party[0].leader,
                    start_date: party[0].start_date,
                    location_name: location[0].name,
                    address: location[0].address,
                    like: count_like,
                    shared_count: party[0].shared_count,
                    img: feed[0].img,
                    name: feed[0].name,
                    content: feed[0].content,
                    created_at: feed[0].created_at,
                }
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 반상회 피드 등록
router.post('/', jwt.isLoggedIn, upload.array('imgs'), async (req, res) => {
    try {
        let { user_idx } = req.decoded;
        let { party_idx } = req.query;
        let { name, content } = req.body;
        if (!user_idx || !party_idx || !name || !content) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var created_at = Date.now() + (3600000 * 9);
            const imgs = req.files;
            let img_arr = [];
            for (let i = 0; i < imgs.length; i++) {
                img_arr[i] = imgs[i].location;
                console.log(imgs[i].location);
            }
            console.log(img_arr);
            const feed = new Feed({
                party_idx: party_idx,
                name: name,
                content: content,
                img: img_arr,
                created_at: created_at
            })
            const feed_save_result = await feed.save();
            if (!feed_save_result) {
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
