var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const pool = require('../../config/dbConfig');

// 몽고 DB Schema
const Party = require('../../schemas/party');
const enroll_Party = require('../../schemas/enroll_party');
const Location = require('../../schemas/location');
const Feed = require('../../schemas/feed');
const Review = require('../../schemas/review');
const Like = require('../../schemas/like');

router.get('/', async (req, res) => {
    try {
        let { party_idx } = req.query;
        if (!party_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var party = await Party.find({ _id: party_idx });
                console.log(party);
                if (!party[0]) {
                    res.status(200).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.NULL_PRODUCT));
                } else {
                    var connection = await pool.getConnection();
                    let query = 'SELECT name, nickname, profile_img FROM users WHERE user_idx = ?';
                    let name, location_name, location_address;
                    let member_arr = [];
                    let feed_arr = [];
                    let review_arr = [];
                    var temp_location = await Location.find({ _id: party[0].location_idx });
                    var temp_feed = await Feed.find({ party_idx: party_idx });
                    if (!temp_location[0]) {
                        location_name = '장소미정';
                        location_address = '장소미정';
                    } else {
                        location_name = temp_location[0].name,
                            location_address = temp_location[0].address
                    }
                    if (!temp_feed[0]) {
                        console.log("등록된 피드가 없습니다.");
                    } else {
                        for (let i = 0; i < temp_feed.length; i++) {
                            let feed_data = new Object();
                            feed_data = {
                                feed_idx: temp_feed[i]._id,
                                feed_img: temp_feed[i].img[0],
                                feed_name: temp_feed[i].name
                            }
                            feed_arr.push(feed_data);
                        }
                    }
                    // 반상회 의견 조회
                    var review = await Review.find({ idx: party_idx });
                    if (!review[0]) {
                        console.log("등록된 리뷰가 없습니다.");
                    } else {
                        for (let j = 0; j < review.length; j++) {
                            let review_data = new Object();
                            let get_user = await connection.query(query, [review[j].user_idx]);
                            if (get_user[0].nickname == null) {
                                name = get_user[0].name;
                            } else {
                                name = get_user[0].nickname;
                            }
                            console.log(name);
                            review_data = {
                                name: name,
                                content: review[j].content,
                                created_at: review[j].created_at
                            }
                            review_arr.push(review_data);
                        }
                    }
                    // 등록된 멤버 조회
                    let find_user = await enroll_Party.find({ party_idx: party_idx });
                    for (let k = 0; k < find_user.length; k++) {
                        if (find_user[k].enroll[party[0].episode] == 1) {
                            let get_user = await connection.query(query, [find_user[k].user_idx]);
                            if (get_user[0].nickname == null) {
                                name = get_user[0].name;
                            } else {
                                name = get_user[0].nickname;
                            }
                            let member = {
                                name: name,
                                profile_img: get_user[0].profile_img
                            }
                            member_arr.push(member);
                        }
                    }
                    // 좋아요 개수 구하기
                    let like = await Like.find({ party_idx: party_idx }).countDocuments();

                    let party_data = {
                        party_img: party[0].img,
                        party_name: party[0].name,
                        location: location_name,
                        address: location_address,
                        leader: party[0].leader,
                        date: party[0].start_date,
                        start_time: party[0].start_time,
                        content: party[0].content,
                        pattern: party[0].pattern,
                        member: {
                            max: party[0].max,
                            user: member_arr
                        },
                        is_finished: party[0].is_finished,
                        episode: party[0].episode,
                        shared_count: party[0].shared_count,
                        like: like,
                        feed: feed_arr,
                        review: review_arr
                    }
                    console.log(party_data);
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, party_data));
                }
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;