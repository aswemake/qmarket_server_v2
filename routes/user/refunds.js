var express = require('express');
var router = express.Router();
var axios = require('axios');

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');
const upload = require('../../config/multer');

let Product = require('../../schemas/product_v2');

// 유저 환불 리스트 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let data = [];
            let query = 'SELECT * FROM refunds WHERE user_idx = ? ORDER BY created_at DESC'
            let refund_list = await connection.query(query, [user_idx]);
            if (!refund_list[0]) {
                console.log("환불내역이 존재하지 않습니다.");
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            } else {
                let query2 = 'SELECT refund_id, product_id, COUNT(*) AS count FROM refunds_products '
                    + 'WHERE order_id = ? AND refund_id = ? GROUP BY refund_id, order_id';
                for (let i = 0; i < refund_list.length; i++) {
                    let name;
                    let refund_data = new Object();
                    let product_list = await connection.query(query2, [refund_list[i].order_id, refund_list[i].refund_id]);
                    let product = await Product.find({ _id: product_list[0].product_id });
                    if (product_list[0].count > 1) {
                        name = product[0].detail_name + ' 외 ' + (product_list[0].count - 1) + '개';
                    } else {
                        name = product[0].detail_name
                    }
                    refund_data = {
                        refund_id: refund_list[i].refund_id,
                        order_id: refund_list[i].order_id,
                        order_date: refund_list[i].created_at,
                        main_img: product[0].img[0],
                        name: name,
                        amount: refund_list[i].amount,
                        status: refund_list[i].status
                    }
                    data.push(refund_data);
                }
                console.log(data);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 유저 환불 상세 조회 API
router.get('/:refund_id', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { refund_id } = req.params;
    if (!user_idx || !refund_id) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let query = 'SELECT * FROM refunds WHERE refund_id = ?';
            let query2 = 'SELECT receiver, pay_method, payment, delivery_price, coupon_price, qmoney, created_at FROM orders WHERE order_id = ?';
            let query3 = 'SELECT * FROM refunds_products WHERE refund_id = ? AND order_id = ?';

            let refund = await connection.query(query, [refund_id]);
            let order_id = refund[0].order_id;
            let order_info = await connection.query(query2, [order_id]);
            if (!refund[0] || !order_info[0]) {
                res.status(200).json(utils.successFalse(statusCode.NOT_FOUND, resMessage.READ_FAIL));
            } else {
                let refund_data = new Object();
                let product_arr = [];

                // 환불 상품 찾기
                let find_product = await connection.query(query3, [refund_id, order_id]);
                for (let i = 0; i < find_product.length; i++) {
                    let product_data = new Object();
                    let product = await Product.find({ _id: find_product[i].product_id });
                    product_data = {
                        product_idx: product[0]._id,
                        main_img: product[0].img[0],
                        name: product[0].name,
                        detail_name: product[0].detail_name,
                        price: find_product[i].price,
                        count: find_product[i].count
                    }
                    product_arr.push(product_data);
                }

                // 환불 상태에 따른 데이터 처리
                switch(refund[0].status){
                    case 900: // 부분 환불 요청
                    case 910: // 전체 환불 요청
                        break;
                    case 902: // 부분 환불 승인
                    case 912: // 전체 환불 승인
                        refund_data = {
                            price: refund[0].price,
                            delivery_price: refund[0].delivery_price,
                            coupon: refund[0].coupon_price,
                            qmoney: refund[0].qmoney
                        }
                        break;
                    case 901: // 부분 환불 거절
                    case 911: // 전체 환불 승인
                        refund_data = {
                            reject_reason: refund[0].reject_reason
                        }
                        break;
                    default:
                        break;
                }
                let data = {
                    product: product_arr,
                    receiver: order_info[0].receiver,
                    pay_method: order_info[0].pay_method,
                    coupon_price: order_info[0].coupon_price,
                    delivery_price: order_info[0].delivery_price,
                    qmoney: order_info[0].qmoney,
                    content: refund[0].content,
                    file: refund[0].file,
                    status: refund[0].status,
                    refund: refund_data,
                    is_all:refund[0].is_all
                };
                console.log(data);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

// 유저 상품 환불 요청하기 API
router.post('/', jwt.isLoggedIn, upload.single('img'), async (req, res) => {
    const { user_idx } = req.decoded;
    let { order_id, product, amount, content, status, is_all } = req.body;
    if (!user_idx || !order_id || !product || !amount || !content || !status || is_all == undefined) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else if (status != 100 && status != 200 && status != 400) { // 배송상태가 주문요청(100) or 배송전(200) or 배송완료(400)가 아닌 경우 환불 요청 실패
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } 
    else if (status == 400 && !req.file) { // 배송상태가 배송완료(400)인 경우 이미지가 없으면 환불 요청 실패
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            await connection.beginTransaction();

            // from-data 형식으로 들어온 product를 JSON형식으로 parsing
            let parse_product = JSON.parse(product);

            // req.file이 존재하면 img_url을 aws-s3에 업로드된 url로 설정, req.file이 존재하지 않으면 img_url을 null로 설정
            let img_url = (req.file) ? req.file.location : null;
            console.log(img_url);

            let get_status_query = `SELECT status from orders where order_id = ?`
            let update_status_query = `UPDATE orders SET status = ? where order_id = ?`

            let status = await connection.query(get_status_query, [order_id]);
            console.log(status)
            let refund_status = 900;
            if(status == 100 || 200) {
                refund_status = 910;
            }
            let update_orders_result = await connection.query(update_status_query, [refund_status, order_id]);
            if (update_orders_result.affectedRows !== 1) throw new Error("update orders table error");
            // refunds table save
            let insert_refunds_query = `INSERT INTO refunds 
                                        (order_id, user_idx, content, file, amount, is_all, status) 
                                        VALUES 
                                        (?, ?, ?, ?, ?, ?, ?)`;
            let insert_refunds_result = await connection.query(insert_refunds_query, [order_id, user_idx, content, img_url, amount, is_all, refund_status]);
            // insert refunds table 예외처리
            if (insert_refunds_result.affectedRows !== 1) throw new Error("insert refunds table error");

            // refunds_products save
            let insert_refunds_products_params_str = "";
            for (let i = 0; i < parse_product.length; i++) {
                // refunds_products table에 insert될 parameter 문자열 만들기
                insert_refunds_products_params_str += `(${insert_refunds_result.insertId}, "${order_id}", "${parse_product[i].product_id}", ${parse_product[i].count}, ${parse_product[i].price})`;
                // 마지막 line이 아닐 경우 "," 추가
                if (i != parse_product.length - 1) insert_refunds_products_params_str += `,`;
            }
            let insert_refunds_products_query = `INSERT INTO refunds_products
                                                 (refund_id, order_id, product_id, count, price)
                                                 VALUES
                                                 ${insert_refunds_products_params_str}`;
            let insert_refunds_products_result = await connection.query(insert_refunds_products_query);
            // insert refunds_product table 예외처리
            if (insert_refunds_products_result.affectedRows !== parse_product.length) throw new Error("insert refunds_products table error");


            /* fcm 토큰으로 대표님한테 알림 보내기 */
            


            /* 모든 작업 완료 */
            await connection.commit();
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_REQUEST_SUCCESS));
        } catch (err) {
            if (err.message == "insert refunds table error" || err.message == "insert refunds_products table error") {
                await connection.rollback();
                console.log(err.message);
                return res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.REFUND_REQUEST_FAIL));
            }
            await connection.rollback();
            console.log(err.message);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;