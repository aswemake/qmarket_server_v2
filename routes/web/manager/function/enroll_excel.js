var express = require('express');
var router = express.Router({ mergeParams: true });
const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');
const admin_pool = require('../../../../config/admin_dbConfig');
const fs = require('fs');
const Excel = require('exceljs');
const multer = require('multer');
let Product = require('../../../../schemas/product_v2');
let Category = require('../../../../schemas/category_v2');
var storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, './uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.originalname}`);
    },
});
var uploadWithOriginalFilename = multer({ storage: storage });
router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        try {
            const { partner_idx } = req.params;
            let data = { partner_idx : partner_idx};
            // console.log("excel : " + data.partner_idx)
            res.render('manager/enroll_excel', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

router.post('/', async function (req, res) {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        try {
            const { partner_idx } = req.params;
            if (!partner_idx) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let file = JSON.parse(req.body.file);
                if (!file) {
                    res.status(201).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
                } else {
                    console.log("등록 예정 상품 수 : " + (file.length-2));
                    let all_clear = true;
                    let duplicate_rows = [];
                    let incorrect_rows = [];
                    for (let i = 2; i < file.length; i++) {
                        if(file[i].barcode == undefined || file[i].barcode == ""){
                            all_clear = false;
                            incorrect_rows.push(i+2);
                            continue;
                        }

                        if(file[i].category == undefined || file[i].category == ""){
                            all_clear = false;
                            incorrect_rows.push(i+2);
                            continue;
                        }
                        let category_idx = await Category.find({ name: file[i].category }).select({ _id: 1 });
                        if(category_idx.length == 0){
                            all_clear = false;
                            incorrect_rows.push(i+2);
                            continue;
                        }
                        console.log(category_idx)
                        let check_barcode = await Product.find({ barcode : file[i].barcode , partner_idx : partner_idx, one_hundred_deal_event : false });
                        if(check_barcode.length != 0){
                            console.log("already exist : " + check_barcode);
                            all_clear = false;
                            duplicate_rows.push(i+2);
                        } else {
                            let created_at = Date.now() + (3600000 * 9);
                            let barcode = file[i].barcode;
                            let detail_name = file[i].detail_name;
                            let name = file[i].name;
                            let standard = "0"
                            if(file[i].standard != null || file[i].standard != undefined) {
                                standard = file[i].standard;
                            }
                            let original_price = Number(file[i].original_price);
                            let count = Number(file[i].count);
                            let hashtag = [];
                            hashtag.push(file[i].hashtag1);
                            hashtag.push(file[i].hashtag2);
                            hashtag.push(file[i].hashtag3);

                            let temp_detail_img = [];
                            if(file[i].detail_img != undefined) {
                                temp_detail_img = file[i].detail_img;
                            } else {
                                temp_detail_img = [];
                            }
                            let detail_img = [];
                            if(temp_detail_img.length != 0) {
                                for (let j = 0; j < temp_detail_img.length; j++) {
                                    if (temp_detail_img[j] !== undefined) {
                                        let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + temp_detail_img[j] + '.jpg'
                                        detail_img.push(img1);
                                    } 
                                }
                            } else {
                                detail_img.push("");
                            }

                            let temp_main_img = [];
                            if(file[i].main_img != undefined) {
                                temp_main_img = file[i].main_img;
                            } else {
                                temp_main_img = [];
                            }
                            let main_img = [];
                            if(temp_main_img.length != 0) {
                                for (let j = 0; j < temp_main_img.length; j++) {
                                    if (temp_main_img[j] !== undefined) {
                                        let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + temp_main_img[j] + '.jpg'
                                        main_img.push(img1);
                                    } 
                                }
                            } else {
                                main_img.push("");
                            }

                            const product = new Product({
                                img: main_img,
                                detail_img: detail_img,
                                hashtag: hashtag,
                                events: [],
                                name: name,
                                detail_name: detail_name,
                                barcode: barcode,
                                standard: standard,
                                original_price: original_price,
                                partner_idx: partner_idx,
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
                        }
                    }
                    if(all_clear){
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                    } else {
                        console.log("이미 있는 바코드 넘버 수 : " + duplicate_rows.length);
                        console.log(duplicate_rows)
                        console.log("입력이 잘못된 행 수 : " + incorrect_rows.length);
                        console.log(incorrect_rows)
                        res.status(202).send('오류');
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
