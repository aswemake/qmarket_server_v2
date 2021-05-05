var express = require('express');
var router = express.Router();
const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');
const admin_pool = require('../../../../config/admin_dbConfig');
const fs = require('fs');
const Excel = require('exceljs');
const multer = require('multer');
let Product_v2 = require('../../../../schemas/product_v2');
let Category_v2 = require('../../../../schemas/category_v2');
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
            let data = { partner_idx : req.params };
            res.render('manager/enroll_excel', { data });
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})
//프론트에서 서버로 보내는건 엑셀 파일 뿐이라는 가정
//단, 엑셀파일 안에 상세페이지 이미지, 메인이미지의 파일명을 정확히 넣어줘야함.(확장자는 안넣어도 됨)(이미지 파일은 jpg만)
//엑셀파일안에서 항목 순서
//카테고리, 상호명, 상품명, 가격, 할인율, 재고, 해시태그1, 해시태그2, 해시태그3, 메인 이미지명, 상세페이지 이미지명
//상세페이지가 여러장인 경우 셀에 이미지파일 입력 시 줄바꿈으로 구분해주어야 함
//필요한 모듈만 써뒀음
//상품을 엑셀파일로 등록 시 필요한 모듈 및 미들웨어
//엑셀파일로 상품 입력, insert_data.js의 파일 위치에 uploads 폴더 필요
router.post('/', async function (req, res) {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        try {
            console.log("user : ", req.signedCookies.user);
            let query = "SELECT market_idx FROM managers WHERE user_idx = ?"
            var connection = await admin_pool.getConnection();
            let result = await connection.query(query, req.signedCookies.user[0]);
            let partner_idx = result[0].market_idx;
            if (!partner_idx) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let file = JSON.parse(req.body.file);
                if (!file) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
                } else {
                    console.log(file.length);
                    for (let i = 0; i < file.length; i++) {
                        let created_at = Date.now() + (3600000 * 9);
                        let hashtag = [];
                        let main_img = [];
                        let detail_img = [];
                        let product_img = [];
                        let barcode = file[i].barcode;
                        let count = Number(file[i].count);
                        let price = Number(file[i].price);
                        let sale_ratio = Number(file[i].sale_ratio) / 100;
                        let standard = "0";
                        console.log(file[i].standard);
                        if(file[i].standard != null || file[i].standard != undefined) {
                            standard = file[i].standard;
                        }  
                        let saled_price;
                        hashtag.push(file[i].hashtag1);
                        hashtag.push(file[i].hashtag2);
                        hashtag.push(file[i].hashtag3);
                        console.log(file[i].detail_img)
                        if(file[i].detail_img != undefined) {
                            detail_img = file[i].detail_img.split('\r\n');
                        } else {
                            detail_img = [];
                        }
                        if (sale_ratio == 0) {
                            saled_price = price;
                        } else {
                            saled_price = Math.round(price * (1 - sale_ratio) / 10) * 10;
                        }
                        let img;
                        if(file[i].main_img != undefined) {
                            img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + file[i].main_img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
                        } else {
                            img = "";
                        }
                        main_img.push(img);
                        if(detail_img.length != 0) {
                            for (let i = 0; i < detail_img.length; i++) {
                                if (detail_img[i] !== undefined) {
                                    let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + detail_img[i].trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
                                    product_img.push(img1);
                                } 
                            }
                        } else {
                            product_img.push("");
                        }
                        console.log(product_img);
                        console.log(main_img);
                        //카테고리 id
                        let find_category = await Category_v2.find({ name: file[i].category.trim().replace(/\"/gi, "") });
                        console.log(find_category);
                        let category_idx = find_category[0]._id;

                        // 기본 할인 설정
                        let default_sale_ratio = 0;
                        if (0<=price && price<=999) default_sale_ratio = 0.083;
                        else if (1000<=price && price<=2999) default_sale_ratio = 0.183;
                        else if (3000<=price && price<=4999) default_sale_ratio = 0.158;
                        else if (5000<=price && price<=9999) default_sale_ratio = 0.166;
                        else if (10000<=price && price<=19999) default_sale_ratio = 0.166;
                        else if (20000<=price && price<=49999) default_sale_ratio = 0.176;
                        else if (50000<=price && price<=99999) default_sale_ratio = 0.166;
                        else if (100000<=price && price<=299999) default_sale_ratio = 0.183;
                        else if (300000<=price && price<=499999) default_sale_ratio = 0.233;
                        else if (500000<=price) default_sale_ratio = 0.333;

                        // 가라 가격 설정
                        let modifed_price = Math.floor(price / (1 - default_sale_ratio));
                        modifed_price = (modifed_price - (modifed_price % 10)); // 1의 자리 제거

                        const product = new Product_v2({
                            img: main_img,
                            detail_img: product_img,
                            name: file[i].name,
                            detail_name: file[i].detail_name,
                            barcode: barcode,
                            standard: standard,
                            original_price: price, // 진짜 가격
                            price: modifed_price, // 가라 가격
                            default_sale_ratio: default_sale_ratio, // 기본 할인율
                            hashtag: hashtag,
                            partner_idx: partner_idx,
                            category_idx: category_idx,
                            count: count,
                            like_count:0,
                            shared_count:0,
                            saled_count:0,
                            one_hundred_deal_event: false,
                            events: [], // 타임세일, 뭔세일, 뭔세일 등등등 나중에 추가될 것
                            is_adult: false,
                            enabled: true,
                            created_at: created_at
                        })
                        console.log("standard : ", product.standard);
                        const product_save_result = await product.save();
                        // console.log("product image : ", product_img)
                        // console.log("product : ", product);
                        // const product_save_result = await product.save();
                        // console.log('데이터 삽입 완료');
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

async function sendExcelFile() {
    try {
        let input = document.getElementById('product_excel');
        let reader = new FileReader();
        reader.onload = function () {
            let data = reader.result;
            let workBook = XLSX.read(data, { type: 'binary' });
            workBook.SheetNames.forEach(function (sheetName) {
                console.log('SheetName: ' + sheetName);
                let rows = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName]);
                rows.forEach(object => {
                    renameKey(object, '바코드', 'barcode');
                    renameKey(object, '상품이름', 'detail_name');
                    renameKey(object, '규격', 'standard');
                    renameKey(object, '상품 브랜드 이름', 'name');
                    renameKey(object, '상품 카테고리', 'category');
                    renameKey(object, '상품 원가', 'price');
                    renameKey(object, '상품 할인율', 'sale_ratio');
                    renameKey(object, '상품 재고', 'count');
                    renameKey(object, '해시태그1', 'hashtag1');
                    renameKey(object, '해시태그2', 'hashtag2');
                    renameKey(object, '해시태그3', 'hashtag3');
                    renameKey(object, '메인 이미지', 'main_img');
                    renameKey(object, '상세 이미지', 'detail_img');
                })
                if (confirm("상품을 등록하시겠습니까?")) {
                    var xhttp = new XMLHttpRequest()
                    xhttp.onreadystatechange = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            alert('상품이 성공적으로 등록되었습니다.')
                        }
                    }
                    xhttp.open("POST", "/manager/product/inventory/enroll_excel", true)
                    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                    xhttp.send("file=" + JSON.stringify(rows));
                    //window.location.reload()
                }
            })
        };
        reader.readAsBinaryString(input.files[0]);
    } catch (error) {
        alert(error);
    }
}
