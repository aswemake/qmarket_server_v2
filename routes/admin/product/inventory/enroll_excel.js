var express = require('express');
var router = express.Router();

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');
const fs = require('fs');
const Excel = require('exceljs');
const multer = require('multer');

let Product = require('../../../../schemas/product');
let Category = require('../../../../schemas/category');

var storage = multer.diskStorage({
    destination(req, file, cb){
        cb(null, './uploads/');
    },
    filename(req, file, cb){
        cb(null, `${file.originalname}`);
    },
});
var uploadWithOriginalFilename = multer({ storage : storage});

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let data = [];
            res.render('enroll_excel', { data });
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
//필요한 모듈만 써뒀음​
//상품을 엑셀파일로 등록 시 필요한 모듈 및 미들웨어
//엑셀파일로 상품 입력, insert_data.js의 파일 위치에 uploads 폴더 필요

router.post('/', async function(req, res){
  try{
    let file = JSON.parse(req.body.file);
    console.log("length : ", file.length);
    for(let i = 0; i < file.length; i++){
        console.log(file[i].detail_img);
        let created_at = Date.now() + (3600000 * 9);
        let hashtag = [];
        let main_img = [];
        let detail_img = [];
        let product_img = [];
        let count = Number(file[i].count);
        let price = Number(file[i].price);
        let sale_ratio = Number(file[i].sale_ratio)/100;
        let saled_price;
        hashtag.push(file[i].hashtag1);
        hashtag.push(file[i].hashtag2);
        hashtag.push(file[i].hashtag3);
        detail_img = file[i].detail_img.split('\r\n');
        if(sale_ratio == 0){
            saled_price = price;
        } else {
            saled_price = Math.round(price * (1 - sale_ratio) / 10) * 10; 
        }
        let img = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + file[i].main_img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
        main_img.push(img);
        console.log(main_img);
        for(let i = 0; i < detail_img.length; i++) {
            if (detail_img[i] !== undefined) {
                let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + detail_img[i].trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.jpg'
                product_img.push(img1);
            }
        }
        //카테고리 id
        let find_category = await Category.find({ name : file[i].category.trim().replace(/\"/gi, "") });
        let category_idx = find_category[0]._id;
        const product = new Product({
            img: main_img,
            detail_img: product_img,
            name: file[i].name,
            detail_name: file[i].detail_name,
            price: price,
            hashtag: hashtag,
            sale_ratio: sale_ratio,
            saled_price: saled_price,
            category_idx: category_idx,
            count: count,
            is_adult: false,
            enabled: true,
            created_at: created_at
        })
        console.log(product)
        const product_save_result = await product.save();
        // console.log("product image : ", product_img)
        // console.log("product : ", product);
        // const product_save_result = await product.save();
        // console.log('데이터 삽입 완료');
    }
    res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
  } catch (err) {
      console.log(err);
      res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
  }
})
module.exports = router;