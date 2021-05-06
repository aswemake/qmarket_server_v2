var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Product = require('../../schemas/product_v2');
const Partner = require('../../schemas/partner');
const Like = require('../../schemas/like');
const Review = require('../../schemas/review');
const Address = require('../../schemas/address_matching');

// 상품 리스트 조회 API
router.get('/', async (req, res) => {
    let { b_code, h_code, category_idx, keyword, sort, offset, count } = req.query;
    if ((!b_code && !h_code) || (b_code && h_code) || !sort || !offset || !count || (!category_idx && !keyword)) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
    } else if (sort != '판매순' && sort != '인기순' && sort != '낮은가격순' && sort != '높은가격순' && sort != '많은리뷰순' && sort != '최신순') {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
    } else {
        try {
            // offset, count 데이터 타입 string to int
            // offset = parseInt(offset); count = parseInt(count);
            let data = new Object();
            Object.assign(data, { total_count: 0, products: []});
            let products = []; // 모든 상품 목록
            let sorted_products = []; // 정렬된 상품 목록
            let final_products = []; // count 갯수의 상품 목록

            let price_preprocessing = async (products) => {
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
                        if (products[i].events.length < 1 || saled_price == 0) { // 이벤트가 없거나 현재 진행중인 이벤트가 없을 경우
                            const default_sale_ratio = 0.033;
                            price = Math.floor(price * (1 - default_sale_ratio));
                            price = price - (price % 10);
                            saled_price = price;
                        }
                        // 이벤트 할인 상품
                        else {
                            sale_ratio = Math.floor(((price - saled_price) / price) * 100);
                        }
                    }

                    // is_event 설정
                    let is_event = (products[i].one_hundred_deal_event == false && sale_ratio > 0) ? true : false;

                    products[i].price = price;
                    products[i].sale_ratio = sale_ratio;
                    products[i].saled_price = saled_price;
                    products[i].is_event = is_event;
                }
                return products;
            }
            
            // 판매순 정렬 함수
            let sort_sale = async (products, offset, count) => {
                // 판매 갯수를 기준으로 내림차순 정렬
                products.sort(function (a, b) {
                    return b.saled_count - a.saled_count;
                })
                return products.slice(offset, offset + count);
            }

            // 인기순 정렬 함수
            let sort_like = async(products, offset, count) => {
                // 좋아요 갯수를 기준으로 내림차순 정렬
                products.sort(function (a, b) {
                    return b.like_count - a.like_count;
                })
                return products.slice(offset, offset + count);
            }

            // 낮은가격순 정렬 함수
            let sort_low_price = async(products, offset, count) => {
                // 가격을 기준으로 오름차순 정렬
                products.sort(function (a, b) {
                    return a.saled_price - b.saled_price;
                })
                return products.slice(offset, offset + count);
            }

            // 높은가격순 정렬 함수
            let sort_high_price = async(products, offset, count) => {
                // 가격을 기준으로 내림차순 정렬
                products.sort(function (a, b) {
                    return b.saled_price - a.saled_price;
                })
                return products.slice(offset, offset + count);
            }

            // 많은리뷰순 정렬 함수
            let sort_review = async(products, offset, count) => {
                // 각 상품의 리뷰 갯수 구하기
                for (let i = 0; i < products.length; i++) {
                    products[i].review_count = await Review.countDocuments({ idx: products[i]._id });
                }
                // 리뷰 갯수를 기준으로 내림차순 정렬
                products.sort(function (a, b) {
                    return b.review_count - a.review_count;
                })
                return products.slice(offset, offset + count);
            }

            // 로직 시작 //
            // b_code(법정동코드)가 입력된 경우에 h_code(행정동코드)로 변환
            if (b_code) {
                let address = await Address.find({ b_code: b_code });
                if (address.length <= 0) {
                    return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
                } else {
                    h_code = address[0].h_code;
                }
            }

            // partner_idx(협력업체 고유번호) 구하기
            let partner = await Partner.find({ salesable_area: { $in: [h_code] } }).select({ _id: 1 });
            if (partner.length <= 0) {
                console.log(1);
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
            } else {
                let partner_idx = partner[0]._id;
                // 최신순 정렬은 default로 설정
                // 검색 키워드가 존재할 경우 키워드가 포함된 모든 상품 리스트 출력
                if (keyword && !category_idx) {
                    products = await Product.find({ $or: [{ name: { $regex: keyword } }, { detail_name: { $regex: keyword } }, { hashtag: { $regex: keyword } }], 
                                                    partner_idx: partner_idx, enabled: true }).select({ _id: 1, img: 1, detail_name: 1, standard: 1, original_price: 1, one_hundred_deal_event: 1, events: 1, is_adult: 1, like_count: 1, saled_count: 1 }).sort({ created_at: -1 });
                }
                // 카테고리가 설정된 경우 카테고리를 기준으로 검색된 모든 상품 리스트 출력
                else if (!keyword && category_idx) {
                    products = await Product.find({ category_idx: category_idx, partner_idx: partner_idx, enabled: true }).select({ _id: 1, img: 1, detail_name: 1, standard: 1, original_price: 1, one_hundred_deal_event: 1, events: 1, is_adult: 1, like_count: 1, saled_count: 1 }).sort({ created_at: -1 });
                }
                // 검색 키워드와 카테고리가 모두 설정된 경우
                else {
                    products = await Product.find({ $or: [{ name: { $regex: keyword } }, { detail_name: { $regex: keyword } }, { hashtag: { $regex: keyword } }],
                                                    category_idx: category_idx, partner_idx: partner_idx, enabled: true }).select({ _id: 1, img: 1, detail_name: 1, standard: 1, original_price: 1, one_hundred_deal_event: 1, events: 1, is_adult: 1, like_count: 1, saled_count: 1 }).sort({ created_at: -1 });
                }
    
                // product collection의 검색 결과가 없을 경우 error 메시지 출력
                if (products.length <= 0) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
                } else {
                    products = await price_preprocessing(products);
                    switch (sort) {
                        case '판매순': sorted_products = await sort_sale(products, offset, count); break;
                        case '인기순': sorted_products = await sort_like(products, offset, count); break;
                        case '낮은가격순': sorted_products = await sort_low_price(products, offset, count); break;
                        case '높은가격순': sorted_products = await sort_high_price(products, offset, count); break;
                        case '많은리뷰순': sorted_products = await sort_review(products, offset, count); break;
                        case '최신순': sorted_products = products.slice(offset, offset + count); break;
                    }
                    for (let i = 0; i < sorted_products.length; i++) {
                        let final_product = {
                            product_idx: sorted_products[i]._id,
                            main_img: sorted_products[i].img[0],
                            like: sorted_products[i].like_count,
                            detail_name: `${sorted_products[i].detail_name} ${(sorted_products[i].standard == "0") ? "" : sorted_products[i].standard}`,
                            standard: (sorted_products[i].standard == "0") ? "-" : sorted_products[i].standard,
                            price: sorted_products[i].price,
                            sale_ratio: sorted_products[i].sale_ratio,
                            saled_price: sorted_products[i].saled_price,
                            is_adult: sorted_products[i].is_adult,
                            one_hundred_deal_event: sorted_products[i].one_hundred_deal_event,
                            is_event: sorted_products[i].is_event
                        }
                        final_products.push(final_product);
                    }
    
                    data.total_count = products.length;
                    data.products = final_products;
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 상품 상세 조회 API
router.get('/:product_idx', async (req, res) => {
    const { product_idx } = req.params;
    if (!product_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let data = new Object();
            let product = await Product.find({ _id: product_idx, enabled: true });
            if (product.length <= 0) {
                return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_PRODUCT));
            } else {
                // 가격 계산
                let price = product[0].original_price, sale_ratio = 0, saled_price = 0;
                // 100원 딜 이벤트 상품인 경우
                if (product[0].one_hundred_deal_event) { sale_ratio = 99; saled_price = 100; } 
                else { 
                    await product[0].events.sort(function (a, b) { return a.saled_price - b.saled_price; })
                    let current_date = new Date(Date.now() + (3600000 * 9));
                    for (let i = 0; i < product[0].events.length; i++) {
                        if (product[0].events[i].start_date.getTime() <= current_date.getTime() && current_date.getTime() <= product[0].events[i].end_date.getTime()) {
                            saled_price = product[0].events[i].saled_price; break;
                        }
                    }

                    // 기본 할인 상품 (상생지원금 3.3%만큼 할인)
                    if (product[0].events.length < 1 || saled_price == 0) { // 이벤트가 없거나 현재 진행중인 이벤트가 없을 경우
                        const default_sale_ratio = 0.033;
                        price = Math.floor(price * (1 - default_sale_ratio));
                        price = price - (price % 10);
                        saled_price = price;
                    }
                    // 이벤트 할인 상품
                    else {
                        sale_ratio = Math.floor(((price - saled_price) / price) * 100);
                    }
                }

                // is_event 설정
                let is_event = (product[0].one_hundred_deal_event == false && sale_ratio > 0) ? true : false;
                
                data = {
                    img: product[0].img,
                    name: product[0].name,
                    detail_name: `${product[0].detail_name} ${(product[0].standard == "0") ? "" : product[0].standard}`,
                    standard: (product[0].standard == "0") ? "-" : product[0].standard,
                    price: price,
                    sale_ratio: sale_ratio,
                    saled_price: saled_price,
                    detail_img: product[0].detail_img,
                    shared_count: product[0].shared_count,
                    like: product[0].like_count,
                    count: product[0].count,
                    is_adult: product[0].is_adult,
                    one_hundred_deal_event: product[0].one_hundred_deal_event,
                    is_event: is_event
                }
            }

            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;