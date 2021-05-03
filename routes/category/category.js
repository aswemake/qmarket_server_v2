var express = require('express');
var router = express.Router();

const utils = require('../../module/response/utils');
const resMessage = require('../../module/response/responseMessage');
const statusCode = require('../../module/response/statusCode');

const Category = require('../../schemas/category_v2');

// level 2 카테고리 리스트 조회 API
router.get('/', async (req, res) => {
    try {
        let data = [];
        let parent = await Category.find({ parent: null }).select({ name: 1 });
        for (let i = 0; i < parent.length; i++) {
            let category = new Object();
            category.parent = parent[i].name;
            category.child = await Category.find({ parent: parent[i].name }).select({ _id: 1, name: 1, img: 1});
            data.push(category);
        }
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

// level 3 카테고리 리스트 조회 API
router.get('/:category_idx', async (req, res) => {
    try {
        const { category_idx } = req.params;
        let data = [];
        let parent = await Category.find({ _id: category_idx }).select({ name: 1 });
        data = await Category.find({ parent: parent[0].name }).select({ _id: 1, name: 1 });
        res.status(200).json(utils.successTrue(statusCode.OK, resMessage.READ_SUCCESS, data));
    } catch (err) {
        console.log(err);
        res.status(200).json(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR));
    }
})

module.exports = router;