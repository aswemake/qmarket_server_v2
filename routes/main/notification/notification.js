var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

let notification = require('../../../schemas/notification');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    let { user_idx } = req.decoded;
    if (!user_idx) {
        res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        try {
            let get_notification = await notification.find({ user_idx: user_idx });
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

module.exports = router;