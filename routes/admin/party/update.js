var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');


let Party = require('../../../schemas/party');
let Mission_admin = require('../../../schemas/mission_admin');

router.get('/:party_id', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../../start');
    } else {
        try {
            let { party_id } = req.params;
            if (!party_id) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let data = [];
                let mission = [];
                let get_party = await Party.find({ _id: party_id }).select({ no: 1, name: 1, episode: 1, start_time: 1, is_finished: 1});
                let get_mission = await Mission_admin.find({ party_idx: party_id }).sort({episode : 'asc'});
                let party = new Object();
                party = {
                    party_id: get_party[0]._id,
                    no: get_party[0].no,
                    name: get_party[0].name,
                    episode: get_party[0].episode,
                    start_time: get_party[0].start_time,
                    is_finished: get_party[0].is_finished,
                }
                for(let i=0; i< get_mission.length; i++){
                    let mission_data = new Object();
                    mission_data = {
                        mission_id: get_mission[i]._id,
                        episode: get_mission[i].episode,
                        content: get_mission[i].content
                    }
                    mission.push(mission_data);
                }
                data.push(party);
                data.push(mission);
                console.log(data[0]);
                console.log(data[1]);
                res.render('party_update', { data });
            }
        } catch (err) {
            console.log(err);
        }
    }
})

module.exports = router;