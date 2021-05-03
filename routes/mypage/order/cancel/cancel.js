var express = require('express');
var router = express.Router();
var axios = require('axios');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const jwt = require('../../../../module/jwt');
const pool = require('../../../../config/dbConfig');
const upload = require('../../../../config/multer');

const Product = require('../../../../schemas/product');

// 환불목록 보여주기
router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
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
                        is_refund: refund_list[i].is_refund,
                        is_all:refund_list[i].is_all
                    }
                    data.push(refund_data);
                }
                console.log(data);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    } finally {
        connection.release();
    }
})

// 상품 환불하기
router.post('/', jwt.isLoggedIn, upload.single('img'), async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        let { order_id, product, amount, content, is_all, is_delivery } = req.body;
        console.log("is_delivery : ", is_delivery);
        let img = "";
        if(is_delivery >= 3) {
            img = req.file.location;
        }
        let parse_product = JSON.parse(product);
        if (!user_idx || !order_id || !parse_product || !amount || !content || !is_delivery) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            var connection = await pool.getConnection();
            await connection.beginTransaction();
            let get_token_query = 'SELECT token FROM market_token WHERE is_admin = 1';
            let get_token = await connection.query(get_token_query);
            let token_array = [];
            for(let i = 0; i < get_token.length; i++){
                token_array.push(get_token[i].token);
            }
            if(is_delivery >= 3) {
                if(!img) {
                    res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
                } else {
                    try {
                        // 환불 테이블
                        let insert_refund_query = 'INSERT INTO refunds (order_id, user_idx, content, file, amount, is_all, is_refund) VALUES (?, ?, ?, ?, ?, ?, 1)';
                        let insert_refund_product_query = 'INSERT INTO refunds_products (refund_id, order_id, product_id, count, price) VALUES (?, ?, ?, ?, ?)';
                        let insert_refund = await connection.query(insert_refund_query, [order_id, user_idx, content, img, amount, is_all]);
                        console.log(insert_refund)
                        if (insert_refund.affectedRows === 1) {
                            // 환불 상품 테이블
                            for (let i = 0; i < parse_product.length; i++) {
                                let insert_refund_product = await connection.query(insert_refund_product_query, [insert_refund.insertId, order_id, parse_product[i].product_id, parse_product[i].count, parse_product[i].price]);
                                if (insert_refund_product.affectedRows != 1) {
                                    res.status(200).json(utils.successTrue(statusCode.BAD_REQUEST, resMessage.REFUND_REQUEST_FAIL));
                                }
                            }
                            const getInfo = await axios({
                                url: `https://fcm.googleapis.com/fcm/send`,
                                method: "POST", // GET method
                                headers: {
                                    "Authorization": `key= ${process.env.FCM_SERVER_KEY}`,
                                    "Content-Type": "application/json"
                                },
                                data: {
                                    "notification": {
                                        "title": "환불 요청",
                                        "body": "환불요청이 들어왔습니다.",
                                        "icon": "Qmarket.png",
                                        "click_action": "http://qmarket.cf/product/delivery/main",
                                    },
                                    "registration_ids": token_array
                                }
                            });
                            await connection.commit();
                            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_REQUEST_SUCCESS));
                        } else {
                            res.status(200).json(utils.successTrue(statusCode.BAD_REQUEST, resMessage.REFUND_REQUEST_FAIL));
                        }
                    } catch (err) {
                        console.log(err);
                        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                    } finally {
                        connection.release();
                    }
                }
            } else if(is_delivery == 1) {
                try {
                    // 환불 테이블
                    let insert_refund_query = 'INSERT INTO refunds (order_id, user_idx, content, amount, is_all, is_refund) VALUES (?, ?, ?, ?, ?, 1)';
                    let insert_refund_product_query = 'INSERT INTO refunds_products (refund_id, order_id, product_id, count, price) VALUES (?, ?, ?, ?, ?)';
                    let insert_refund = await connection.query(insert_refund_query, [order_id, user_idx, content, amount, is_all]);
                    console.log(insert_refund)
                    if (insert_refund.affectedRows === 1) {
                        // 환불 상품 테이블
                        for (let i = 0; i < parse_product.length; i++) {
                            let insert_refund_product = await connection.query(insert_refund_product_query, [insert_refund.insertId, order_id, parse_product[i].product_id, parse_product[i].count, parse_product[i].price]);
                            if (insert_refund_product.affectedRows != 1) {
                                res.status(200).json(utils.successTrue(statusCode.BAD_REQUEST, resMessage.REFUND_REQUEST_FAIL));
                            }
                        }
                        await connection.commit();
                        const getInfo = await axios({
                            url: `https://fcm.googleapis.com/fcm/send`,
                            method: "POST", // GET method
                            headers: {
                                "Authorization": `key= ${process.env.FCM_SERVER_KEY}`,
                                "Content-Type": "application/json"
                            },
                            data: {
                                "notification": {
                                    "title": "환불 요청",
                                    "body": "환불요청이 들어왔습니다.",
                                    "icon": "Qmarket.png",
                                    "click_action": "http://qmarket.cf/product/delivery/main",
                                },
                                "registration_ids": token_array
                            }
                        });
                        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.REFUND_REQUEST_SUCCESS));
                    } else {
                        res.status(200).json(utils.successTrue(statusCode.BAD_REQUEST, resMessage.REFUND_REQUEST_FAIL));
                    }
                } catch (err) {
                    console.log(err);
                    res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
                } finally {
                    connection.release();
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;