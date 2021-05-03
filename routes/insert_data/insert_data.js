var express = require('express');
var router = express.Router();
var moment = require('moment');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Party = require('../../schemas/party');
const Location = require('../../schemas/location');
const Product = require('../../schemas/product');
const Banner = require('../../schemas/banner');
const Coupon = require('../../schemas/coupon');
const Hashtag = require('../../schemas/hashtag');
const Ticket = require('../../schemas/ticket');
const Feed = require('../../schemas/feed');
const Benefit = require('../../schemas/benefit');
const Mission_admin = require('../../schemas/mission_admin');
const Category = require('../../schemas/category');

// 상품 카테고리 등록
router.post('/category', async (req, res) => {
    try {
        const csv = `name
        커피/원두`
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);
        let product_arr = [];
        for (let i = 0; i < dataset.length; i++) {
            const category = new Category({
                type: '우리동네 가게',
                name: dataset[i].name.trim().replace(/\"/gi, "").replace(/,/gi, "/"),
                img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].name.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                product: product_arr,
                is_adult: false
            })
            const category_save_result = await category.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
// 반상회 미션 등록
router.post('/mission_admin', async (req, res) => {
    try {
        const csv = `party_idx	episode	content
        5ee9b0efc304473024791b7c	3	자신의 인생 영화에 어울리는 맥주
        5ee9b105c304473024791bc4	3	'계란, 토마토, 아보카도, 새우, 베이컨' 을 활용하여 요리대결`

        var created_at = Date.now() + (3600000 * 9);
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let find_leader = await Party.find({ _id: dataset[i].party_idx.trim().replace(/\"/gi, "") }).select({ leader: 1 });
            let episode = Number(dataset[i].episode.replace(/(\s*)/g, ""));
            const mission_admin = new Mission_admin({
                party_idx: dataset[i].party_idx.trim().replace(/\"/gi, ""),
                leader: find_leader[0].leader,
                episode: episode,
                content: dataset[i].content.trim().replace(/\"/gi, ""),
                created_at: created_at
            })
            const mission_admin_save_result = await mission_admin.save();
            console.log(`_id: ${mission_admin_save_result._id}`);
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
// 반상회 쿠폰 입력
router.post('/benefit', async (req, res) => {
    try {
        const csv = `party_idx	img
        5ec78457d9dedb328089390f	쿠폰-13
        5ec7778bd6fa2d459ca9e6f4	쿠폰-15`

        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            const benefit = new Benefit({
                party_idx: dataset[i].party_idx.trim().replace(/\"/gi, ""),
                img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
            })
            const benefit_save_result = await benefit.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 반상회 피드 입력
router.post('/feed', async (req, res) => {
    try {
        const csv = `party_idx	name	img0	img1	img2	img3	img4	img5	img6	img7	img8	img9	img10
        5f60257419b47c4f202dac2a	첫 번째 모임	RE feed 14(1)-0	RE feed 14(1)-1	RE feed 14(1)-2	RE feed 14(1)-3	RE feed 14(1)-4	RE feed 14(1)-5	RE feed 14(1)-6`

        var created_at = Date.now() + (3600000 * 9);
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let feed_img = [];
            // 반상회 이미지
            if (dataset[i].img0 !== undefined) {
                let img0 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img0.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img0);
                console.log(feed_img)
            }
            if (dataset[i].img1 !== undefined) {
                let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img1.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img1);
                console.log(feed_img)
            }
            if (dataset[i].img2 !== undefined) {
                let img2 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img2.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img2);
                console.log(feed_img)
            }
            if (dataset[i].img3 !== undefined) {
                let img3 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img3.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img3);
            }
            if (dataset[i].img4 !== undefined) {
                let img4 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img4.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img4);
            }
            if (dataset[i].img5 !== undefined) {
                let img5 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img5.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img5);
            }
            if (dataset[i].img6 !== undefined) {
                let img6 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img6.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img6);
            }
            if (dataset[i].img7 !== undefined) {
                let img7 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img7.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img7);
            }
            if (dataset[i].img8 !== undefined) {
                let img8 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img8.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img8);
            }
            if (dataset[i].img9 !== undefined) {
                let img9 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img9.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img9);
                console.log(feed_img);
            }
            console.log(dataset[i].img10);
            if (dataset[i].img10 !== undefined) {
                console.log("test");
                let img10 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img10.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                feed_img.push(img10);
            }
            console.log(feed_img);
            const feed = new Feed({
                party_idx: dataset[i].party_idx.trim().replace(/\"/gi, ""),
                name: dataset[i].name.trim().replace(/\"/gi, ""),
                content: 'test',
                img: feed_img,
                created_at: created_at
            })
            const feed_save_result = await feed.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
// 해시태그 정보 입력
router.post('/hashtag', async (req, res) => {
    try {
        const csv = `name
        반상회
        커피
        와인
        꽃`
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            const hashtag = new Hashtag({
                name: dataset[i].name.trim().replace(/\"/gi, "")
            })
            const hashtag_save_result = await hashtag.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 쿠폰 정보 입력
router.post('/coupon', async (req, res) => {
    try {
        const csv = `name	sale_price	limit_price	limit_date	coupon_type
        반상회 할인 쿠폰	1000	15000	2020-03-18	2
        상품 할인 쿠폰	1500	20000	2020-03-20	1
        공통 할인 쿠폰	2000	25000	2020-03-22	3`
        var created_at = Date.now() + (3600000 * 9);
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let sale_price = Number(dataset[i].sale_price.replace(/(\s*)/g, ""));
            let limit_price = Number(dataset[i].limit_price.replace(/(\s*)/g, ""));
            let coupon_type = Number(dataset[i].coupon_type.replace(/(\s*)/g, ""));
            const coupon = new Coupon({
                name: dataset[i].name.trim().replace(/\"/gi, ""),
                sale_price: sale_price,
                limit_price: limit_price,
                limit_date: dataset[i].limit_date.trim().replace(/\"/gi, ""),
                coupon_type: coupon_type,
                created_at: created_at
            })
            const coupon_save_result = await coupon.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 배너 정보 입력
router.post('/banner', async (req, res) => {
    try {
        const csv = `main_img	link
        깔끔한 화장실	https://blog.naver.com/aswemake
        테마박스 19 1-1	https://blog.naver.com/aswemake`
        var created_at = Date.now() + (3600000 * 9);
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            const banner = new Banner({
                main_img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].main_img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                link: dataset[i].link.trim().replace(/\"/gi, ""),
                created_at: created_at
            })
            const banner_save_result = await banner.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 상품 정보 입력
router.post('/product', async (req, res) => {
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

// 반상회 1회권 티켓
router.post('/ticket/one', async (req, res) => {
    try {
        const csv = `party_idx	img
        5ec78457d9dedb328089390f	입장권13_ONE`
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let get_start_time = await Party.find({
                _id: dataset[i].party_idx.trim().replace(/\"/gi, "")
            }).select({
                start_time: 1
            });
            let momentDate = moment(get_start_time[0].start_time);
            let korea_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() - 9));
            let limit_date = moment(korea_time).add(1, "days").format("YYYY-MM-DD");
            console.log(limit_date);
            const ticket = new Ticket({
                party_idx: dataset[i].party_idx.trim().replace(/\"/gi, ""),
                img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                type: 1,
                limit_date: limit_date
            })
            const ticket_save_result = await ticket.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 반상회 전체 티켓
router.post('/ticket/all', async (req, res) => {
    try {
        const csv = `party_idx	img
        5ec78457d9dedb328089390f	입장권13_ALL`
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            const ticket_all = new Ticket({
                party_idx: dataset[i].party_idx.trim().replace(/\"/gi, ""),
                img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                type: 2,
            })
            const ticket_save_result = await ticket_all.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
// 반상회 장소 입력
router.post('/location', async (req, res) => {
    try {
        const csv = `longitude	latitude	name	address
        126.6775135	37.4582061	딴뚬꽌뚬	인천 미추홀구 경인로 358 B1
        126.7176118	37.4864224	애드모먼트	인천 부평구 경인로 899`

        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let longitude = Number(dataset[i].longitude.replace(/(\s*)/g, ""));
            let latitude = Number(dataset[i].latitude.replace(/(\s*)/g, ""));
            const location = new Location({
                location: {
                    coordinates: [longitude, latitude]
                },
                name: dataset[i].name.trim().replace(/\"/gi, ""),
                address: dataset[i].address
            })
            const location_save_result = await location.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// 반상회 상품 입력
router.post('/party', async (req, res) => {
    try {
        const csv = `main_img	img1	img2	img3	img4	img5	img6	img7	img8	img9	img10	name	leader	start_date	start_time	hashtag0	hashtag1	hashtag2	hashtag3	location_idx	max	price	sale_ratio
        24기 모집	24-1	24-2	24-3	24-4	24-5-1	24-6	24-7	24-8-1	24-9	24-10	나만의 향수 만들기	주윤경	2주 반복 수요일	2020-07-15T19:00	2020-07-29T19:00				1	1	0	0	입장권-24_ONE	입장권-24_ALL	쿠폰-24	향수	공방	퍼품	만들기	5f0415792f809d7b2c907a30	6	34900	0.15`
        var created_at = Date.now() + (3600000 * 9);
        console.log(created_at);
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let party_img = [];
            let hashtag_arr = [];
            let max = Number(dataset[i].max.replace(/(\s*)/g, ""));
            let price = Number(dataset[i].price.replace(/(\s*)/g, ""));
            let sale_ratio = Number(dataset[i].sale_ratio.replace(/(\s*)/g, ""));

            // 반상회 이미지
            if (dataset[i].img1 !== "") {
                let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img1.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img1);
            }
            if (dataset[i].img2 !== "") {
                let img2 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img2.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img2);
            }
            if (dataset[i].img3 !== "") {
                let img3 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img3.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img3);
            }
            if (dataset[i].img4 !== "") {
                let img4 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img4.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img4);
            }
            if (dataset[i].img5 !== "") {
                let img5 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img5.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img5);
            }
            if (dataset[i].img6 !== "") {
                let img6 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img6.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img6);
            }
            if (dataset[i].img7 !== "") {
                let img7 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img7.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img7);
            }
            if (dataset[i].img8 !== "") {
                let img8 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img8.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img8);
            }
            if (dataset[i].img9 !== "") {
                let img9 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img9.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img9);
            }
            if (dataset[i].img10 !== "") {
                let img10 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img10.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img10);
            }

            // 반상회 해시태그
            if (dataset[i].hashtag0 !== "") {
                let hashtag0 = dataset[i].hashtag0.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag0);
            }
            if (dataset[i].hashtag1 !== "") {
                let hashtag1 = dataset[i].hashtag1.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag1);
            }
            if (dataset[i].hashtag2 !== "") {
                let hashtag2 = dataset[i].hashtag2.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag2);
            }
            if (dataset[i].hashtag3 !== "") {
                let hashtag3 = dataset[i].hashtag3.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag3);
            }
            for (let j = 0; j < hashtag_arr.length; j++) {
                let find_hashtag = await Hashtag.find({
                    name: hashtag_arr[j]
                });
                if (!find_hashtag[0]) {
                    let hashtag = new Hashtag({
                        name: hashtag_arr[j]
                    })
                    let hashtag_save_result = await hashtag.save();
                    console.log('데이터 삽입');
                } else {
                    continue;
                }
            }
            let momentDate = moment(dataset[i].start_time.trim().replace(/\"/gi, ""));
            let start_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
            console.log(start_time);
            const party = new Party({
                main_img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].main_img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                img: party_img,
                name: dataset[i].name.trim().replace(/\"/gi, ""),
                content: 'test',
                leader: dataset[i].leader.trim().replace(/\"/gi, ""),
                start_date: dataset[i].start_date.trim().replace(/\"/gi, ""),
                start_time: start_time,
                hashtag: hashtag_arr,
                location_idx: dataset[i].location_idx.trim().replace(/\"/gi, ""),
                max: max,
                price: price,
                sale_ratio: sale_ratio,
                episode: 0,
                is_finished: false,
                is_four: false,
                created_at: created_at
            })
            const party_save_result = await party.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})



// 새로운 반상회 입력
// 반상회 상품 입력
router.post('/new_party', async (req, res) => {
    try {
        const csv = `main_img	img1	img2	img3	img4	img5	img6	img7	img8	img9	img10	name	leader	start_date	start_time1	start_time2	start_time3	start_time4	start_time5	benefit_date	pattern1	pattern2	pattern3	pattern4	pattern5	ticket_one	ticket_all	benefit	hashtag0	hashtag1	hashtag2	hashtag3	location_idx	max	price	sale_ratio
        18기 Re 모집 썸네일	RE 18-1	RE 18-2	RE 18-3	RE 18-4	RE 18-5-1	RE 18-6	RE 18-7	RE 18-8-1	RE 18-9		나무와 마주하는 특별한 시간	박지혜	매월 2주차 월요일	2020-10-12T19:00	2020-11-09T19:00	2020-12-14T19:00	2021-01-11T19:00		2021-02-08T19:00	1	1	1	1		입장권-18_ONE	입장권-18_ALL	쿠폰-18	목공예	나무	우드	디자인	5ec77ab1eb8e2040340426ec	4	49900	0.15`
        var created_at = Date.now() + (3600000 * 9);
        console.log(created_at);
        //var csv is the CSV file with headers
        function csvJSON(csv) {
            var lines = csv.split("\n");

            var result = [];

            var headers = lines[0].trim().split("\t");
            console.log(headers);

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].trim().split("\t");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            //return result; //JavaScript object
            return result; //JSON
        }

        const dataset = csvJSON(csv);
        console.log('데이터셋 : ', dataset);
        console.log('데이터셋 길이 : ', dataset.length);

        for (let i = 0; i < dataset.length; i++) {
            let party_img = [];
            let hashtag_arr = [];
            let time_arr = [];
            let pattern_arr = [];
            let benefit_arr = [];
            let max = Number(dataset[i].max.replace(/(\s*)/g, ""));
            let price = Number(dataset[i].price.replace(/(\s*)/g, ""));
            let sale_ratio = Number(dataset[i].sale_ratio.replace(/(\s*)/g, ""));

            // 반상회 패턴
            if (dataset[i].pattern1 !== "") {
                pattern_arr.push(Number(dataset[i].pattern1.replace(/(\s*)/g, "")));
            }
            if (dataset[i].pattern2 !== "") {
                pattern_arr.push(Number(dataset[i].pattern2.replace(/(\s*)/g, "")));
            }
            if (dataset[i].pattern3 !== "") {
                pattern_arr.push(Number(dataset[i].pattern3.replace(/(\s*)/g, "")));
            }
            if (dataset[i].pattern4 !== "") {
                pattern_arr.push(Number(dataset[i].pattern4.replace(/(\s*)/g, "")));
            }
            if (dataset[i].pattern5 !== "") {
                pattern_arr.push(Number(dataset[i].pattern4.replace(/(\s*)/g, "")));
            }

            // 반상회 이미지
            if (dataset[i].img1 !== "") {
                let img1 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img1.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img1);
            }
            if (dataset[i].img2 !== "") {
                let img2 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img2.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img2);
            }
            if (dataset[i].img3 !== "") {
                let img3 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img3.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img3);
            }
            if (dataset[i].img4 !== "") {
                let img4 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img4.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img4);
            }
            if (dataset[i].img5 !== "") {
                let img5 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img5.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img5);
            }
            if (dataset[i].img6 !== "") {
                let img6 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img6.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img6);
            }
            if (dataset[i].img7 !== "") {
                let img7 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img7.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img7);
            }
            if (dataset[i].img8 !== "") {
                let img8 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img8.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img8);
            }
            if (dataset[i].img9 !== "") {
                let img9 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img9.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img9);
            }
            if (dataset[i].img10 !== "") {
                let img10 = 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].img10.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                party_img.push(img10);
            }

            // 반상회 해시태그
            if (dataset[i].hashtag0 !== "") {
                let hashtag0 = dataset[i].hashtag0.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag0);
            }
            if (dataset[i].hashtag1 !== "") {
                let hashtag1 = dataset[i].hashtag1.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag1);
            }
            if (dataset[i].hashtag2 !== "") {
                let hashtag2 = dataset[i].hashtag2.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag2);
            }
            if (dataset[i].hashtag3 !== "") {
                let hashtag3 = dataset[i].hashtag3.trim().replace(/\"/gi, "");
                hashtag_arr.push(hashtag3);
            }
            for (let j = 0; j < hashtag_arr.length; j++) {
                let find_hashtag = await Hashtag.find({
                    name: hashtag_arr[j]
                });
                if (!find_hashtag[0]) {
                    let hashtag = new Hashtag({
                        name: hashtag_arr[j]
                    })
                    let hashtag_save_result = await hashtag.save();
                    console.log('데이터 삽입');
                } else {
                    continue;
                }
            }
            // 반상회 시간정보
            if (dataset[i].start_time1 !== "") {
                let momentDate = moment(dataset[i].start_time1.trim().replace(/\"/gi, ""));
                let start_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
                time_arr.push(start_time);
            }
            if (dataset[i].start_time2 !== "") {
                let momentDate = moment(dataset[i].start_time2.trim().replace(/\"/gi, ""));
                let start_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
                time_arr.push(start_time);
            }
            if (dataset[i].start_time3 !== "") {
                let momentDate = moment(dataset[i].start_time3.trim().replace(/\"/gi, ""));
                let start_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
                time_arr.push(start_time);
            }
            if (dataset[i].start_time4 !== "") {
                let momentDate = moment(dataset[i].start_time4.trim().replace(/\"/gi, ""));
                let start_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
                time_arr.push(start_time);
            }
            if (dataset[i].start_time5 !== "") {
                let momentDate = moment(dataset[i].start_time4.trim().replace(/\"/gi, ""));
                let start_time = (momentDate.toDate().setHours(momentDate.toDate().getHours() + 9));
                time_arr.push(start_time);
            }
            console.log(time_arr);
            for (let h = 1; h < time_arr.length; h++) {
                benefit_arr.push(time_arr[h]);
            }
            let momentDate2 = moment((dataset[i].benefit_date).trim().replace(/\"/gi, ""));
            let start_time = (momentDate2.toDate().setHours(momentDate2.toDate().getHours() + 9));
            benefit_arr.push(start_time);
            const new_party = new Party({
                main_img: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].main_img.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                img: party_img,
                name: dataset[i].name.trim().replace(/\"/gi, ""),
                content: 'test',
                leader: dataset[i].leader.trim().replace(/\"/gi, ""),
                start_date: dataset[i].start_date.trim().replace(/\"/gi, ""),
                start_time: time_arr,
                pattern: pattern_arr,
                ticket: {
                    one: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].ticket_one.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                    all: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].ticket_all.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png'
                },
                benefit: 'https://s3.ap-northeast-2.amazonaws.com/sopt.seongjin.com/' + dataset[i].benefit.trim().replace(/\"/gi, "").replace(/\s/g, '+') + '.png',
                benefit_date: benefit_arr,
                hashtag: hashtag_arr,
                location_idx: dataset[i].location_idx.trim().replace(/\"/gi, ""),
                max: max,
                price: price,
                sale_ratio: sale_ratio,
                episode: 0,
                is_finished: false,
                created_at: created_at
            })
            const party_save_result = await new_party.save();
            console.log(i + 1, '번째 데이터 삽입');
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;