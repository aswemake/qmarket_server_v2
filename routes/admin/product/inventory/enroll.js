var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Product = require('../../../../schemas/product');
let Category = require('../../../../schemas/category');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let data = [];
            let find_category = await Category.find({});
            for (let i = 0; i < find_category.length; i++) {
                let category_data = {
                    name: find_category[i].name,
                    category_idx: find_category[i]._id,
                }
                data.push(category_data)
            }
            res.render('enroll', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

router.post('/', async (req, res) => {
    try {
        console.log("requst body : ",req.body.test)
        let created_at = Date.now() + (3600000 * 9);
        let dataset = JSON.parse(req.body.dataset);
        console.log("dataset : ", dataset);
        let hashtag = dataset.hashtag;
        let main_img = [];
        let product_img = [];
        let count = Number(dataset.count);
        let price = Number(dataset.price);
        let sale_ratio = Number(dataset.sale_ratio)/100;
        let saled_price;
        if(sale_ratio == 0){
            saled_price = price;
        } else {
            saled_price = Math.round(price * (1 - sale_ratio) / 10) * 10; 
        }
        let img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset.img[0].trim().replace(/\"/gi, "").replace(/\s/g, '+')
        main_img.push(img);
        console.log(main_img);
        for(let i = 0; i < dataset.detail_image.length; i++) {
            if (dataset.detail_image[i] !== undefined) {
                let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset.detail_image[i].trim().replace(/\"/gi, "").replace(/\s/g, '+')
                product_img.push(img1);
            }
        }
        console.log("product image : ", product_img)
        const product = new Product({
            img: main_img,
            detail_img: product_img,
            name: dataset.name,
            detail_name: dataset.detail_name,
            price: price,
            hashtag: hashtag,
            sale_ratio: sale_ratio,
            saled_price: saled_price,
            category_idx: dataset.category_idx,
            count: count,
            is_adult: false,
            enabled: true,
            created_at: created_at
        })
        console.log("product : ", product);
        const product_save_result = await product.save();
        console.log('데이터 삽입 완료');
        // if (dataset[i].img2 !== undefined) {
        //     console.log(dataset[i].img2);
        //     let img2 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img2.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img2);
        // }
        // if (dataset[i].img3 !== undefined) {
        //     let img3 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img3.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img3);
        // }
        // if (dataset[i].img4 !== undefined) {
        //     let img4 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img4.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img4);
        // }
        // if (dataset[i].img5 !== undefined) {
        //     let img5 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img5.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img5);
        // }
        // if (dataset[i].img6 !== undefined) {
        //     let img6 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img6.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img6);
        // }
        // if (dataset[i].img7 !== undefined) {
        //     let img7 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img7.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img7);
        // }
        // if (dataset[i].img8 !== undefined) {
        //     let img8 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img8.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img8);
        // }
        // if (dataset[i].img9 !== undefined) {
        //     let img9 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img9.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img9);
        // }
        // if (dataset[i].img10 !== undefined) {
        //     let img10 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img10.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        //     product_img.push(img10);
        // }

        // if (dataset[i].hashtag1 !== undefined) {
        //     let hashtag1 = dataset[i].hashtag1.trim().replace(/\"/gi, "");
        //     console.log(hashtag1);
        //     hashtag.push(hashtag1);
        // }
        // if (dataset[i].hashtag2 !== undefined) {
        //     let hashtag2 = dataset[i].hashtag2.trim().replace(/\"/gi, "");
        //     hashtag.push(hashtag2);
        // }
        // if (dataset[i].hashtag3 !== undefined) {
        //     let hashtag3 = dataset[i].hashtag3.trim().replace(/\"/gi, "");
        //     hashtag.push(hashtag3);
        // }

        // // 상품에 해당하는 카테고리 찾기
        // let find_category = await Category.find({ name: dataset[i].category.trim().replace(/\"/gi, "") });
        // const product = new Product({
        //     img: main_img,
        //     detail_img: product_img,
        //     name: dataset[i].name.trim().replace(/\"/gi, ""),
        //     detail_name: dataset[i].detail_name.trim().replace(/\"/gi, ""),
        //     price: price,
        //     hashtag: hashtag,
        //     sale_ratio: sale_ratio,
        //     saled_price: saled_price,
        //     category_idx: find_category[0]._id,
        //     count: count,
        //     is_adult: false,
        //     created_at: created_at
        // })
        // const product_save_result = await product.save();
        // console.log(i + 1, '번째 데이터 삽입');

        // let find_product = await Product.find({ detail_name: dataset[i].detail_name.trim().replace(/\"/gi, "") }).select({ category_idx: 1 });
        // for (let i = 0; i < find_product.length; i++) {
        //     let category = await Category.updateOne({ _id: find_product[i].category_idx }, { $push: { product: find_product[i]._id } });
        //     console.log(`${i}번째 카테고리 삽입 완료`);
        // }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;