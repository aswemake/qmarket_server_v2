var express = require('express');
var router = express.Router();
var schedule = require('node-schedule');
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
var admin = require('firebase-admin');
var serviceAccount = require('../../qmarket-47a89-firebase-adminsdk-8md13-d56a94e147.json');

const pool = require('../../config/dbConfig');

let Coupon = require('../../schemas/coupon');
let Coupon_user = require('../../schemas/coupon_user');
let Enroll_Party = require('../../schemas/enroll_party');
let Party = require('../../schemas/party');
let Notification = require('../../schemas/notification');


// 매15분마다 실행
let notification = schedule.scheduleJob("*/15 * * * *", async () => {
    // 현재시간 구하기
    let current_time = new Date(Date.now() + (3600000 * 9));
    // 현재시간에서 3시간 5분 전 시간구하기
    let momentDate = moment(Date.now()).subtract(3, "hours");
    console.log(`momentDate: ${momentDate}`);
    let start_time = momentDate.subtract(5, "minutes").format("YYYY-MM-DD HH:mm");
    console.log(`start_time: ${start_time}`);

    // 현재시간에서 3시간 5분 후 시간구하기
    let momentDate2 = moment(Date.now()).subtract(3, "hours");
    console.log(`momentDate2: ${momentDate2}`);
    let end_time = momentDate2.add(5, "minutes").format("YYYY-MM-DD HH:mm");
    console.log(`end_time: ${end_time}`);

    try {
        var connection = await pool.getConnection();
        let query = 'SELECT fcm_token, user_idx FROM users WHERE user_idx = ?';
        let find_party = await Party.find({ start_time: { $elemMatch: { $gte: start_time, $lte: end_time } } }).select({ name: 1, episode: 1 });
        console.log(find_party);
        if (!find_party[0]) {
            console.log("해당하는 반상회가 없습니다.");
        } else {
            // 해당하는 반상회 수 만큼 반복
            for (let i = 0; i < find_party.length; i++) {
                // 반상회 멤버들의 토큰을 담는 배열 생성
                let party_member = [];
                let users = [];
                // 반상회 멤버 찾기
                let find_member = await Enroll_Party.find({ party_idx: find_party[i]._id });
                for (let j = 0; j < find_member.length; j++) {
                    if (find_member[j].enroll[find_party[i].episode] == 1 || find_member[j].is_All == true) {
                        // 반상회 멤버 fcm_token찾기
                        let find_token = await connection.query(query, [find_member[j].user_idx]);
                        party_member.push(find_token[0].fcm_token);
                        users.push(find_token[0].user_idx);
                    }
                }
                console.log(users);
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                }
                let message = {
                    notification: {
                        title: find_party[i].name,
                        body: '반상회 시작 3시간 전입니다.'
                    },
                    data: {
                        party_idx: JSON.stringify(find_party[i]._id)
                    },
                    tokens: party_member,
                }

                // 해당 구문 실행시 디바이스로 메세지 전송
                admin.messaging().sendMulticast(message)
                    .then(response => {
                        console.log("응답")
                        console.log(response)
                    })
                    .catch(error => {
                        console.log("오류")
                        console.log(error)
                    })

                // 큐알림 데이터베이스에 저장
                for (let k = 0; k < users.length; k++) {
                    let notification_save = new Notification({
                        user_idx: users[k],
                        type: '반상회',
                        link: {
                            link_type: 'party_idx',
                            link_address: find_party[i]._id
                        },
                        name: message.notification.body,
                        content: message.notification.title,
                        created_at: current_time
                    })
                    let notification_save_result = await notification_save.save();
                }
            }
        }
    } catch (err) {
        console.log(err);
    } finally {
        connection.release();
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
