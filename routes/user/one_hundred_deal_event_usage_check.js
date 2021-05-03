var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');
const pool = require('../../config/dbConfig');

const Product = require('../../schemas/product_v2');


// 유저가 100원딜 이벤트 상품을 구매할 수 있는 상태인지 확인 API
router.post('/', jwt.isLoggedIn, async (req, res) => {
    const { user_idx } = req.decoded;
    let { product } = req.body;
    if (!user_idx || !product) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var connection = await pool.getConnection();
            let data = new Object();
            let one_hundred_deal_event_product_count = 0;

            // 현재 주문하려는 상품에 100원딜 이벤트 상품이 있는지 확인
            for (let i = 0; i < product.length; i++) {
                let product_info = await Product.find({ _id: product[i].product_id }).select({ one_hundred_deal_event: 1 });
                if (product_info.length < 1) throw new Error("incorrect product_idx");
                if (product_info[0].one_hundred_deal_event == true) one_hundred_deal_event_product_count += product[i].count;
            }

            // 현재 주문하려는 상품에 100원딜 이벤트 상품이 없을 경우 종료
            if (one_hundred_deal_event_product_count == 0) {
                data.message = "";
                data.next = true; // 결제단계로 이동
                return res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }

            // 1개의 100원딜 상품을 여러개 구매 또는 2개 이상의 100원딜 상품을 구매하려는 경우 종료
            if (one_hundred_deal_event_product_count >= 2) {
                data.message = "100원딜 찬스는 한 상품에 한 개만 사용 가능합니다!";
                data.next = false; // 결제단계로 이동불가 (100원딜 이벤트에 참여할 수 없음)
                return res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }


            /* 100원딜 이벤트 상품을 1개 주문하려는 경우 유저가 이번달에 100원딜 이벤트 상품을 구매한 적이 있는지 확인 */
            const order_status = { order_request_rejection: 201, partial_refund_approval: 902, total_refund_approval: 912 }
            const one_hundred_deal_event = 100;
            function getFormatDate(date){
                var year = date.getFullYear(); var month = (1 + date.getMonth()); var day = date.getDate();
                month = month >= 10 ? month : '0' + month;
                day = day >= 10 ? day : '0' + day;
                return `${year}-${month}-${day}`;
            }
            var now = new Date(Date.now() + (3600000 * 9));
            let start_date = `"${getFormatDate(new Date(now.getFullYear(), now.getMonth(), 1))} 00:00:00"`;
            let end_date = `"${getFormatDate(new Date(now.getFullYear(), now.getMonth()+1, 0))} 23:59:59"`;
            
            // 유저의 이번달에 100원딜 참여 여부 (부분환불 체크 전)                                                                     
            let this_month_event_participation_check_query = `SELECT o.order_id, op.product_id
                                                              FROM orders o
                                                              JOIN orders_products op ON o.order_id = op.order_id
                                                              WHERE o.user_idx = ${user_idx} AND
                                                                    o.status NOT IN (${order_status.order_request_rejection}, ${order_status.total_refund_approval}) AND
                                                                    o.created_at >= ${start_date} AND o.created_at <= ${end_date} AND
                                                                    op.one_hundred_deal_event = ${one_hundred_deal_event}`;
            let this_month_event_participation_check_result = await connection.query(this_month_event_participation_check_query);

            // 유저가 이번달에 100원딜 이벤트를 참여하지 않았을 경우
            if (this_month_event_participation_check_result.length < 1) {
                data.message = "";
                data.next = true; // 결제단계로 이동 (100원딜 이벤트에 참여할 수 있음)
                return res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }

            // 유저가 100원딜 이벤트 상품을 구매한 적이 있지만 해당 기록이 부분 환불 승인 되었는지 확인
            let partial_refund_approval_check_query = `SELECT COUNT(*) AS count
                                                       FROM refunds
                                                       WHERE status = ? AND
                                                             EXISTS (SELECT order_id
                                                                     FROM refunds_products
                                                                     WHERE order_id = ? AND product_id = ?)`;
            let partial_refund_approval_check_result = await connection.query(partial_refund_approval_check_query,
                                                                              [order_status.partial_refund_approval,
                                                                               this_month_event_participation_check_result[0].order_id,
                                                                               this_month_event_participation_check_result[0].product_id]);
            
            // 유저가 100원딜 이벤트 상품을 구매한 적이 있지만 부분 환불 승인을 받지 않았으면
            if (partial_refund_approval_check_result[0].count == 0) {
                data.message = "100원딜 찬스에 이미 참여하셨습니다. 아쉽지만 다음달 1일에 다시 참여 가능합니다!";
                data.next = false; // 결제단계로 이동불가 (이미 이번달에 참여했으므로 100원딜 이벤트에 참여할 수 없음)
                return res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
            }

            // 유저가 100원딜 이벤트 상품을 구매한 적이 있지만 부분 환불 승인을 받았으면
            data.message = "";
            data.next = true; // 결제단계로 이동 (100원딜 이벤트에 참여할 수 있음)
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
        } catch (err) {
            console.log(err.message);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        } finally {
            connection.release();
        }
    }
})

module.exports = router;
