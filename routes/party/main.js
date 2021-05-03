var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const moment = require('moment');

const Party = require('../../schemas/party');
const Banner = require('../../schemas/banner');
const Feed = require('../../schemas/feed');
const Location = require('../../schemas/location');
const Like = require('../../schemas/like');

router.get('/', async (req, res) => {
    try {
        // 현재 시간 구하기(한국 시간 기준)
        var current_day = moment(new Date(Date.now() + (3600000 * 9))).startOf('day');
        console.log(`current_day: ${current_day.startOf('day')}`);
        let party_arr = [];
        let feed_arr = [];
        let banner_arr = [];

        // 반상회 배너 구하기
        var banner = await Banner.find().or([{ type: 1 }, { type: 3 }]).sort({ created_at: -1 });
        if (!banner[0]) {
            console.log("배너가 존재하지 않습니다");
        } else {
            for (let i = 0; i < banner.length; i++) {
                let banner_data = {
                    main_img: banner[i].main_img,
                    link: banner[i].link
                }
                banner_arr.push(banner_data);
            }
        }

        let party = await Party.aggregate([{ $match: { is_finished: false } }, { $sample: { size: 8 } }]);
        for (let i = 0; i < party.length; i++) {
            let party_data = new Object();
            // 반상회 장소 이름 구하기
            let location = await Location.find({ _id: party[i].location_idx }).select({ name: 1 });
            // 반상회 시작날짜 구하기
            let party_date = moment(party[i].start_time[party[i].episode]).startOf('day');
            // 반상회 남은날짜 구하기
            let left_date = party_date.diff(current_day, 'days');
            // 반상회 좋아요 개수 구하기
            let count_like = await Like.countDocuments({ party_idx: party[i]._id });
            party_data = {
                party_idx: party[i]._id,
                main_img: party[i].main_img,
                name: party[i].name,
                location: location[0].name,
                left_date: left_date,
                like: count_like
            }
            party_arr.push(party_data);
        }
        let feed = await Feed.aggregate([{ $sample: { size: 5 } }]);
        for (let j = 0; j < feed.length; j++) {
            let feed_data = new Object();
            // 해당 반상회 구하기
            let party = await Party.find({ _id: feed[j].party_idx }).select({ name: 1, location_idx: 1 });
            // 반상회 장소 이름 구하기
            let location = await Location.find({ _id: party[0].location_idx }).select({ name: 1 });
            feed_data = {
                party_idx: feed[j].party_idx,
                feed_idx: feed[j]._id,
                main_img: feed[j].img[0],
                name: party[0].name,
                location: location[0].name
            }
            feed_arr.push(feed_data);
        }
        let data = {
            banner: banner_arr,
            party: party_arr,
            feed: feed_arr
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;    