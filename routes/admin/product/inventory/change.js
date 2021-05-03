var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

let Product = require('../../../../schemas/product');
let Category = require('../../../../schemas/category');

router.put('/count', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { product_id } = req.query;
            let { count } = req.body;
            console.log(product_id);
            console.log(count);
            if (!product_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let update_count = await Product.updateOne({ _id: product_id }, { $set: { count: count } });
                console.log(update_count);
                if (update_count.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

router.put('/price', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { product_id } = req.query;
            let { price } = req.body;
            console.log(product_id);
            console.log(price);
            if (!product_id || !price) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let product = await Product.findOne({ _id: product_id }).select({ sale_ratio: 1 });
                let saled_price = Math.round(price * (1 - product.sale_ratio) / 10) * 10;

                let update_price = await Product.updateOne({ _id: product_id }, { $set: { price: price, saled_price: saled_price } });
                console.log(update_price);
                if (update_price.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }

    }
})

router.put('/sale_ratio', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { product_id } = req.query;
            let { sale_ratio } = req.body;
            if (!product_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let product = await Product.findOne({ _id: product_id }).select({ price: 1 });
                let saled_price;
                if(sale_ratio == 0){
                    saled_price = product.price
                }else{
                    saled_price = Math.round(product.price * (1 - sale_ratio) / 10) * 10;
                }
                console.log(saled_price);
                let update_sale_ratio = await Product.updateOne({ _id: product_id }, { $set: { sale_ratio: sale_ratio, saled_price: saled_price } });
                console.log(update_sale_ratio);
                if (update_sale_ratio.nModified === 1) {
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                } else {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }

    }
})

router.delete('/delete', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { product_id } = req.body;
            if (!product_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let product = await Product.findOne({ _id: product_id }).select({ category_idx: 1 });
                let delete_product = await Product.deleteOne({ _id: product_id });
                if (delete_product.deletedCount === 1) {
                    console.log("상품이 삭제되었습니다.")
                    let delete_category = await Category.updateOne({ _id: product.category_idx }, { $pull: { product: product_id } });
                    if (delete_category.nModified == 1) {
                        console.log("카테고리에서 제외되었습니다.");
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
                    } else {
                        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    }
                } else {
                    console.log("상품 삭제에 실패했습니다.")
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 상품 이벤트 등록
router.put('/event/register', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { product_id } = req.query;
            let { price } = req.body;
            if (!product_id || !price) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let product = await Product.find({ _id: product_id }).select({ is_event: 1, price: 1 });
                if (product[0].is_event === true) {
                    res.status(202).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS));
                } else {
                    var event_sale_ratio = (1 - (price / product[0].price)).toFixed(2);
                    console.log(event_sale_ratio);
                    let register_event = await Product.updateOne({ _id: product_id }, { $set: { is_event: true, saled_price: price, event_sale_ratio: event_sale_ratio } }, { upsert: true });
                    console.log(register_event);
                    if (register_event.nModified === 1) {
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                    } else {
                        res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 상품 이벤트 해제
router.put('/event/terminate', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { product_id } = req.body;
            if (!product_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let product = await Product.find({ _id: product_id }).select({ is_event: 1, price: 1, sale_ratio: 1 });
                if (!product[0].is_event) {
                    res.status(202).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS));
                } else {
                    let saled_price = Math.round(product[0].price * (1 - product[0].sale_ratio) / 10) * 10;
                    let terminate_event = await Product.updateOne({ _id: product_id }, { $unset: { is_event: 1, event_sale_ratio: 1 } });
                    if (terminate_event.nModified === 1) {
                        let save_price = await Product.updateOne({ _id: product_id }, { $set: { saled_price: saled_price } });
                        if (save_price.nModified === 1) {
                            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                        } else {
                            res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                        }
                    } else {
                        res.status(400).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;