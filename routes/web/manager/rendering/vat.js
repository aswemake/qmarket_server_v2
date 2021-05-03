var express = require('express');
var router = express.Router({ mergeParams: true });

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

const Product = require('../../../../schemas/product_v2');

//vat load api
router.get('/form', async (req, res) => {   
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const { partner_idx } = req.params;
        if (!partner_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                let data = { partner_idx: partner_idx };
                res.render('manager/vat_frame', { data });
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            }
        }
    }
})
// 정산 및 부가세 리스트 조회 API
// 검색할 수 있는 start_date, end_date 쿼리스트링 추가하기
router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../../start');
    } else {
        const default_count = 15;
        const purchase_confirmation = 500;
        const partial_refund_approval = 902;
        const pg_fee_percent = { using_card: 0.02, using_pay: 0.02, using_account: 0.018 }
        const brokerage_program_usage_fee_percent = 0.013;
        const { partner_idx } = req.params;
        let { page, start_date, end_date } = req.query;
        if (!partner_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                if (!start_date) start_date = `"2011-01-01"`;
                if (!end_date) {
                    var now = new Date(); now.setDate(now.getDate());
                    var year = now.getFullYear();
                    var month = ("0" + (1 + now.getMonth())).slice(-2);
                    var day = ("0" + now.getDate()).slice(-2);
                    end_date = `"${year}-${month}-${day} 23:59:59"`;
                }
                let option = { 
                    start_date: start_date,
                    end_date: end_date
                };
                console.log(option.start_date)
                console.log(option.end_date)
                var connection = await pool.getConnection();
                // 서버에 올라가면 page datatype이 아마도 integer로 바뀔듯
                let data = { current_page_num: parseInt(page), last_page_num: 0, partner_idx: partner_idx, adjustments: [], start_date: start_date, end_date: end_date };
                let adjustment_query = `SELECT DATE_FORMAT(order_list.updated_at, '%Y-%m-%d') AS order_date,
                                               order_list.order_id AS order_id,
                                               order_list.product_id AS product_id,
                                               order_list.pay_method AS pay_method,
                                               order_list.one_hundred_deal_event AS one_hundred_deal_event,
                                               (order_list.price - IFNULL(refund_list.price, 0)) AS price
                                        FROM (SELECT o.order_id, op.product_id, op.price, o.pay_method, op.one_hundred_deal_event, o.updated_at
                                              FROM orders o
                                              JOIN orders_products op ON o.order_id = op.order_id
                                              WHERE o.partner_idx = ? AND o.status IN (?, ?) AND updated_at >= ${start_date} AND updated_at <= ${end_date}) order_list
                                        LEFT OUTER JOIN (SELECT r.order_id, rp.product_id, rp.price
                                                         FROM refunds r
                                                         JOIN refunds_products rp ON r.order_id = rp.order_id
                                                         WHERE r.status = ?) refund_list
                                        ON order_list.order_id = refund_list.order_id AND order_list.product_id = refund_list.product_id
                                        ORDER BY order_list.updated_at DESC`;
                
                let adjustments = await connection.query(adjustment_query, [partner_idx, purchase_confirmation, partial_refund_approval, partial_refund_approval]);
                
                let offset = (page - 1) * default_count;
                let count = (adjustments.length < offset + default_count) ? adjustments.length - offset : default_count;
                for (let i = offset; i < offset + count; i++) {
                    // 카드수수료 및 결제망 이용료 계산
                    let card_fee = 0;
                    switch(adjustments[i].pay_method) {
                        case "신용/체크카드": card_fee = Math.round(adjustments[i].price * pg_fee_percent.using_card); break;
                        case "카카오페이": card_fee = Math.round(adjustments[i].price * pg_fee_percent.using_pay); break;
                        case "네이버페이": card_fee = Math.round(adjustments[i].price * pg_fee_percent.using_pay); break;
                    }
                    // 판촉 및 주문중개, 프로그램 이용료 계산
                    let brokerage_program_usage_fee = Math.round(adjustments[i].price * brokerage_program_usage_fee_percent);
                    // 100원딜 이벤트 지원금, 상생지원금 계산
                    let one_hundred_deal_event_income = 0;
                    let partner_income = 0;
                    if (adjustments[i].one_hundred_deal_event == 100) {
                        let product = await Product.find({ _id: adjustments[i].product_id }).select({ original_price: 1 });
                        one_hundred_deal_event_income = product[0].original_price - adjustments[i].price;
                    } else {
                        partner_income = Math.floor(adjustments[i].price * 0.033);
                    }
                    // 정산대금 계산
                    let settlement_price = (adjustments[i].price + one_hundred_deal_event_income + partner_income) - (card_fee + brokerage_program_usage_fee);
                    // 정산공급가 계산
                    let settlement_supply_price = Math.floor(settlement_price / 1.1);
                    // 정산부가세 계산
                    let settlement_vat = settlement_price - settlement_supply_price;

                    let adjustment = {
                        order_date: adjustments[i].order_date, // 주문일시
                        order_id: adjustments[i].order_id, // 주문번호
                        product_id: adjustments[i].product_id, // 상품번호
                        pay_method: adjustments[i].pay_method, // 결제수단
                        price: adjustments[i].price, // 판매가
                        card_fee: card_fee, // 카드수수료 및 결제망 이용료
                        brokerage_program_usage_fee: brokerage_program_usage_fee, // 판촉 및 주문중개, 프로그램 이용료
                        one_hundred_deal_event_income: one_hundred_deal_event_income, // 100원딜 이벤트 지원금
                        partner_income: partner_income, // 상생지원금
                        settlement_price: settlement_price, // 정산대금
                        settlement_supply_price: settlement_supply_price, // 정산공급가
                        settlement_vat: settlement_vat // 정산부가세
                    }
                    data.adjustments.push(adjustment);
                }

                data.last_page_num = (adjustments.length % default_count == 0) ? Math.floor(adjustments.length / default_count) : Math.floor(adjustments.length / default_count) + 1;
                
                res.render('manager/vat', { data });
            } catch (err) {
                console.log(err);
                // console.log(err.message);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})
module.exports = router;