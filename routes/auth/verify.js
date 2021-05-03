var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');
const jwt = require('../../module/jwt');

router.get('/', async (req, res) => {
    let verify = {
        check: false
    }
    try {
        const { token } = req.query;
        console.log(verify);
        let data = jwt.verify(token);
        console.log(data);
        if (data) {
            verify.check = true;
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.VERIFY_TOKEN, verify));
        }
    } catch (err) {
        console.log('verify에서 throw한 err를 받음');
        if (err.name === 'TokenExpiredError') {
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.EXPIRED_TOKEN, verify));
        } else if (err.name === 'JsonWebTokenError') {
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.INVALID_TOKEN, verify));
        } else {
            res.status(200).json(utils.successTrue(statusCode.OK, resMessage.INVALID_TOKEN, verify));
        }
    }
})
module.exports = router;