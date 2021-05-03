var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

let notification = require('../../../schemas/notification');

router.delete('/', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    let { notification_idx } = req.body;
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

module.exports = router;