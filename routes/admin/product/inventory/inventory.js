var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');

let Product = require('../../../../schemas/product');
let Category = require('../../../../schemas/category');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let data = [];
            let { search } = req.query;
            var sale_ratio;
            if (!search) {
                let product = await Product.find({});
                for (let i = 0; i < product.length; i++) {
                    if(!product[i].event_sale_ratio){
                        sale_ratio = product[i].sale_ratio
                    } else {
                        sale_ratio = product[i].event_sale_ratio
                    }
                    let category = await Category.find({ _id: product[i].category_idx }).select({ name: 1 });
                    let product_info = {
                        product_id: product[i]._id,
                        category: category[0].name,
                        img: product[i].img[0],
                        brand: product[i].name,
                        detail_name: product[i].detail_name,
                        price: product[i].price,
                        sale_ratio: sale_ratio,
                        saled_price: product[i].saled_price,
                        count: product[i].count
                    }
                    data.push(product_info);
                }
            } else {
                let product = await Product.find({ $or: [{ name: { $regex: search } }, { detail_name: { $regex: search } }] })
                if (!product[0]) {
                    res.status(204).json(utils.successFalse(statusCode.NO_CONTENT, resMessage.READ_FAIL));
                } else {
                    for (let i = 0; i < product.length; i++) {
                        if(!product[i].event_sale_ratio){
                            sale_ratio = product[i].sale_ratio
                        } else {
                            sale_ratio = product[i].event_sale_ratio
                        }
                        let category = await Category.find({ _id: product[i].category_idx }).select({ name: 1 });
                        let product_info = {
                            product_id: product[i]._id,
                            category: category[0].name,
                            img: product[i].img[0],
                            brand: product[i].name,
                            detail_name: product[i].detail_name,
                            price: product[i].price,
                            sale_ratio: sale_ratio,
                            saled_price: product[i].saled_price,
                            count: product[i].count
                        }
                        data.push(product_info);
                    }
                }
            }

            res.render('inventory', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})



module.exports = router;