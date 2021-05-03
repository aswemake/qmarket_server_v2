var express = require('express');
var router = express.Router();

const utils = require('../../../module/response/utils');
const resMessage = require('../../../module/response/responseMessage');
const statusCode = require('../../../module/response/statusCode');

let Party = require('../../../schemas/party');

router.put('/:party_id', async (req, res) => {
    if (!req.signedCookies.user) {
        console.log("쿠키가 만료되었거나 로그인이 필요합니다.");
        res.redirect('../start');
    } else {
        try {
            let { party_id } = req.params;
            let { episode } = req.body;
            console.log(`episode : ${episode}`)
            if (!party_id || episode == null) {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                let party = await Party.find({ _id: party_id }).select({ episode: 1, img: 1, start_time: 1 });
                if ((party[0].episode + 1) < party[0].start_time.length) {
                    console.log(party[0].img[4].indexOf(`5-${(party[0].episode) + 1}`))
                    if (party[0].img[4].indexOf(`5-${(party[0].episode) + 1}`) == -1) {
                        let change_episode = await Party.updateOne({ _id: party_id }, { $set: { episode: episode } });
                        if (change_episode.nModified === 1) {
                            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                        } else {
                            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                        }
                    } else {
                        let img4 = party[0].img[4].replace(`5-${(party[0].episode) + 1}`, `5-${episode + 1}`);
                        let img7 = party[0].img[7].replace(`8-${(party[0].episode) + 1}`, `8-${episode + 1}`);
                        let change_img4 = await Party.updateOne({ _id: party_id }, { $set: { "img.4": img4 } });
                        let change_img7 = await Party.updateOne({ _id: party_id }, { $set: { "img.7": img7 } });

                        if (change_img4.nModified === 1 && change_img7.nModified === 1) {
                            let change_episode = await Party.updateOne({ _id: party_id }, { $set: { episode: episode } });
                            if (change_episode.nModified === 1) {
                                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
                            } else {
                                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                            }
                        } else {
                            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.SAVE_FAIL));
                        }
                    }
                } else {
                    console.log("반상회 회차가 종료되었습니다");
                }
            }
        } catch (err) {
            console.log(err);
            res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
        }
    }
})
module.exports = router;