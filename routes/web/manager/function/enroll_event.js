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
            console.log("event : " + data.partner_idx)
            res.render('manager/enroll_event', { data });
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
                    console.log("등록 예정 이벤트 수 : " + (file.length-2));
                    let all_clear = true;
                    let not_finded_rows = [];
                    let incorrect_rows = [];
                    for (let i = 2; i < file.length; i++) {

                        if(file[i].barcode == undefined || file[i].barcode == ""){
                            all_clear = false;
                            incorrect_rows.push(i+2);
                            continue;
                        }
                        let find_product = await Product.find({ partner_idx : partner_idx, barcode : file[i].barcode, one_hundred_deal_event : false });
                        
                        if(find_product.length == 0){
                            all_clear = false;
                            not_finded_rows.push(i+2);
                        } else {
                            let type;
                            if(file[i].type == '전단할인'){
                                type = 200;
                            } else if(file[i].type == '상시할인') {
                                type = 300;
                            } else if(file[i].type == '100원딜'){
                                type = 100;
                            }

                            if(type == 200){
                                if(file[i].start_date == "" || file[i].start_date == undefined || file[i].end_date == "" || file[i].end_date == undefined){
                                    all_clear = false;
                                    incorrect_rows.push(i+2);
                                } else {
                                    
                                    let start_date = new Date(new Date(file[i].start_date).getTime() + (3600000 * 9) + 52000);
                                    let end_date = new Date(new Date(file[i].end_date).getTime() + (3600000 * 33) + 52000);
                                    let update_event = await Product.updateOne({ partner_idx : partner_idx, barcode : file[i].barcode , one_hundred_deal_event : false }, 
                                        {$push : { events : { type : type, start_date : start_date, end_date : end_date, saled_price : file[i].sale_price }}});
                                    console.log(update_event);   
                                }
                            } else if(type == 300){
                                let start_date = new Date(new Date("2000-02-02T00:00:00.000Z").getTime() + (3600000 * 9) + 52000);
                                let end_date =new Date(new Date("2222-02-02T00:00:00.000Z").getTime() + (3600000 * 33) + 52000);
                                let update_event = await Product.updateOne({ partner_idx : partner_idx, barcode : file[i].barcode , one_hundred_deal_event : false }, 
                                    {$push : { events : { type : type, start_date : start_date, end_date : end_date, saled_price : file[i].sale_price }}});
                                console.log(update_event);
                            } else {
                                //100원딜 추후 처리
                            }
                        }
                    }
                    if(all_clear) {
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                    } else {
                        console.log("상품이 등록되지 않은 바코드 넘버 수 : " + not_finded_rows.length)
                        console.log(not_finded_rows)
                        console.log("입력이 올바르지 않은 행의 수 : " + incorrect_rows.length)
                        console.log(incorrect_rows)
                        res.status(202).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
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