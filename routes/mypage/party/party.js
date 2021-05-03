var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');
const jwt = require('../../../module/jwt');

const Party = require('../../../schemas/party');
const enroll_Party = require('../../../schemas/enroll_party');

router.get('/', jwt.isLoggedIn, async (req, res) => {
    try {
        const { user_idx } = req.decoded;
        if (!user_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let ticket = await enroll_Party.find({ user_idx: user_idx });
            let img_arr = [];
            for (var i = 0; i < ticket.length; i++) {
                let party_info = await Party.find({ _id: ticket[i].party_idx }).select({ start_time: 1, name: 1, episode: 1, ticket: 1 });
                if (ticket[i].enroll[party_info[0].episode] == 1) {
                    let ticket_img;
                    let limit_date;
                    if (ticket[i].is_All == true) {
                        ticket_img = party_info[0].ticket.all;
                        limit_date = party_info[0].start_time[party_info[0].start_time.length - 1]
                    } else {
                        for(let j = ticket[i].enroll.length - 1; j >= 0; j--){
                            if(ticket[i].enroll[j] == 1){
                                ticket_img = party_info[0].ticket.one;
                                limit_date = party_info[0].start_time[party_info[0].episode];
                                break;
                            }
                        }
                    }
                    let ticket_data = new Object();
                    ticket_data = {
                        party_idx: ticket[i].party_idx,
                        name: party_info[0].name,
                        main_img: ticket_img,
                        limit_date: limit_date
                    }
                    img_arr.push(ticket_data);
                }
            }
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, img_arr));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;