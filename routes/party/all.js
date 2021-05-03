var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const moment = require('moment');

// 몽고 DB Schema
const Party = require('../../schemas/party');
const Location = require('../../schemas/location');
const Like = require('../../schemas/like');
const Hashtag = require('../../schemas/hashtag');

router.get('/', async (req, res) => {
    let { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let party_arr = [];
            let hashtag_arr = [];

            // 반상회 해시태그 구하기
            var hashtag = await Hashtag.find().sort({ "count": -1 })
            for (let k = 0; k < hashtag.length; k++) {
                hashtag_arr[k] = hashtag[k].name
            }

            // 현재 시간 구하기(한국 시간 기준)
            var current_day = moment(new Date(Date.now() + (3600000 * 9))).startOf('day');
            console.log(`current_day: ${current_day.startOf('day')}`);

            // 반상회 가까운 거리순 조회
            let near_location = await Location.find({
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        }
                    }
                }
            })
            if (!near_location[0]) {
                console.log("근처에 반상회가 존재하지 않습니다.");
            } else {
                let cnt = 0;
                for (let i = 0; i < near_location.length; i++) {
                    let near_party = await Party.find({ location_idx: near_location[i]._id, is_show: true });
                    if (!near_party[0]) {
                        console.log("일치하는 반상회가 없습니다.");
                    } else {
                        // 반상회 시작날짜 구하기
                        for (let j = 0; j < near_party.length; j++) {
                            let party_date = moment(near_party[j].start_time[near_party[j].episode]).startOf('day');
                            // 반상회 남은날짜 구하기
                            let left_date = party_date.diff(current_day, 'days');
                            // 반상회 좋아요 개수 구하기
                            let count_like = await Like.countDocuments({ party_idx: near_party[j]._id });
                            party_arr[cnt] = {
                                party_idx: near_party[j]._id,
                                main_img: near_party[j].main_img,
                                name: near_party[j].name,
                                location: near_location[i].name,
                                left_date: left_date,
                                like: count_like,
                                is_finished: near_party[j].is_finished
                            }
                            cnt++;
                        }
                    }
                }
                let data = {
                    hashtag: hashtag_arr,
                    party: party_arr,
                }
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;