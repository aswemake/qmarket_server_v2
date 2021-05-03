var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const moment = require('moment');

// 몽고 DB Schema
const Party = require('../../schemas/party');
const Product = require('../../schemas/product');
const Banner = require('../../schemas/banner');
const Location = require('../../schemas/location');
const Category = require('../../schemas/category');
const Like = require('../../schemas/like');
const Purchasable_location = require('../../schemas/purchasable_location');

router.get('/', async (req, res) => {
    try {
        let { latitude, longitude, sido, sigungu } = req.query;
        if (!latitude || !longitude || !sido || !sigungu) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {

            let banner_data = [];
            let near_party_data = [];
            let recommend = [];
            let best = [];
            let self = [];

            // 메인 화면 배너 이미지 찾기
            var banner = await Banner.find({ show_main: true }).sort({ created_at: -1 });
            for (var i = 0; i < banner.length; i++) {
                banner_data[i] = {
                    banner_id: banner[i]._id,
                    main_img: banner[i].main_img,
                    link: banner[i].link
                }
            }

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
                        },
                        $maxDistance: 10000
                    }
                }
            })
            if (!near_location[0]) {
                console.log("근처에 반상회가 존재하지 않습니다.");
            } else {
                let cnt = 0;
                for (var i = 0; i < near_location.length; i++) {
                    var near_party = await Party.find({ location_idx: near_location[i]._id, is_show: true });
                    if (!near_party[0]) {
                        console.log("일치하는 반상회가 없습니다.");
                    } else {
                        let start_time;
                        if (near_party[0].episode >= near_party[0].start_time.length) {
                            start_time = near_party[0].start_time[(near_party[0].episode) - 1];
                        } else {
                            start_time = near_party[0].start_time[near_party[0].episode];
                        }
                        // 반상회 시작날짜 구하기
                        let party_date = moment(start_time).startOf('day');
                        // 반상회 남은날짜 구하기
                        let left_date = party_date.diff(current_day, 'days');
                        // 상품 좋아요 개수 구하기
                        let count_like = await Like.countDocuments({ party_idx: near_party[0]._id });
                        near_party_data[cnt] = {
                            party_id: near_party[0]._id,
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

            // 배송 가능 지역 검사

            // 시,도 해당 지역 검사
            let check_sido = await Purchasable_location.find({ sido: sido });
            if (!check_sido[0]) {
                let data = {
                    banner: banner_data,
                    n_party: near_party_data,
                    recommend: recommend,
                    best: best,
                    self: self
                }
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.READ_SUCCESS, data));
            } else {
                var sale_ratio; // 상품 할인율

                // 시,군,구 해당 지역 검사
                let check_sigungu = await Purchasable_location.find({}).in('sigungu', [sigungu])
                if (check_sigungu[0]) {
                    // 전체 상품 랜덤하게 추출
                    let find_product = await Product.aggregate([{ $sample: { size: 4 } }])
                    for (let i = 0; i < find_product.length; i++) {
                        if(!find_product[i].event_sale_ratio){
                            sale_ratio = find_product[i].sale_ratio
                        } else {
                            sale_ratio = find_product[i].event_sale_ratio
                        }
                        // 상품 좋아요 개수 구하기
                        let count_like = await Like.countDocuments({ product_idx: find_product[i]._id });
                        let product_data = {
                            product_idx: find_product[i]._id,
                            main_img: find_product[i].img[0],
                            detail_name: find_product[i].detail_name,
                            sale_ratio: Math.floor(sale_ratio * 100),
                            price: find_product[i].price,
                            saled_price: find_product[i].saled_price,
                            is_adult: find_product[i].is_adult,
                            like: count_like
                        }
                        recommend.push(product_data);
                    }

                    // 핫딜(100원) 상품 구하기
                    let find_product2 = await Product.aggregate([{ $match: { saled_price: 100 } }, { $sample: { size: 2 } }]);
                    for (let i = 0; i < find_product2.length; i++) {
                        // 상품 좋아요 개수 구하기
                        let count_like = await Like.countDocuments({ product_idx: find_product2[i]._id });
                        let product_data = {
                            product_idx: find_product2[i]._id,
                            main_img: find_product2[i].img[0],
                            detail_name: find_product2[i].detail_name,
                            sale_ratio: Math.floor(find_product2[i].event_sale_ratio * 100),
                            price: find_product2[i].price,
                            saled_price: find_product2[i].saled_price,
                            is_adult: find_product2[i].is_adult,
                            like: count_like
                        }
                        best.push(product_data);
                    }

                    // 직접 만든 상품 구하기
                    let self_category = await Category.aggregate([{ $match: { type: '우리동네 가게' } }, { $unwind: "$product" }, { $sample: { size: 5 } }]);
                    for (let i = 0; i < self_category.length; i++) {
                        let find_product = await Product.find({ _id: self_category[i].product });
                        if(!find_product[0].event_sale_ratio){
                            sale_ratio = find_product[0].sale_ratio
                        } else {
                            sale_ratio = find_product[0].event_sale_ratio
                        }
                        // 상품 좋아요 개수 구하기
                        let count_like = await Like.countDocuments({ product_idx: find_product[0]._id });
                        let product_data = {
                            product_idx: find_product[0]._id,
                            main_img: find_product[0].img[0],
                            detail_name: find_product[0].detail_name,
                            sale_ratio: Math.floor(sale_ratio * 100),
                            price: find_product[0].price,
                            saled_price: find_product[0].saled_price,
                            is_adult: find_product[0].is_adult,
                            like: count_like
                        }
                        self.push(product_data);
                    }
                    let data = {
                        banner: banner_data,
                        n_party: near_party_data,
                        recommend: recommend,
                        best: best,
                        self: self
                    }
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
                } else {
                    let data = {
                        banner: banner_data,
                        n_party: near_party_data,
                        recommend: recommend,
                        best: best,
                        self: self
                    }
                    res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.READ_SUCCESS, data));
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;