var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

let notification = require('../../schemas/notification');

// 큐알림 리스트 조회 API
router.get('/', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            var get_notification = await notification.find({ user_idx: user_idx }).sort({ created_at: -1 });
            
            if (!get_notification[0]) {
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_NOTIFICATION));
            } else {
                let notification_arr = [];
                for (let i = 0; i < get_notification.length; i++) {
                    let notification_data = new Object();
                    notification_data = {
                        notification_idx: get_notification[i]._id,
                        type: get_notification[i].type,
                        img: get_notification[i].img,
                        link: get_notification[i].link,
                        name: get_notification[i].name,
                        content: get_notification[i].content,
                        is_read: get_notification[i].is_read
                    }
                    notification_arr.push(notification_data);
                }
                console.log(notification_arr);
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, notification_arr));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 큐알림 전체 삭제 API
router.delete('/all', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let delete_all_notification = await notification.deleteMany({ user_idx: user_idx });
            if (delete_all_notification.deletedCount >= 1) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
            } else {
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_DELETE));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 큐알림 읽기 API
router.put('/:notification_idx', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    let { notification_idx } = req.params;
    if (!user_idx || !notification_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let update_notification = await notification.updateOne({ _id: notification_idx, user_idx: user_idx }, { $set: { is_read: true } });
            console.log(update_notification);
            if (update_notification.nModified === 1) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
            } else {
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_UPDATE));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

// 큐알림 한 개 삭제 API
router.delete('/:notification_idx', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    let { notification_idx } = req.params;
    if (!user_idx || !notification_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let delete_notification = await notification.deleteOne({ _id: notification_idx, user_idx: user_idx });
            console.log(delete_notification);
            if (delete_notification.deletedCount === 1) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.DELETE_SUCCESS));
            } else {
                res.status(200).json(utils.successTrue(statusCode.NO_CONTENT, resMessage.NULL_DELETE));
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})

module.exports = router;