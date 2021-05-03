var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    console.log(req.body);
    let { refund_id , order_id } = req.body;
    console.log("refund_id : " + refund_id);
    console.log("order_id : " + order_id);
    res.render('admin/bill');
});

module.exports = router;