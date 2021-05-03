var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const moment = require('moment');

// 몽고 DB Schema
const Party = require('../../schemas/party');
const Product = require('../../schemas/product');
const Location = require('../../schemas/location');
const Hashtag = require('../../schemas/hashtag');
const Like = require('../../schemas/like');
const Search_data = require('../../schemas/search_data');
const Purchasable_location = require('../../schemas/purchasable_location');

router.get('/', async (req, res) => {
    try {
        let { latitude, longitude, sido, sigungu, search } = req.query;
        if (!latitude || !longitude || !sido || !sigungu || !search) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let party_data = [];
            let product_data = [];

            // 현재 시간 구하기(한국 시간 기준)
            var current_day = moment(new Date(Date.now() + (3600000 * 9))).startOf('day');
            console.log(`current_day: ${current_day.startOf('day')}`);

            // 사용자로부터 10km 이내 반상회 찾기
            var near_location = await Location.find({
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
                for (var i = 0; i < near_location.length; i++) {
                    var near_party = await Party.find({
                        $and: [{ location_idx: near_location[i]._id, is_show: true }],
                        $or: [{ name: { $regex: search } }, { content: { $regex: search } }, { hashtag: { $regex: search } }],
                    })
                    if (!near_party[0]) {
                        console.log("해당하는 반상회가 없습니다.");
                    } else {
                        // 반상회 시작날짜 구하기
                        let party_date = moment(near_party[0].start_time[near_party[0].episode]).startOf('day');
                        // 반상회 남은날짜 구하기
                        let left_date = party_date.diff(current_day, 'days');
                        let count_like = await Like.countDocuments({ party_idx: near_party[0]._id });
                        party_data[cnt] = {
                            party_idx: near_party[0]._id,
                            main_img: near_party[0].main_img,
                            name: near_party[0].name,
                            location: near_location[i].name,
                            left_date: left_date,
                            is_finished: near_party[0].is_finished,
                            like: count_like
                        }
                        cnt++;
                    }
                }
            }

            // 해시태그 검색어 증가
            let count_up = await Hashtag.updateOne({ name: search }, { $inc: { count: 1 } });

            // 검색어 저장
            let find_search = await Search_data.find({ word: search });
            if (!find_search[0]) {
                let search_data = new Search_data({
                    word: search
                })
                let save_search_data = await search_data.save();
            } else {
                let count_up_word = await Search_data.updateOne({ word: search }, { $inc: { count: 1 } });
            }

            // 시,도 해당 지역 검사
            let check_sido = await Purchasable_location.find({ sido: sido });
            if (!check_sido[0]) {
                console.log('인천이 아닙니다.')
            } else {
                var sale_ratio; // 상품 할인율

                // 시,군,구 해당 지역 검사
                let check_sigungu = await Purchasable_location.find({}).in('sigungu', [sigungu])
                if (check_sigungu[0]) {
                    // 생필품 보여주기
                    var product = await Product.find({
                        $or: [{ name: { $regex: search } }, { detail_name: { $regex: search } }, { hashtag: { $regex: search } }],
                    });
                } else {
                    var product = [];
                }

                // 생필품 보여주기
                for (var i = 0; i < product.length; i++) {
                    if(!product[i].event_sale_ratio){
                        sale_ratio = product[i].sale_ratio
                    } else {
                        sale_ratio = product[i].event_sale_ratio
                    }
                    let count_like = await Like.countDocuments({ product_idx: product[i]._id });
                    product_data[i] = {
                        product_idx: product[i]._id,
                        main_img: product[i].img[0],
                        detail_name: product[i].detail_name,
                        price: product[i].price,
                        sale_ratio: Math.floor(sale_ratio * 100),
                        saled_price: product[i].saled_price,
                        is_adult: product[i].is_adult,
                        like: count_like
                    }
                }
            }

            const data = {
                party: party_data,
                product: product_data,
            }
            console.log(data);
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;