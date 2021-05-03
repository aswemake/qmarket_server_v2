var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');

const Product = require('../../schemas/product');
const Like = require('../../schemas/like');
const Review = require('../../schemas/review');
const Purchasable_location = require('../../schemas/purchasable_location');

router.get('/', async (req, res) => {
    let { category_idx, sort } = req.query;
    let { sido, sigungu } = req.query;
    if (!category_idx || !sort) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let best = [];
            let favorite = [];
            let low = [];
            let high = [];
            let review = [];
            let recent = [];

            // 배송 가능 지역 검사

            // 시,도 해당 지역 검사
            let check_sido = await Purchasable_location.find({ sido: sido });
            if (!check_sido[0]) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, best));
            } else {
                // 시,군,구 해당 지역 검사
                let check_sigungu = await Purchasable_location.find({}).in('sigungu', [sigungu])
                if (!check_sigungu[0]) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, best));
                } else {
                    var sale_ratio; // 상품 할인율

                    // 판매순
                    if (sort == 1) {
                        let id_array = [];
                        let find_id = await Product.find({ category_idx: category_idx }).select({ _id: 1 });
                        let query = 'SELECT product_id FROM orders_products GROUP BY product_id ORDER BY SUM(count) DESC';
                        let result = await connection.query(query);
                        // 카테고리에 해당하는 상품 배열에 담기
                        for (let i = 0; i < find_id.length; i++) {
                            id_array.push(find_id[i]._id + '');
                        }
                        // 판매순으로 정렬
                        for (let j = result.length - 1; j >= 0; j--) {
                            let index = id_array.indexOf(result[j].product_id);
                            if (index == -1) {
                                console.log("카테고리에 해당하는 상품이 아닙니다.");
                            } else {
                                id_array.splice(index, 1);
                                id_array.unshift(result[j].product_id);
                            }
                        }
                        for (let k = 0; k < id_array.length; k++) {
                            let find_product = await Product.find({ _id: id_array[k], enabled:true });
                            if(find_product.length != 0) {
                                if(!find_product[0].event_sale_ratio){
                                    sale_ratio = find_product[0].sale_ratio
                                } else {
                                    sale_ratio = find_product[0].event_sale_ratio
                                }
                                // 상품 좋아요 개수 구하기
                                let count_like = await Like.countDocuments({ product_idx: id_array[k] });
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
                            }
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, best));
                    }
                    // 인기순
                    else if (sort == 2) {
                        let like_array = [];
                        let find_id = await Product.find({ category_idx: category_idx }).select({ _id: 1 });
                        // 카테고리에 해당하는 상품 배열에 담기
                        for (let i = 0; i < find_id.length; i++) {
                            let like_sort = {
                                product_id: find_id[i]._id,
                                count: await Like.countDocuments({ product_idx: find_id[i]._id })
                            }
                            like_array.push(like_sort);
                        }
                        // 좋아요 많은 순 정렬
                        like_array.sort(function (a, b) {
                            return b['count'] - a['count'];
                        })
                        console.log(like_array);
                        for (let j = 0; j < like_array.length; j++) {
                            let product = await Product.find({ _id: like_array[j].product_id, enabled:true });
                            if(product.length != 0) {
                                if(!product[0].event_sale_ratio){
                                    sale_ratio = product[0].sale_ratio
                                } else {
                                    sale_ratio = product[0].event_sale_ratio
                                }
                                let product_data = {
                                    product_idx: product[0]._id,
                                    main_img: product[0].img[0],
                                    detail_name: product[0].detail_name,
                                    sale_ratio: Math.floor(sale_ratio * 100),
                                    price: product[0].price,
                                    saled_price: product[0].saled_price,
                                    is_adult: product[0].is_adult,
                                    like: like_array[j].count
                                }
                                favorite.push(product_data);
                            }
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, favorite));
                    }
                    // 낮은 가격순 
                    else if (sort == 3) {
                        let product = await Product.find({ category_idx: category_idx, enabled:true }).sort('saled_price');
                        console.log(product);
                        for (let i = 0; i < product.length; i++) {
                            if(!product[0].event_sale_ratio){
                                sale_ratio = product[0].sale_ratio
                            } else {
                                sale_ratio = product[0].event_sale_ratio
                            }
                            // 상품 좋아요 개수 구하기
                            let count_like = await Like.countDocuments({ product_idx: product[i]._id });
                            let product_data = {
                                product_idx: product[i]._id,
                                main_img: product[i].img[0],
                                detail_name: product[i].detail_name,
                                sale_ratio: Math.floor(sale_ratio * 100),
                                price: product[i].price,
                                saled_price: product[i].saled_price,
                                is_adult: product[i].is_adult,
                                like: count_like
                            }
                            low.push(product_data);
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, low));
                    }
                    // 높은 가격순 
                    else if (sort == 4) {
                        let product = await Product.find({ category_idx: category_idx, enabled:true }).sort('-saled_price');
                        console.log(product);
                        for (let i = 0; i < product.length; i++) {
                            if(!product[0].event_sale_ratio){
                                sale_ratio = product[0].sale_ratio
                            } else {
                                sale_ratio = product[0].event_sale_ratio
                            }
                            // 상품 좋아요 개수 구하기
                            let count_like = await Like.countDocuments({ product_idx: product[i]._id });
                            let product_data = {
                                product_idx: product[i]._id,
                                main_img: product[i].img[0],
                                detail_name: product[i].detail_name,
                                sale_ratio: Math.floor(sale_ratio * 100),
                                price: product[i].price,
                                saled_price: product[i].saled_price,
                                is_adult: product[i].is_adult,
                                like: count_like
                            }
                            high.push(product_data);
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, high));
                    }
                    // 많은 리뷰순 
                    else if (sort == 5) {
                        let review_array = [];
                        let find_id = await Product.find({ category_idx: category_idx, enabled:true }).select({ _id: 1 });
                        // 카테고리에 해당하는 상품 배열에 담기
                        for (let i = 0; i < find_id.length; i++) {
                            let review_sort = {
                                product_id: find_id[i]._id,
                                count: await Review.countDocuments({ idx: find_id[i]._id })
                            }
                            review_array.push(review_sort);
                        }
                        // 리뷰 많은 순 정렬
                        review_array.sort(function (a, b) {
                            return b['count'] - a['count'];
                        })
                        console.log(review_array);
                        for (let j = 0; j < review_array.length; j++) {
                            let product = await Product.find({ _id: review_array[j].product_id, enabled:true });
                            if(product.length != 0) {
                                if(!product[0].event_sale_ratio){
                                    sale_ratio = product[0].sale_ratio
                                } else {
                                    sale_ratio = product[0].event_sale_ratio
                                }
                                // 상품 좋아요 개수 구하기
                                let count_like = await Like.countDocuments({ product_idx: review_array[j].product_id });
                                let product_data = {
                                    product_idx: product[0]._id,
                                    main_img: product[0].img[0],
                                    detail_name: product[0].detail_name,
                                    sale_ratio: Math.floor(sale_ratio * 100),
                                    price: product[0].price,
                                    saled_price: product[0].saled_price,
                                    is_adult: product[0].is_adult,
                                    like: count_like
                                }
                                review.push(product_data);
                            }
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, review));
                    }
                    // 최신순 
                    else if (sort == 6) {
                        let product = await Product.find({ category_idx: category_idx, enabled:true }).sort('-created_at');
                        console.log(product);
                        for (let i = 0; i < product.length; i++) {
                            if(!product[0].event_sale_ratio){
                                sale_ratio = product[0].sale_ratio
                            } else {
                                sale_ratio = product[0].event_sale_ratio
                            }
                            // 상품 좋아요 개수 구하기
                            let count_like = await Like.countDocuments({ product_idx: product[i]._id });
                            let product_data = {
                                product_idx: product[i]._id,
                                main_img: product[i].img[0],
                                detail_name: product[i].detail_name,
                                sale_ratio: Math.floor(sale_ratio * 100),
                                price: product[i].price,
                                saled_price: product[i].saled_price,
                                is_adult: product[i].is_adult,
                                like: count_like
                            }
                            recent.push(product_data);
                        }
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, recent));
                    } else {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.WRONG_PARAMS));
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;