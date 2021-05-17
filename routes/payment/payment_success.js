var express = require('express');
var router = express.Router();
var axios = require('axios');

var admin = require('firebase-admin');
var serviceAccount = require('../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const pool = require('../../config/dbConfig');
const admin_pool = require('../../config/admin_dbConfig');
const jwt = require('../../module/jwt');

const Product = require('../../schemas/product_v2');
const Coupon = require('../../schemas/coupon');
const Coupon_User = require('../../schemas/coupon_user');
const Partner = require('../../schemas/partner');

//알림톡 보내기 위한 모듈 
const HMACSHA256 = require('crypto-js/hmac-sha256')
const BASE64 = require('crypto-js/enc-base64')


// 결제 성공 API
router.post('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    // merchant_uid는 orders table에 order_id로 입력
    let { merchant_uid, imp_uid, partner_idx, pay_method, coupon_idx, coupon_price, qmoney, delivery_price,
          receiver, phone, email, mail_number, address, detail_address, delivery_memo, home_pwd, product, price } = req.body;
    if (!user_idx || !merchant_uid || !imp_uid || !partner_idx || !pay_method || coupon_price == undefined || qmoney == undefined ||
        delivery_price == undefined || !receiver || !phone || !email || !address || !detail_address || !product || !price) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            if (!mail_number) mail_number = null;
            if (!delivery_memo) delivery_memo = "";
            if (!home_pwd) home_pwd = null;
            if (!coupon_idx) coupon_idx = null;

            var connection = await pool.getConnection();
            var admin_connection = await admin_pool.getConnection();
            await connection.beginTransaction(); // 트랜잭션 시작


            /* 결제 되어야 하는 금액 구하기 */

            let amountToBePaid = 0;
            // 상품 결제 금액 추가
            for (let i = 0; i < product.length; i++) {
                amountToBePaid += product[i].price; // products에 product_idx, price, count까지 모두 받아와야할듯
            }
            // 배송비, 사용 큐머니, 쿠폰 할인 금액 추가
            amountToBePaid += (delivery_price + qmoney + coupon_price);
            


            /* iamport에서 결제 정보 받아오기 */
            // iamport api call에 관련된 모든 error들은 catch로 넘어감

            // 액세스 토큰(access token) 발급 받기
            const getToken = await axios({
                url: "https://api.iamport.kr/users/getToken",
                method: "post", // POST method
                headers: { "Content-Type": "application/json" },
                data: {
                    imp_key: process.env.IMP_KEY, // REST API키
                    imp_secret: process.env.IMP_SECRET // REST API Secret
                }
            });
            const { access_token } = getToken.data.response; // 인증 토큰

            // imp_uid로 아임포트 서버에서 결제 정보 조회
            const getPaymentData = await axios({
                url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
                method: "get", // GET method
                headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
            });
            const paymentData = getPaymentData.data.response; // 조회한 결제 정보
            const { amount, status } = paymentData;

            
            /* 결제 검증하기 */

            // 결제 금액 불일치. 위/변조 된 결제 
            if (amount !== amountToBePaid) {
                let incorret_payment_amount_error = {
                    response: {
                        data: {
                            code: -1,
                            message: "incorret payment amount"
                        }
                    }
                }
                throw incorret_payment_amount_error;
            }
            // 결제 금액 일치. (결제 된 금액 === 결제 되어야 하는 금액)
            else {
                switch (status) {
                    // 결제 완료
                    case "paid":
                        let reward_qmoney = Math.floor(amountToBePaid * 0.01);
                        let reward_qmoney_content = '[큐마켓] 상품 결제 적립금';
                        let used_qmoney_content = '[큐마켓] 상품 결제 사용';
                        
                        
                        /* 결제 내역 저장 및 동기화 */

                        // today_order_num 구하기
                        let now = new Date(Date.now() + (3600000 * 9));
                        let year = now.getFullYear();
                        let month = ("0" + (1 + now.getMonth())).slice(-2);
                        let day = ("0" + now.getDate()).slice(-2);
                        let start_date = `${year}-${month}-${day} 00:00:00`;
                        let end_date = `${year}-${month}-${day} 23:59:59`;
                        let get_today_order_num_query = `SELECT IFNULL(max(today_order_num), 0) + 1 AS today_order_num
                                                         FROM orders
                                                         WHERE partner_idx = ? AND created_at >= ? AND created_at <= ?`;
                        let get_today_order_num_result = await connection.query(get_today_order_num_query, [partner_idx, start_date, end_date]);
                        if (get_today_order_num_result.length < 1) throw new Error("get_today_order_num_query error");
                        const today_order_num = get_today_order_num_result[0].today_order_num;
        
                        // orders table save
                        let insert_orders_query = `INSERT INTO orders
                                                   (order_id, imp_uid, user_idx, partner_idx, 
                                                    pay_method, payment, coupon_idx, coupon_price, qmoney, delivery_price,
                                                    receiver, phone, email, mail_number, address, detail_address, delivery_memo, home_pwd,
                                                    today_order_num, is_paid)
                                                   VALUES
                                                   (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                        let insert_orders_result = await connection.query(insert_orders_query, [merchant_uid, imp_uid, user_idx, partner_idx,
                                                                                                pay_method, amountToBePaid, coupon_idx, coupon_price, qmoney, delivery_price,
                                                                                                receiver, phone, email, mail_number, address, detail_address, delivery_memo, home_pwd,
                                                                                                today_order_num, 1]);
                        // orders table save 예외처리
                        if (insert_orders_result.affectedRows !== 1) throw new Error ("insert orders table error");
        
        
                        // orders_products table save
                        let insert_orders_products_params_str = "";
                        for (let i = 0; i < product.length; i++) {
                            let product_info = await Product.find({ _id: product[i].product_idx }).select({ one_hundred_deal_event: 1 });
                            let one_hundred_deal_event = 200;
                            if (product_info[0].one_hundred_deal_event == true) one_hundred_deal_event = 100;
                            insert_orders_products_params_str += `("${merchant_uid}", "${product[i].product_idx}", ${user_idx}, ${product[i].count}, ${product[i].price}, ${one_hundred_deal_event})`;
                            if (i != product.length - 1) insert_orders_products_params_str += ",";
                        }
                        let insert_orders_products_query = `INSERT INTO orders_products
                                                            (order_id, product_id, user_idx, count, price, one_hundred_deal_event)
                                                            VALUES 
                                                            ${insert_orders_products_params_str}`;
                        let insert_orders_products_result = await connection.query(insert_orders_products_query);
                        // orders_products table save 예외처리
                        if (insert_orders_products_result.affectedRows !== product.length) throw new Error ("insert orders_products table error");
        
        
                        // 큐머니 동기화 (qmoney(사용한 큐머니) + reward_qmoney(큐머니 적립금))
                        let update_qmoney_query = 'UPDATE users SET qmoney = qmoney + ? WHERE user_idx = ?';
                        let update_qmoney_result = await connection.query(update_qmoney_query, [(qmoney + reward_qmoney), user_idx]);
                        // 큐머니 동기화 예외처리
                        if (update_qmoney_result.affectedRows !== 1) throw new Error ("update users table qmoney error");
                

                        // 사용된 큐머니 내용 저장 (qmoney)
                        if (qmoney != 0) {
                            let insert_used_qmoney_content_result = await connection.query(insert_qmoney_content_query, [user_idx, qmoney, used_qmoney_content]);
                            if (insert_used_qmoney_content_result.affectedRows !== 1) throw new Error ("insert qmoney table used_qmoney_content error");
                        }

                        
                        // 큐머니 적립금 내용 저장 (reward_qmoney)
                        let insert_qmoney_content_query = 'INSERT INTO qmoney (user_idx, money, content) VALUES (?, ?, ?)';
                        let insert_reward_qmoney_content_result = await connection.query(insert_qmoney_content_query, [user_idx, reward_qmoney, reward_qmoney_content]);
                        if (insert_reward_qmoney_content_result.affectedRows !== 1) throw new Error ("insert qmoney table reward_qmoney_content error");
                        
                        
                        /* mongodb transaction 추후 기능 개선 필요 */
        
                        // 상품 수량(count), 판매 횟수(saled_count) 동기화
                        for (let k = 0; k < product.length; k++) {
                            let update_product_count = await Product.updateOne({ _id: product[k].product_idx }, { $inc: { count: -(product[k].count), saled_count: product[k].count } });
                            // 상품 수량, 판매 횟수 동기화 예외처리
                            if (update_product_count.nModified !== 1) throw new Error(`update product_v2 collection count, saled_count error`);
                        }
        
        
                        // 쿠폰을 사용했을 경우 사용할 수 있는 쿠폰(coupon)에서 삭제 및 사용된 쿠폰(used_coupon)에 추가
                        if (coupon_idx) {
                            // 쿠폰 정보 출력
                            let coupon_info = await Coupon.find({ _id: coupon_idx }).select({ _id: 1, limit_date: 1 });
                            let used_coupon = { coupon_idx: coupon_info[0]._id, limit_date: coupon_info[0].limit_date };
                            // 사용할 수 있는 쿠폰에서 삭제
                            let delete_avaialble_coupon_result = await Coupon_User.updateOne({ user_idx: user_idx },
                                                                                             { $pull: { coupon: { coupon_idx: coupon_idx } } });
                            if (delete_avaialble_coupon_result.nModified != 1) throw new Error("coupon_user collection delete error");
                            // 사용된 쿠폰에 추가
                            let insert_used_coupon_result = await Coupon_User.updateOne({ user_idx: user_idx },
                                                                                        { $push: { used_coupon: used_coupon } });
                            if (insert_used_coupon_result.nModified != 1) throw new Error("coupon_user collection insert error");
                        }


                        /* 해당 마트에게 주문요청이 들어왔음을 알려주기 */
                        get_partner_fcm_token_query = 'SELECT fcm_token FROM managers WHERE market_idx = ? and permission = ?';
                        let partner = await admin_connection.query(get_partner_fcm_token_query, [partner_idx, 200]);
                        const partner_fcm_token = partner[0].fcm_token;
                        if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                        let message = { 
                            notification: {
                                title: "큐마켓",
                                body: "주문이 들어왔습니다"
                            },
                            token: partner_fcm_token
                        }
                        admin.messaging().send(message)
                        .then(response => { console.log("성공"); })
                        .catch(error => { console.log("실패"); })


                        /* 유저에게 알림톡 보내기 */
                        let product_info = await Product.find({_id:product[0].product_idx});
                        let partner_info = await Partner.find({_id:partner_idx})
                        console.log(new Date(parseInt(merchant_uid.substring(4))).getDate());
                        const date = new Date(parseInt(merchant_uid.substring(4)));
                        let product_name = product_info[0].detail_name;
                        if(product.length > 1) {
                            product_name = product_info[0].detail_name + '외 ' + (product.length - 1) + '개';
                        }
                        const dateform = date.getFullYear() + "년 "
                        + (date.getMonth() + 1) + "월 " 
                        + date.getDate() + "일 "
                        + date.getHours() + "시 "
                        + date.getMinutes() + "분";
                        const subMessage = pay_method
                        const buyMessage = `${receiver} 님의 상품구매가 완료되었습니다.\n\n` +
                        `${date.getHours() < 17 ? "늦어도 " + + (date.getHours() + 4) + "시 이내 배송 예정입니다." : 
                        date.getHours() < 9 ? "금일 오전 9시부터 배송이 시작되며, 늦어도 점심 전까지 가져다 드릴게요" :
                        "금일 배송 주문은 마감되어 익일 배송 예정입니다."}\n\n* 거주지역에 따라 예상도착시간이 달라질 수 있으며 앱 내 마이페이지-MY마트에서 배송 정보를 자세히 확인하실 수 있습니다.\n\n` +
                        `주문 상품 내역\n\n` +
                        `- 상품명 : ${product_name}\n` +
                        `- 주문마트 : ${partner_info[0].name}\n` +
                        `- 결제일시 : ${dateform}\n` +
                        `- 결제금액 : ${price + '원'}\n` +
                        `- 결제수단 : ${subMessage}`
                        const uri = "/alimtalk/v2/services/" + process.env.ALIMTALK_API_SERVICE_ID + "/messages";
                        const timestamp = new Date(Date.now()).getTime().toString();
                        var hmac = HMACSHA256("POST " + uri + "\n" + timestamp + "\n" + process.env.ALIMTALK_API_ACCESS_KEY, process.env.ALIMTALK_API_SECRET_KEY);
                        console.log(hmac.toString(BASE64));
                        var hmac_result = hmac.toString(BASE64);
                        console.log("testContent : ", buyMessage);
                        axios.post("https://sens.apigw.ntruss.com/alimtalk/v2/services/" +  process.env.ALIMTALK_API_SERVICE_ID + "/messages", {
                            "templateCode": process.env.ALIMTALK_API_TEMPLATE_CODE_QMARKET,
                            "plusFriendId": "@큐마켓",
                            "messages": [
                                {
                                    "countryCode": "82",
                                    "to": phone,
                                    "content": buyMessage,
                                }
                            ],
                        },{
                            headers:{
                                "Content-Type": "application/json; charset=utf-8",
                                "x-ncp-apigw-timestamp":timestamp,
                                "x-ncp-iam-access-key": process.env.ALIMTALK_API_ACCESS_KEY,
                                "x-ncp-apigw-signature-v2": hmac_result,
                            }
                        }).then(response => {
                            console.log("response : ", response)
                        }) 

                        /* 모든 작업 완료 */
                        await connection.commit();
                        console.log("결제 성공-complete");
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.APPROVAL_SUCCESS));
                        break;


                    // 알 수 없는 오류
                    default:
                        throw new Error("unknown error");
                        break;
                }
            }
        } catch (err) {
            if (err.response) {
                if (err.response.data.code === -1) console.log(`app - /payment/success API error message: ${err.response.data.message}`);
                await connection.rollback();
                return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.APPROVAL_FAIL));
            } else {
                console.log(`app - /payment/success API error message: ${err.message}`);
            }
            await connection.rollback();
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
            admin_connection.release();
        }
    }
})

module.exports = router;
