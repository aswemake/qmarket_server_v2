var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Banner = require('../../schemas/banner');
const Address = require('../../schemas/address_matching');
const Partner = require('../../schemas/partner');
const Product = require('../../schemas/product_v2');

// 홈화면 조회 API
router.get('/', async (req, res) => {
    let { b_code, h_code } = req.query;
    if ((!b_code || !h_code) && (b_code && h_code)) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = new Object();
            let banners = [];
            const recommend_products_count = 20; // 추천 상품 리스트 갯수
            const best_sale_produdcts_count = 5; // 판매순 상품 리스트 갯수
            const one_hundred_deal_event_products_count = 6; // 100원딜 상품 리스트 갯수
            const latest_products_count = 4; // 최신 상품 리스트 갯수
            const start_index = 0; // 상품 검색 시작 인덱스

            // response 출력 형식 함수
            let set_response_format = async (products) => {
                let result = [];
                for (let i = 0; i < products.length; i++) {
                    // 가격 계산
                    let price = 0, sale_ratio = 0, saled_price = 0;
                    // 100원 딜 이벤트 상품인 경우
                    if (products[i].one_hundred_deal_event) {
                        price = products[i].price; sale_ratio = 0.99; saled_price = 100;
                    } else { 
                        // 기본 할인 적용
                        if (products[i].events.length == 0) {
                            price = products[i].price;
                            sale_ratio = products[i].default_sale_ratio;
                        }
                        // 기본 할인 적용 안함
                        else {
                            price = products[i].original_price;
                            for (let j = 0; j < products[i].events.length; j++) {
                                let current_date = new Date(Date.now() + (3600000 * 9));
                                if (products[i].events[j].start_date.getTime() <= current_date.getTime() && current_date.getTime() <= products[i].events[j].end_date.getTime())
                                    sale_ratio += products[i].events[j].sale_ratio;
                                if (sale_ratio >= 1) {
                                    sale_ratio = 0.99; break;
                                }
                            }
                        }
                        saled_price = Math.floor(price * (1 - sale_ratio));
                        saled_price = saled_price - (saled_price % 10);
                    }
                    let product = {
                        product_idx: products[i]._id,
                        main_img: products[i].img[0],
                        detail_name: products[i].detail_name,
                        standard: (products[i].standard == "0") ? "-" : products[i].standard,
                        price: price,
                        sale_ratio: Math.floor(sale_ratio * 100),
                        saled_price: saled_price,
                        is_adult: products[i].is_adult,
                        like: products[i].like_count,
                        one_hundred_deal_event: products[i].one_hundred_deal_event
                    }
                    result.push(product);
                }
                return result;
            }

            // 배너 검색
            banners = await Banner.find().or([{ type: 2 }, { type: 3 }]).select({ main_img: 1, link: 1 }).sort({ created_at: -1 });

            // b_code(법정동코드)가 입력된 경우에 h_code(행정동코드)로 변환
            if (b_code) {
                let address = await Address.find({ b_code: b_code });
                if (address.length <= 0) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
                } else {
                    h_code = address[0].h_code;
                }
            }

            // 협력업체 고유번호 출력
            let partner = await Partner.find({ salesable_area: { $in: [h_code] } }).select({ _id: 1 });
            if (partner.length <= 0) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else { 
                // parnter_idx 변수 저장
                let partner_idx = partner[0]._id;
                
                // [이 상품은 어떠세요?] -> 랜덤으로 상품 recommend_products_count개 출력
                let recommend_products = await Product.aggregate([ { $match: { partner_idx: partner_idx, one_hundred_deal_event: false, enabled: true } }, { $sample: { size: recommend_products_count } } ]);
                recommend_products = await set_response_format(recommend_products);
                
                // [많이 팔렸어요 Best 5] -> saled_count 내림차순 정렬 후 best_sale_produdcts_count개 출력
                let best_sale_produdcts = await Product.find({ partner_idx: partner_idx, one_hundred_deal_event: false, enabled: true }).sort({ saled_count: -1 }).skip(start_index).limit(best_sale_produdcts_count);
                best_sale_produdcts = await set_response_format(best_sale_produdcts);

                // 100원딜 찬스
                let one_hundred_deal_event_products = await Product.aggregate([ { $match: { partner_idx: partner_idx, one_hundred_deal_event: true, enabled: true } }, { $sample: { size: one_hundred_deal_event_products_count } } ]);
                one_hundred_deal_event_products = await set_response_format(one_hundred_deal_event_products);
                
                // [새로 들어왔어요] -> 최신 등록 상품 latest_products_count개 출력
                let latest_products = await Product.find({ partner_idx: partner_idx, one_hundred_deal_event: false, enabled: true }).sort({ created_at: -1 }).skip(start_index).limit(latest_products_count);
                latest_products = await set_response_format(latest_products);
                
                data = {
                    banner: banners,
                    recommend: recommend_products,
                    best: best_sale_produdcts,
                    event: one_hundred_deal_event_products,
                    latest: latest_products
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