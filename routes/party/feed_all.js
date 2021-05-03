var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const moment = require('moment');

// 몽고 DB Schema
const Feed = require('../../schemas/feed');
const Party = require('../../schemas/party');
const Location = require('../../schemas/location');
const Hashtag = require('../../schemas/hashtag');

router.get('/', async (req, res) => {
    try {
        let hashtag_arr = [];
        let feed_arr = [];

        // 반상회 해시태그 구하기
        var hashtag = await Hashtag.find().sort({ "count": -1 })
        for (let k = 0; k < hashtag.length; k++) {
            hashtag_arr[k] = hashtag[k].name
        }
        // 반상회 피드 구하기
        let feed = await Feed.find({}).select({ party_idx: 1, img: 1 });
        if (!feed[0]) {
            res.status(200).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.NULL_PRODUCT));
        } else {
            for (let i = 0; i < feed.length; i++) {
                let party = await Party.find({ _id: feed[i].party_idx }).select({ location_idx: 1, name: 1 });
                let location = await Location.find({ _id: party[0].location_idx }).select({ name: 1 });
                let feed_data = {
                    party_idx: feed[i].party_idx,
                    feed_idx: feed[i]._id,
                    main_img: feed[i].img[0],
                    name: party[0].name,
                    location: location[0].name
                }
                feed_arr.push(feed_data);
            }
        }
        let data = {
            hashtag: hashtag_arr,
            feed: feed_arr
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})


module.exports = router;