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
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
                } else {
                    console.log("등록 예정 이벤트 수 : " + (file.length-1));
                    for (let i = 1; i < file.length; i++) {
                        let update_event = 
                                await Product.updateOne({ partner_idx : partner_idx, barcode : file[i].barcode , detail_name : file[i].detail_name }, 
                                    {$push : { events : { name : file[i].name, start_date : new Date(new Date(file[i].start_date).getTime() + (3600000 * 9) + 52000), end_date : new Date(new Date(file[i].end_date).getTime() + (3600000 * 9) + 52000), sale_ratio : file[i].sale_price }}});
            
                        console.log(update_event);
                    }
                    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})
module.exports = router;