var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');


let Party = require('../../../schemas/party');

router.get('/', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('./start');
    } else {
        try {
            let data = [];
            let get_party = await Party.find({}).select({ _id: 1, no: 1, name: 1, episode: 1, start_time: 1, is_finished: 1 });
            for (let i = 0; i < get_party.length; i++) {
                let party_data = new Object();
                party_data = {
                    party_id: get_party[i]._id,
                    no: get_party[i].no,
                    name: get_party[i].name,
                    episode: get_party[i].episode,
                    start_time: get_party[i].start_time[get_party[i].episode],
                    is_finished: get_party[i].is_finished
                }
                data.push(party_data);
            }
            res.render('party', { data });
        } catch (err) {
            console.log(err);
        }
    }
})

module.exports = router;