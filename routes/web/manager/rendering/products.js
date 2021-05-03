var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

let Product = require('../../../../schemas/product_v2');
let Category = require('../../../../schemas/category_v2');

//products_frame load - 여기서 카테고리 정보 싹 가져와야할듯
router.get('/form', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { partner_idx } = req.params;
        if (!partner_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let data = { partner_idx: partner_idx };
                res.render('manager/product_frame', { data });
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})

// 상품 리스트 조회 API
router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const default_count = 15;
        const { partner_idx } = req.params;
        const { category, keyword, page } = req.query;
        console.log("partner_idx : " + partner_idx)
        console.log("category : " + category);
        console.log("keyword : " + keyword);
        console.log("page : " + page);
        //category 이름을 가져오는걸로 수정했는데 idx어떻게 넘겼는지 확인해보고 다시 idx로 돌려도 될듯
        if (!partner_idx || !page) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                // 서버에 올라가면 page datatype이 아마도 integer로 바뀔듯
                let data = { current_page_num: parseInt(page), last_page_num: 0, partner_idx: partner_idx, products: [], current_category: category, current_keyword: keyword};
                // 검색 키워드와 카테고리가 모두 설정되지 않은 경우
                if (!keyword && !category) {
                    products = await Product.find({ partner_idx: partner_idx, enabled: true, one_hundred_deal_event: false }).select({ _id: 1, barcode: 1, img: 1, name: 1, detail_name: 1, standard: 1, original_price: 1, event: 1, count: 1, category_idx: 1}).sort({ created_at: -1 });
                    
                }
                // 검색 키워드가 존재할 경우 키워드가 포함된 모든 상품 리스트 출력
                else if (keyword && !category) {
                    products = await Product.find({ detail_name: { $regex: keyword }, partner_idx: partner_idx, enabled: true, one_hundred_deal_event: false }).select({ _id: 1, barcode: 1, img: 1, name: 1, detail_name: 1, standard: 1, original_price: 1, event: 1, count: 1, category_idx: 1}).sort({ created_at: -1 });
                }
                // 카테고리가 설정된 경우 카테고리를 기준으로 검색된 모든 상품 리스트 출력
                else if (!keyword && category) {
                    category_idx = await Category.find({ name: category }).select({ _id: 1 }).sort({ created_at: -1 });
                    console.log("category_idx : " + category_idx)
                    products = await Product.find({ category_idx: category_idx, partner_idx: partner_idx, enabled: true, one_hundres_deal_event: false }).select({ _id: 1, barcode: 1, img: 1, name: 1, detail_name: 1, standard: 1, original_price: 1, event: 1, count: 1 }).sort({ created_at: -1 });
                }
                // 검색 키워드와 카테고리가 모두 설정된 경우
                else {
                    category_idx = await Category.find({ name: category }).select({ _id: 1 }).sort({ created_at: -1 });
                    console.log("category_idx : " + category_idx)
                    products = await Product.find({ detail_name: { $regex: keyword }, category_idx: category_idx, partner_idx: partner_idx, enabled: true, one_hundred_deal_event: false }).select({ _id: 1, barcode: 1, img: 1, name: 1, detail_name: 1, standard: 1, original_price: 1, event: 1, count: 1 }).sort({ created_at: -1 });
                }

                // offset, count 설정
                let offset = (page - 1) * default_count;
                let count = (products.length < offset + default_count) ? products.length - offset : default_count;
                for (let i = offset; i < offset + count; i++) {
                    if(!category){
                        temp_category = await Category.find({ _id: products[i].category_idx }).select({ name: 1 }).sort({ created_at: -1 });
                    	temp_category = temp_category[0].name;
		    } else {
                        temp_category = category;
                    }
                    let product = {
                        product_id: products[i]._id,
                        img: products[i].img[0],
                        barcode: products[i].barcode,
                        brand: products[i].name,
                        detail_name: products[i].detail_name,
                        standard: (products[i].standard == "0") ? "-" : products[i].standard,
                        price: products[i].original_price,
                        count: products[i].count,
                        category: temp_category
                    };
                    console.log(product);
                    data.products.push(product);
                }

                data.last_page_num = (products.length % default_count == 0) ? Math.floor(products.length / default_count) : Math.floor(products.length / default_count) + 1;
                console.log("data.current_page_num : " + data.current_page_num);
                console.log("data.last_page_num : " + data.last_page_num);
                res.render('manager/products', { data });
            } catch (err) {
                console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})
module.exports = router;
