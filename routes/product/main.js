var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');

const Product = require('../../schemas/product');
const Category = require('../../schemas/category');
const Banner = require('../../schemas/banner');
const Like = require('../../schemas/like');
const Purchasable_location = require('../../schemas/purchasable_location');

router.get('/', async (req, res) => {
    let { sido, sigungu, category } = req.query;
    if (!sido || !sigungu) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let store = [];
            let necessity = [];
            let pb = [];
            let recommend = [];
            let best = [];
            let self = [];
            let banner_arr = [];
            let banner = await Banner.find().or([{ type: 2 }, { type: 3 }]).sort({ created_at: -1 });
            for (let i = 0; i < banner.length; i++) {
                let banner_data = {
                    main_img: banner[i].main_img,
                    link: banner[i].link
                }
                banner_arr.push(banner_data);
            }
            let find_category = await Category.find({});
            for (let i = 0; i < find_category.length; i++) {
                let category_data = {
                    category_idx: find_category[i]._id,
                    img: find_category[i].img,
                    name: find_category[i].name,
                    is_adult: find_category[i].is_adult
                }
                if (find_category[i].type === '우리동네 가게') {
                    store.push(category_data);
                } else if (find_category[i].type === '생필품') {
                    necessity.push(category_data);
                } else {
                    pb.push(category_data);
                }
            }

            // 배송 가능 지역 검사

            // 시,도 해당 지역 검사
            let check_sido = await Purchasable_location.find({ sido: sido });
            if (!check_sido[0]) {
                let data = {
                    banner: banner_arr,
                    category: {
                        store: store,
                        necessity: necessity,
                        pb: pb
                    },
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
                    // 상품 카테고리 이름에 맞춰 상품 보여주기
                    let type;   // 카테고리 타입
                    switch (category) {
                        case 'store':
                            type = '우리동네 가게'
                            break;
                        case 'necessity':
                            type = '생필품'
                            break;
                        case 'pb':
                            type = '케어싱(PB상품)'
                            break;
                        default:
                            type = '우리동네 가게'
                            break;
                    }
                    let find_product = await Product.aggregate([{$match : { enabled: true }},{ $sample: { size: 4 } } ])
                    for(let i = 0; i < find_product.length; i++) {
                        if (!find_product[i].event_sale_ratio) {
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

                    // 많이 팔린 상품 구하기
                    var connection = await pool.getConnection();
                    try {
                        let query = 'SELECT product_id, SUM(count) AS count FROM orders_products GROUP BY product_id ORDER BY count DESC LIMIT 20';
                        let result = await connection.query(query);
                        let count = 0;
                        for (let i = 0; i < result.length; i++) {
                            let find_product = await Product.find({ _id: result[i].product_id, enabled:true });
                            if(find_product.length != 0) {
                                count++;
                                if (!find_product[0].event_sale_ratio) {
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
                                best.push(product_data);
                                if(count == 5) {
                                    break;
                                }
                            }
                        }
                    } catch (err) {
                        console.log(err);
                        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                    } finally {
                        connection.release();
                    }

                    // 직접 만든 상품 구하기
                    let self_category = await Category.aggregate([{ $match: { type: '우리동네 가게' } }, { $unwind: "$product" }, { $sample: { size: 5 } }]);
                    for (let i = 0; i < self_category.length; i++) {
                        let find_product = await Product.find({ _id: self_category[i].product });
                        if (!find_product[0].event_sale_ratio) {
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
                        banner: banner_arr,
                        category: {
                            store: store,
                            necessity: necessity,
                            pb: pb
                        },
                        recommend: recommend,
                        best: best,
                        self: self
                    }
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
                } else {
                    let data = {
                        banner: banner_arr,
                        category: {
                            store: store,
                            necessity: necessity,
                            pb: pb
                        },
                        recommend: recommend,
                        best: best,
                        self: self
                    }
                    res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.READ_SUCCESS, data));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;