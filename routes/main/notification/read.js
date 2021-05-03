var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

let notification = require('../../../schemas/notification');

router.put('/', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    let { notification_idx } = req.body;
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

module.exports = router;