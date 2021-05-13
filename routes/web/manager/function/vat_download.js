var express = require('express');
var router = express.Router({ mergeParams: true });
const exceljs = require('exceljs');

const utils = require('../../../../module/response/utils');
const resMessage = require('../../../../module/response/responseMessage');
const statusCode = require('../../../../module/response/statusCode');
const pool = require('../../../../config/dbConfig');

let Partner = require('../../../../schemas/partner');
let Product = require('../../../../schemas/product_v2');

// 부가세 신고자료 다운로드 API
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
        let { start_date, end_date } = req.query;
        if (!partner_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            try {
                var connection = await pool.getConnection();

                /* start_date, end_date, partner_name setting */
                if (!start_date) start_date = `"2011-01-01"`;
                if (!end_date) {
                    var now = new Date(); now.setDate(now.getDate());
                    var year = now.getFullYear();
                    var month = ("0" + (1 + now.getMonth())).slice(-2);
                    var day = ("0" + now.getDate()).slice(-2);
                    end_date = `"${year}-${month}-${day} 23:59:59"`;
                }
                let partner = await Partner.find({ _id: partner_idx }).select({ name: 1 });
                if (partner.length < 1) throw new Error("incorrect partner_idx");
                let partner_name = partner[0].name;


                /* make execel file */
                let workbook = new exceljs.Workbook();
                workbook.creator = 'aswemake';
                workbook.created = new Date();
                let worksheet = workbook.addWorksheet('큐마켓-부가세 신고 자료');

                // 스타일 초기 설정
                worksheet.properties.defaultColWidth = 20;
                worksheet.getRow(1).height = 60;
                worksheet.getRow(1).font = { size: 40 };
                worksheet.getRow(7).font = { bold: true };
                worksheet.getColumn(3).width = 25; // 상품번호
                worksheet.getColumn(4).width = 17; // 결제수단
                worksheet.getColumn(5).width = 15; // 판매가
                worksheet.getColumn(6).width = 25; // 카드수수료 및 결제망 이용료
                worksheet.getColumn(7).width = 30; // 판촉 및 주문중개, 프로그램 이용료
                worksheet.getColumn(8).width = 25; // 100원딜 이벤트 지원금
                worksheet.getColumn(9).width = 15; // 상생지원금
                worksheet.getColumn(10).width = 15; // 정산대금
                worksheet.getColumn(11).width = 15; // 정산공급가
                worksheet.getColumn(12).width = 15; // 정산부가세
                for (let row = 1; row <= 7; row++) {
                    worksheet.getRow(row).alignment = { vertical: 'middle', horizontal: 'center' };
                }

                // 헤더 리스트
                let header = [
                    '주문일시', '주문번호', '상품번호', '결제수단', '판매가', '카드수수료 및 결제망 이용료', 
                    '판촉 및 주문중개, 프로그램 이용료', '100원딜 이벤트 지원금', '상생지원금', '정산대금', '정산공급가', '정산부가세'
                ]
                worksheet.getRow(7).values = header;
                
                // title 설정
                var now = new Date(); now.setDate(now.getDate());
                var year = now.getFullYear();
                var month = ("0" + (1 + now.getMonth())).slice(-2);
                var day = ("0" + now.getDate()).slice(-2);
                var current_date = `${year}-${month}-${day}`;
                worksheet.getCell('A1').value = "큐마켓";
                worksheet.getCell('A2').value = "부가세 신고자료";
                worksheet.getCell('A3').value = `(파트너 마트 ${partner_name} 매출)`;
                worksheet.getCell('A4').value = `조회일: ${current_date}`;
                worksheet.getCell('A5').value = `검색기간: ${start_date.substring(1, 11)} ~ ${end_date.substring(1, 11)}`;
                for (let i = 1; i <= 5; i++) {
                    let merge_cell_range = `A${i}:L${i}`;
                    worksheet.mergeCells(merge_cell_range);
                }


                /* 로직시작 */
                let row = 8;
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
                for (let i = 0; i < adjustments.length; i++) {
                    // 상품 정보
                    let products = await Product.find({ _id: adjustments[i].product_id }).select({ vat: 1 });
                    if (products.length < 1) throw new Error("incorrect product_idx");
                    let product = products[0];

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
                    let settlement_supply_price = (product.vat == true) ? Math.floor(settlement_price / 1.1) : settlement_price;
                    // 정산부가세 계산
                    let settlement_vat = settlement_price - settlement_supply_price;

                    let adjustment = [
                        adjustments[i].order_date, // 주문일시
                        adjustments[i].order_id, // 주문번호
                        adjustments[i].product_id, // 상품번호
                        adjustments[i].pay_method, // 결제수단
                        adjustments[i].price, // 판매가
                        card_fee, // 카드수수료 및 결제망 이용료
                        brokerage_program_usage_fee, // 판촉 및 주문중개, 프로그램 이용료
                        one_hundred_deal_event_income, // 100원딜 이벤트 지원금
                        partner_income, // 상생지원금
                        settlement_price, // 정산대금
                        settlement_supply_price, // 정산공급가
                        settlement_vat // 정산부가세
                    ]

                    worksheet.getRow(row).values = adjustment;
                    row += 1;
                }

                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", "attachment");
                return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            } catch (err) {
                console.log(err);
                res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
            } finally {
                connection.release();
            }
        }
    }
})

module.exports = router;