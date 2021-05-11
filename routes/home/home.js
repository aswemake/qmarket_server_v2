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
            const event_products_count = 20; // 추천 상품 리스트 갯수
            const one_hundred_deal_event_products_count = 10; // 100원딜 상품 리스트 갯수
            const latest_products_count = 4; // 최신 상품 리스트 갯수
            const start_index = 0; // 상품 검색 시작 인덱스

            // response 출력 형식 함수
            let set_response_format = async (products) => {
                let result = [];
                for (let i = 0; i < products.length; i++) {
                    // 가격 계산
                    let price = products[i].original_price, sale_ratio = 0, saled_price = 0;
                    // 100원 딜 이벤트 상품인 경우
                    if (products[i].one_hundred_deal_event) { sale_ratio = 99; saled_price = 100; } 
                    else { 
                        await products[i].events.sort(function (a, b) { return a.saled_price - b.saled_price; })
                        let current_date = new Date(Date.now() + (3600000 * 9));
                        for (let j = 0; j < products[i].events.length; j++) {
                            if (products[i].events[j].start_date.getTime() <= current_date.getTime() && current_date.getTime() <= products[i].events[j].end_date.getTime()) {
                                saled_price = products[i].events[j].saled_price; break;
                            }
                        }

                        // 기본 할인 상품 (상생지원금 3.3%만큼 할인)
                        const default_sale_ratio = 0.033;
                        if (products[i].events.length < 1 || saled_price == 0) { // 이벤트가 없거나 현재 진행중인 이벤트가 없을 경우
                            price = Math.floor(price * (1 - default_sale_ratio));
                            price = price - (price % 10);
                            saled_price = price;
                        }
                        // 이벤트 할인 상품
                        else {
                            sale_ratio = ((price - saled_price) / price) + default_sale_ratio;
                            saled_price = Math.floor(price * (1 - sale_ratio));
                            saled_price = saled_price - (saled_price % 10);
                            sale_ratio = Math.floor(sale_ratio * 100);
                        }
                    }

                    // is_event 설정
                    let is_event = (products[i].one_hundred_deal_event == false && sale_ratio > 0) ? true : false;

                    let product = {
                        product_idx: products[i]._id,
                        main_img: products[i].img[0],
                        detail_name: `${products[i].detail_name} ${(products[i].standard == "0") ? "" : products[i].standard}`,
                        standard: (products[i].standard == "0") ? "-" : products[i].standard,
                        price: price,
                        sale_ratio: sale_ratio,
                        saled_price: saled_price,
                        is_adult: products[i].is_adult,
                        like: products[i].like_count,
                        one_hundred_deal_event: products[i].one_hundred_deal_event,
                        is_event: is_event
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
                
                // [초특가 전단상품] -> 전단 할인 이벤트하고 있는 상품들 recommend_products_count개 랜덤 출력
                const event_type = 200;
                let current_date = new Date(Date.now() + (3600000 * 9));
                let event_products = await Product.aggregate([ 
                                                                { 
                                                                    $match: { 
                                                                        partner_idx: partner_idx, 
                                                                        one_hundred_deal_event: false, 
                                                                        enabled: true, 
                                                                        events: {
                                                                            $exists: true,
                                                                            $type: 'array',
                                                                            $ne: [],
                                                                            $elemMatch: {
                                                                                'type': event_type,
                                                                                'start_date': { $lte: current_date },
                                                                                'end_date': { $gte: current_date }
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                { $sample: { size: event_products_count } } ]);
                event_products = await set_response_format(event_products);

                // [100원딜 찬스] -> 100원딜 이벤트 상품 one_hundred_deal_event_products_count개 출력
                let one_hundred_deal_event_products = await Product.aggregate([ { $match: { partner_idx: partner_idx, one_hundred_deal_event: true, enabled: true } }, { $sample: { size: one_hundred_deal_event_products_count } } ]);
                one_hundred_deal_event_products = await set_response_format(one_hundred_deal_event_products);
                
                // [새로 들어왔어요] -> 최신 등록 상품 latest_products_count개 출력
                let latest_products = await Product.find({ partner_idx: partner_idx, one_hundred_deal_event: false, enabled: true }).sort({ created_at: -1 }).skip(start_index).limit(latest_products_count);
                latest_products = await set_response_format(latest_products);
                
                data = {
                    banner: banners,
                    mart_event: event_products,
                    one_hundred_deal_event: one_hundred_deal_event_products,
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