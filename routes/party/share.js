var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

let Party = require('../../schemas/party');

router.put('/', async (req, res) => {
    try {
        let { party_idx } = req.body;
        if (!party_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let update_party = await Party.updateOne({ _id: product_idx }, { $inc: { shared_count: 1 } });
            if (update_party.nModified === 1) {
                res.status(200).json(utils.successTrue(statusCode.OK, resMessage.UPDATE_SUCCESS));
            } else {
                res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_UPDATE));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;