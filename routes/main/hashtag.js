var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Hashtag = require('../../schemas/hashtag');

router.get('/', async (req, res) => {
    try {
        let hashtag_data = [];
        var hashtag = await Hashtag.find().sort({ "count": -1 })
        for (var i = 0; i < hashtag.length; i++) {
            hashtag_data[i] = hashtag[i].name
        }
        console.log(hashtag_data);

        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, hashtag_data));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})
module.exports = router;