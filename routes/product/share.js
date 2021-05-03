var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

let Product = require('../../schemas/product');

router.put('/', async (req, res) => {
    try {
        let { product_idx } = req.body;
        if (!product_idx) {
            res.status(200).json(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        } else {
            let update_product = await Product.updateOne({ _id: product_idx }, { $inc: { shared_count: 1 } });
            if (update_product.nModified === 1) {
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