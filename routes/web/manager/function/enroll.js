var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product_v2');
let Category = require('../../../../schemas/category_v2');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            const { partner_idx } = req.params;
            let data = { partner_idx : partner_idx};
            console.log("enroll : " + data.partner_idx)
            res.render('manager/enroll', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

router.post('/', async (req, res) => {
    let dataset = JSON.parse(req.body.dataset);
    let check_barcode = await Product.find({ barcode : dataset.barcode , partner_idx : dataset.partner_idx });
    console.log("standard : ", dataset.standard);
    if(check_barcode.length != 0){
        console.log(check_barcode);
        res.status(300).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } else {
        try {
            let created_at = Date.now() + (3600000 * 9);
            let hashtag = dataset.hashtag;
            let main_img = [];
            let product_img = [];
            let count = Number(dataset.count);
            let price = Number(dataset.price);

            let img = dataset.img[0]
            main_img.push('https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + encodeURIComponent(img));
            console.log(main_img);

            for(let i = 0; i < dataset.detail_image.length; i++) {
                if (dataset.detail_image[i] !== undefined) {
                    let img1 = dataset.detail_image[i]
                    product_img.push('https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + encodeURIComponent(img1));
                }
            }
            console.log("product image : ", product_img)

            let category_idx = await Category.find({ name : dataset.category }).select({ _id : 1});

            const product = new Product({
                img: main_img,
                detail_img: product_img,
                hashtag: hashtag,
                events: [],
                name: dataset.name,
                detail_name: dataset.detail_name,
                barcode: dataset.barcode,
                standard: dataset.standard,
                original_price: price,
                partner_idx: dataset.partner_idx,
                category_idx: category_idx[0],
                count: count,
                like_count: 0,
                shared_count: 0,
                saled_count: 0,
                one_hundred_deal_event: false,
                is_adult: false,
                enabled: true,
                created_at: created_at
            })
            console.log("product : ", product);
            const product_save_result = await product.save();
            console.log('데이터 삽입 완료');
            
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;
