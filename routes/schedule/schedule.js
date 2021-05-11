var express = require('express');
var router = express.Router();
var schedule = require('node-schedule');
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
var admin = require('firebase-admin');
var serviceAccount = require('../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const pool = require('../../config/dbConfig');

let Product = require('../../schemas/product_v2');
let Coupon = require('../../schemas/coupon');
let Coupon_user = require('../../schemas/coupon_user');

// 1시간마다 실행
let check_one_hour = schedule.scheduleJob("0 0 */1 * * *", async () => { // 1시간 단위
    try {
        let current_date = new Date(Date.now() + (3600000 * 9));
        console.log(current_date);

        // 상품 이벤트 종료
        let delete_product_event = await Product.updateMany( 
            {},
            { 
                $pull: {
                    events: {
                        end_date: { $lte: current_date }
                    }
                }
            }
        );

        console.log(delete_product_event);
    } catch (err) {
        console.log(err);
    }
})


// 매일 오전 12시 1분에 실행
let check = schedule.scheduleJob("1 0 * * *", async () => {
    // 현재 시간 구하기
    let current_time = new Date(Date.now() + (3600000 * 9));
    console.log(`현재시간: ${current_time}`);
    // 사용기한이 지난 쿠폰 찾기
    let coupon = await Coupon.find({ limit_date: { $lte: current_time } });
    try {
        // 사용자가 보유하고 있는 사용기한이 지난 쿠폰 제거
        for (let i = 0; i < coupon.length; i++) {
            let delete_user_coupon = await Coupon_user.updateMany(
                { $pull: { coupon: coupon[i]._id, used_coupon: coupon[i]._id } })
            console.log(delete_user_coupon);
            if (delete_user_coupon.ok === 1) {
                let delete_coupon = await Coupon.deleteOne({ _id: coupon[i]._id });
                console.log(delete_coupon);
                if (delete_coupon.deletedCount === 1) {
                    console.log("쿠폰이 삭제되었습니다.")
                } else {
                    console.log("삭제된 쿠폰이 없습니다.")
                }
            }
        }
    } catch (err) {
        console.log(err);
    }

    // 배송완료 시점으로부터 2일 후 구매확정으로 자동 변경
    let query = 'UPDATE orders SET status=500 WHERE status=400 AND datediff(now(), updated_at) > 2';
    try {
        var connection = await pool.getConnection();
        let change_state = await connection.query(query);
        console.log(change_state);
    } catch (err) {
        console.log(err);
    } finally {
        connection.release();
    }
})

module.exports = router;
